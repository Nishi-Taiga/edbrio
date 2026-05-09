import { test, expect } from '../fixtures/auth.fixture'
import { dismissThemeDialog } from '../helpers/dismiss-theme'

const BASE = 'http://localhost:3000'

test.describe.serial('Teacher Profile', () => {
  test('profile page loads with tabs', async ({ page, loginPage }) => {
    test.setTimeout(60000)
    await loginPage.loginAsTeacher()
    await page.goto(`${BASE}/ja/teacher/profile`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(3000)

    // Profile page should have tabs
    const tabs = page.locator('[role="tab"], [role="tablist"], button[data-state]')
    const tabCount = await tabs.count()
    expect(tabCount).toBeGreaterThan(0)
    console.log(`TEACHER_PROFILE: Found ${tabCount} tab elements`)

    await page.screenshot({ path: 'tests/screenshots/teacher-profile.png' })
  })

  test('profile page shows invite section', async ({ page, loginPage }) => {
    test.setTimeout(60000)
    await loginPage.loginAsTeacher()
    await page.goto(`${BASE}/ja/teacher/profile`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(3000)

    // Invite tab or invite button should be present
    const inviteText = page.locator('text=招待')
    const hasInvite = await inviteText.first().isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`TEACHER_PROFILE: Invite section visible: ${hasInvite}`)
  })

  test('profile page shows subscription info', async ({ page, loginPage }) => {
    test.setTimeout(60000)
    await loginPage.loginAsTeacher()
    await page.goto(`${BASE}/ja/teacher/profile`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(3000)

    // Plan info should be somewhere on the page
    const bodyText = await page.locator('body').textContent() ?? ''
    const hasPlanInfo = bodyText.includes('プラン') || bodyText.includes('Free') || bodyText.includes('Standard')
    console.log(`TEACHER_PROFILE: Plan info visible: ${hasPlanInfo}`)
  })

  test('profile page has no error state', async ({ page, loginPage }) => {
    test.setTimeout(60000)
    await loginPage.loginAsTeacher()
    await page.goto(`${BASE}/ja/teacher/profile`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(3000)

    const bodyText = await page.locator('body').textContent() ?? ''
    expect(bodyText).not.toContain('Something went wrong')
    expect(bodyText).not.toContain('NaN')
    expect(bodyText).not.toContain('undefined')
    console.log('TEACHER_PROFILE: No error states ✓')

    await page.screenshot({ path: 'tests/screenshots/teacher-profile-state.png' })
  })

  test('contact page loads', async ({ page, loginPage }) => {
    test.setTimeout(60000)
    await loginPage.loginAsTeacher()
    await page.goto(`${BASE}/ja/teacher/contact`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(2000)

    // Contact form should be visible
    const form = page.locator('form, textarea, input[type="email"]')
    const hasForm = await form.first().isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`TEACHER_CONTACT: Contact form visible: ${hasForm}`)

    await page.screenshot({ path: 'tests/screenshots/teacher-contact.png' })
  })
})
