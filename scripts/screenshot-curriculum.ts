/**
 * Quick screenshot of the curriculum page for verification.
 * Usage: TEACHER_PASSWORD=vidal0522 npx tsx scripts/screenshot-curriculum.ts
 */
import { chromium } from 'playwright'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEACHER_EMAIL = 'tai.nishi1998@gmail.com'
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || 'vidal0522'
const PROFILE_ID = '9077784e-a517-4e25-9520-d92b7a77ebd0' // 生徒A

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'ja',
  })
  const page = await context.newPage()

  // Login
  console.log('Logging in...')
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)

  // Debug: take screenshot of login page and log HTML
  await page.screenshot({ path: 'screenshots/debug_login.png' })
  const inputCount = await page.$$('input')
  console.log('Found inputs:', inputCount.length)
  const pageContent = await page.content()
  const hasEmail = pageContent.includes('type="email"')
  console.log('Has email input in HTML:', hasEmail)
  console.log('Current URL:', page.url())

  // Dismiss theme modal if shown
  await page.evaluate(() => {
    localStorage.setItem('edbrio-theme-chosen', 'true')
  })

  // Try to reload after setting localStorage
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)

  // Try filling with more flexible selectors
  const emailInput = page.locator('input[type="email"], input#email, input[name="email"]').first()
  const passwordInput = page.locator('input[type="password"], input#password').first()

  if (await emailInput.count() === 0) {
    console.log('No email input found! Taking debug screenshot...')
    await page.screenshot({ path: 'screenshots/debug_no_email.png' })
    await browser.close()
    return
  }

  await emailInput.fill(TEACHER_EMAIL)
  await passwordInput.fill(TEACHER_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(5000)

  console.log('After login, URL:', page.url())

  // Navigate to curriculum page
  console.log('Navigating to curriculum page...')
  await page.goto(`${BASE_URL}/teacher/curriculum/${PROFILE_ID}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)

  console.log('Current URL:', page.url())

  // Take screenshot
  await page.screenshot({ path: 'screenshots/curriculum_page.png', fullPage: true })
  console.log('Screenshot saved to screenshots/curriculum_page.png')

  await page.screenshot({ path: 'screenshots/curriculum_page_viewport.png', fullPage: false })
  console.log('Viewport screenshot saved to screenshots/curriculum_page_viewport.png')

  await browser.close()
}

main().catch(console.error)
