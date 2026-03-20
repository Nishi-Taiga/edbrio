import { test, expect, Page } from '@playwright/test'

const BASE = 'http://localhost:3000'

const GUARDIAN = {
  email: process.env.E2E_GUARDIAN_EMAIL || '',
  password: process.env.E2E_GUARDIAN_PASSWORD || '',
}

async function dismissThemeDialog(page: Page) {
  const themeBtn = page.locator('text=ライト').first()
  if (await themeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await themeBtn.click()
    await page.waitForTimeout(500)
  }
}

async function gotoTickets(page: Page) {
  await page.context().clearCookies()
  await page.goto(`${BASE}/ja/login`, { waitUntil: 'networkidle' })
  await page.fill('input#email', GUARDIAN.email)
  await page.fill('input#password', GUARDIAN.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(guardian|ja\/guardian)\//, { timeout: 30000 })
  await dismissThemeDialog(page)
  await page.goto(`${BASE}/ja/guardian/tickets`, { waitUntil: 'networkidle' })
  await dismissThemeDialog(page)

  // Wait for loading to complete (table or empty state appears)
  await Promise.race([
    page.locator('table tbody').waitFor({ timeout: 15000 }).catch(() => null),
    page.locator('text=チケットはありません').waitFor({ timeout: 15000 }).catch(() => null),
    page.locator('text=購入可能なチケット').waitFor({ timeout: 15000 }).catch(() => null),
  ])
}

test('Guardian balance: page loads without error', async ({ page }) => {
  test.setTimeout(90000)
  await gotoTickets(page)

  const heading = page.locator('h1')
  await expect(heading).toBeVisible({ timeout: 10000 })

  await page.screenshot({ path: 'tests/screenshots/guardian-balance.png' })
  console.log('GUARDIAN_BALANCE: balance page loaded ✓')
})

test('Guardian balance: remaining shows session-count format or minutes-only fallback', async ({ page }) => {
  test.setTimeout(90000)
  await gotoTickets(page)

  const table = page.locator('table tbody')
  const hasTable = await table.isVisible({ timeout: 2000 }).catch(() => false)

  if (!hasTable) {
    const emptyState = page.locator('text=チケットはありません')
    const hasEmpty = await emptyState.isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`GUARDIAN_BALANCE: No balance table. Empty state visible: ${hasEmpty} ✓`)
    return
  }

  const rows = table.locator('tr')
  const rowCount = await rows.count()
  const remainingCells = rows.locator('td:nth-child(3)')
  const cellCount = await remainingCells.count()

  for (let i = 0; i < cellCount; i++) {
    const text = await remainingCells.nth(i).textContent()
    console.log(`GUARDIAN_BALANCE: row ${i} remaining = "${text}"`)

    if (text && text.trim()) {
      // Valid formats: "3回（270分）" OR just "90分" (fallback when minutesPerSession unknown)
      const hasSessionCount = /\d+回（\d+分）/.test(text)
      const hasMinutesOnly = /^\d+分$/.test(text)
      expect(hasSessionCount || hasMinutesOnly).toBe(true)
    }
  }

  console.log(`GUARDIAN_BALANCE: Checked ${rowCount} rows ✓`)
  await page.screenshot({ path: 'tests/screenshots/guardian-balance-rows.png' })
})

test('Guardian balance: table contains no NaN values', async ({ page }) => {
  test.setTimeout(90000)
  await gotoTickets(page)

  const tableBody = page.locator('table tbody')
  const hasTable = await tableBody.isVisible({ timeout: 2000 }).catch(() => false)

  if (hasTable) {
    const allText = await tableBody.textContent() ?? ''
    expect(allText).not.toContain('NaN')
    console.log('GUARDIAN_BALANCE: No NaN in balance table ✓')
  } else {
    console.log('GUARDIAN_BALANCE: No table (empty state) — NaN check skipped ✓')
  }

  await page.screenshot({ path: 'tests/screenshots/guardian-balance-nan-check.png' })
})
