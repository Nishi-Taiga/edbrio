const fs = require('fs')
const path = require('path')

function parseVars(css) {
  const vars = {}
  const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/)
  if (rootMatch) {
    Object.assign(vars, extractVars(rootMatch[1]))
  }
  const darkMatch = css.match(/@media\s*\(prefers-color-scheme:\s*dark\)[\s\S]*?:root\s*\{([\s\S]*?)\}/)
  const dark = darkMatch ? extractVars(darkMatch[1]) : {}
  return { light: vars, dark }
}

function extractVars(block) {
  const out = {}
  for (const line of block.split(/\n|;/)) {
    const m = line.match(/--([a-zA-Z0-9\-]+):\s*([^;]+)\s*/)
    if (m) out[m[1]] = m[2]
  }
  return out
}

function hexToRgb(hex) {
  hex = hex.trim()
  const m = hex.match(/^#([0-9a-fA-F]{6})$/)
  if (!m) return null
  const n = parseInt(m[1], 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function relLuminance({ r, g, b }) {
  const srgb = [r, g, b].map(v => v / 255)
  const lin = srgb.map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
}

function contrast(hex1, hex2) {
  const a = hexToRgb(hex1)
  const b = hexToRgb(hex2)
  if (!a || !b) return null
  const L1 = relLuminance(a)
  const L2 = relLuminance(b)
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

function fmt(n) { return n ? n.toFixed(2) : 'n/a' }

const cssPath = path.join(__dirname, '..', 'src', 'app', 'landing.css')
const css = fs.readFileSync(cssPath, 'utf8')
const vars = parseVars(css)

function check(mode, v) {
  const bg = v['bg']
  const text = v['text']
  const brand = v['brand']
  const brandInk = v['brand-ink']
  const muted = v['muted']
  const border = v['border']
  const results = {
    mode,
    'text vs bg': fmt(contrast(text, bg)),
    'muted vs bg': fmt(contrast(muted, bg)),
    'border vs bg': fmt(contrast(border, bg)),
    'CTA text vs brand': fmt(contrast(brandInk, brand)),
  }
  return results
}

console.log(JSON.stringify({
  light: check('light', vars.light),
  dark: check('dark', Object.assign({}, vars.light, vars.dark)),
}, null, 2))

