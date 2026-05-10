import { test, expect } from '@playwright/test'

/**
 * Diagnostic test for the production /curriculum/login white-screen issue.
 * Run with: BASE_URL=https://www.edbrio.com npx playwright test tests/e2e/curriculum-login-prod.spec.ts --project chromium --headed
 *
 * Captures console + network failures so we can see exactly what's blocking the page.
 */
test('curriculum login page loads without errors', async ({ page }) => {
  const consoleMessages: string[] = []
  const networkFailures: string[] = []
  const responseStatuses: { url: string; status: number }[] = []

  page.on('console', (msg) => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`)
  })

  page.on('pageerror', (err) => {
    consoleMessages.push(`[pageerror] ${err.message}\n${err.stack}`)
  })

  page.on('requestfailed', (req) => {
    networkFailures.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText}`)
  })

  page.on('response', (res) => {
    responseStatuses.push({ url: res.url(), status: res.status() })
  })

  const baseUrl = process.env.BASE_URL ?? 'https://www.edbrio.com'
  const target = `${baseUrl}/curriculum/login`

  console.log('Navigating to:', target)

  let navError: Error | null = null
  try {
    await page.goto(target, { waitUntil: 'networkidle', timeout: 30_000 })
  } catch (e) {
    navError = e as Error
  }

  // Always dump diagnostics
  console.log('\n=== Console messages ===')
  consoleMessages.forEach((m) => console.log(m))

  console.log('\n=== Network failures ===')
  networkFailures.forEach((f) => console.log(f))

  console.log('\n=== Response statuses (last 30) ===')
  responseStatuses.slice(-30).forEach((r) => console.log(`${r.status} ${r.url}`))

  if (navError) {
    console.log('\n=== Navigation error ===')
    console.log(navError.message)
  }

  // Screenshot for visual confirmation
  await page.screenshot({ path: 'curriculum-login-prod.png', fullPage: true })

  // Assert the login form rendered
  await expect(page.getByText(/ログイン|Login/i).first()).toBeVisible({ timeout: 10_000 })
})
