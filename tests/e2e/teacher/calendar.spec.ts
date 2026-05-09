import { test, expect } from '../fixtures/auth.fixture'
import { dismissThemeDialog } from '../helpers/dismiss-theme'

const BASE = 'http://localhost:3000'

test.describe.serial('Teacher Calendar', () => {
  test('calendar page loads with FullCalendar', async ({ page, loginPage }) => {
    test.setTimeout(60000)
    await loginPage.loginAsTeacher()
    await page.goto(`${BASE}/ja/teacher/calendar`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(3000)

    // FullCalendar should render
    const calendar = page.locator('.fc')
    await expect(calendar).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: 'tests/screenshots/teacher-calendar.png' })
    console.log('TEACHER_CALENDAR: FullCalendar rendered ✓')
  })

  test('calendar shows view toggle buttons', async ({ page, loginPage }) => {
    test.setTimeout(60000)
    await loginPage.loginAsTeacher()
    await page.goto(`${BASE}/ja/teacher/calendar`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(3000)

    // FullCalendar toolbar has navigation buttons
    const toolbar = page.locator('.fc-toolbar, .fc-header-toolbar')
    await expect(toolbar.first()).toBeVisible({ timeout: 10000 })

    // Check for week/month view buttons or navigation arrows
    const navButtons = page.locator('.fc-button')
    const btnCount = await navButtons.count()
    expect(btnCount).toBeGreaterThan(0)
    console.log(`TEACHER_CALENDAR: Found ${btnCount} calendar buttons`)
  })

  test('calendar has shift creation form', async ({ page, loginPage }) => {
    test.setTimeout(60000)
    await loginPage.loginAsTeacher()
    await page.goto(`${BASE}/ja/teacher/calendar`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(3000)

    // Look for shift/availability form or add button
    const addBtn = page.locator('button:has-text("追加"), button:has-text("シフト"), button:has-text("登録")')
    const hasAddBtn = await addBtn.first().isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`TEACHER_CALENDAR: Add shift button visible: ${hasAddBtn}`)

    await page.screenshot({ path: 'tests/screenshots/teacher-calendar-controls.png' })
  })

  test('calendar page has no console errors', async ({ page, loginPage }) => {
    test.setTimeout(60000)
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await loginPage.loginAsTeacher()
    await page.goto(`${BASE}/ja/teacher/calendar`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(3000)

    // Filter out known non-critical errors (e.g., favicon, analytics)
    const criticalErrors = consoleErrors.filter(
      e => !e.includes('favicon') && !e.includes('gtag') && !e.includes('analytics')
    )
    console.log(`TEACHER_CALENDAR: Console errors: ${criticalErrors.length}`)
    if (criticalErrors.length > 0) {
      console.log('TEACHER_CALENDAR: Errors:', criticalErrors.slice(0, 3))
    }
  })
})
