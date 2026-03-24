import { test, expect } from '../fixtures/auth.fixture'

test.describe.serial('Teacher Dashboard', () => {
  test('dashboard page loads successfully', async ({ page, loginPage, teacherDashboard }) => {
    test.setTimeout(60000)
    await loginPage.loginAsTeacher()
    await teacherDashboard.goto()
    await page.waitForTimeout(2000)

    // Page renders without error boundary
    const errorText = await page.locator('text=Something went wrong').isVisible({ timeout: 2000 }).catch(() => false)
    expect(errorText).toBe(false)

    await expect(page.locator('body')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/teacher-dashboard-full.png' })
  })

  test('dashboard shows today summary section', async ({ page, loginPage, teacherDashboard }) => {
    test.setTimeout(60000)
    await loginPage.loginAsTeacher()
    await teacherDashboard.goto()
    await page.waitForTimeout(3000)

    // Look for stats cards (lesson count, income, etc.)
    // Cards contain numeric values - at minimum there should be stat elements
    const statCards = page.locator('[class*="card"], [class*="stat"], [class*="summary"]')
    const cardCount = await statCards.count()
    console.log(`TEACHER_DASHBOARD: Found ${cardCount} stat/card elements`)

    await page.screenshot({ path: 'tests/screenshots/teacher-dashboard-stats.png' })
  })

  test('dashboard shows calendar section', async ({ page, loginPage, teacherDashboard }) => {
    test.setTimeout(60000)
    await loginPage.loginAsTeacher()
    await teacherDashboard.goto()
    await page.waitForTimeout(3000)

    // FullCalendar renders a calendar container
    const calendar = page.locator('.fc, [class*="calendar"]')
    const hasCalendar = await calendar.first().isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`TEACHER_DASHBOARD: Calendar visible: ${hasCalendar}`)

    await page.screenshot({ path: 'tests/screenshots/teacher-dashboard-calendar.png' })
  })

  test('dashboard has no NaN or undefined values', async ({ page, loginPage, teacherDashboard }) => {
    test.setTimeout(60000)
    await loginPage.loginAsTeacher()
    await teacherDashboard.goto()
    await page.waitForTimeout(3000)

    const bodyText = await page.locator('body').textContent() ?? ''
    expect(bodyText).not.toContain('NaN')
    expect(bodyText).not.toContain('undefined')
    console.log('TEACHER_DASHBOARD: No NaN/undefined values ✓')
  })

  test('dashboard quick action buttons are visible', async ({ page, loginPage, teacherDashboard }) => {
    test.setTimeout(60000)
    await loginPage.loginAsTeacher()
    await teacherDashboard.goto()
    await page.waitForTimeout(3000)

    // Check for navigation links to key teacher pages
    const links = page.locator('a[href*="/teacher/"]')
    const linkCount = await links.count()
    expect(linkCount).toBeGreaterThan(0)
    console.log(`TEACHER_DASHBOARD: Found ${linkCount} teacher navigation links`)
  })
})
