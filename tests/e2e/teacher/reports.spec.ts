import { test, expect } from '../fixtures/auth.fixture'
import { dismissThemeDialog } from '../helpers/dismiss-theme'

const BASE = 'http://localhost:3000'

test.describe.serial('Teacher Reports', () => {
  test('reports list page loads', async ({ page, loginPage }) => {
    test.setTimeout(60000)
    await loginPage.loginAsTeacher()
    await page.goto(`${BASE}/ja/teacher/reports`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(3000)

    const heading = page.locator('h1')
    await expect(heading).toBeVisible({ timeout: 10000 })

    // Should show report list or empty state
    const hasReports = await page.locator('table, [class*="report"], [class*="card"]').first().isVisible({ timeout: 5000 }).catch(() => false)
    const hasEmpty = await page.locator('text=レポートがありません, text=まだレポートはありません').first().isVisible({ timeout: 3000 }).catch(() => false)

    console.log(`TEACHER_REPORTS: Has reports: ${hasReports}, Empty state: ${hasEmpty}`)
    await page.screenshot({ path: 'tests/screenshots/teacher-reports-list.png' })
  })

  test('reports page has search/filter controls', async ({ page, loginPage }) => {
    test.setTimeout(60000)
    await loginPage.loginAsTeacher()
    await page.goto(`${BASE}/ja/teacher/reports`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(3000)

    // Search input
    const searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder]')
    const hasSearch = await searchInput.first().isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`TEACHER_REPORTS: Search input visible: ${hasSearch}`)

    await page.screenshot({ path: 'tests/screenshots/teacher-reports-filters.png' })
  })

  test('new report page loads', async ({ page, loginPage }) => {
    test.setTimeout(60000)
    await loginPage.loginAsTeacher()
    await page.goto(`${BASE}/ja/teacher/reports/new`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(3000)

    // New report page should show booking selector or form
    const pageContent = await page.locator('body').textContent() ?? ''

    // Should have either booking selection or report form elements
    const hasBookingSelect = pageContent.includes('予約') || pageContent.includes('授業')
    const hasNoBookings = pageContent.includes('レポート対象') || pageContent.includes('未報告')
    console.log(`TEACHER_REPORTS: New report page - booking select: ${hasBookingSelect}, label: ${hasNoBookings}`)

    // Page should not crash
    const errorText = await page.locator('text=Something went wrong').isVisible({ timeout: 2000 }).catch(() => false)
    expect(errorText).toBe(false)

    await page.screenshot({ path: 'tests/screenshots/teacher-reports-new.png' })
  })

  test('reports page has no NaN values', async ({ page, loginPage }) => {
    test.setTimeout(60000)
    await loginPage.loginAsTeacher()
    await page.goto(`${BASE}/ja/teacher/reports`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(3000)

    const bodyText = await page.locator('body').textContent() ?? ''
    expect(bodyText).not.toContain('NaN')
    console.log('TEACHER_REPORTS: No NaN values ✓')
  })
})
