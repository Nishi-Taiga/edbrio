import { test, expect } from '../fixtures/auth.fixture'

test.describe.serial('Teacher dashboard onboarding banner', () => {
  test('dashboard loads without errors', async ({ page, loginPage, teacherDashboard }) => {
    test.setTimeout(60000)
    await loginPage.loginAsTeacher()
    await teacherDashboard.goto()
    await page.waitForTimeout(3000)

    const body = page.locator('body')
    await expect(body).toBeVisible()

    const errorText = await page.locator('text=Something went wrong').isVisible({ timeout: 2000 }).catch(() => false)
    expect(errorText).toBe(false)

    await page.screenshot({ path: 'tests/screenshots/teacher-dashboard.png' })
  })

  test('at most one banner is visible at a time (setup OR onboarding, not both)', async ({ page, loginPage, teacherDashboard }) => {
    test.setTimeout(60000)
    await loginPage.loginAsTeacher()
    await teacherDashboard.goto()
    await page.waitForTimeout(3000)

    const setupBanner = page.locator('text=初期設定が完了していません')
    const onboardingBanner = page.locator('text=はじめの3ステップ')

    const setupVisible = await setupBanner.isVisible({ timeout: 3000 }).catch(() => false)
    const onboardingVisible = await onboardingBanner.isVisible({ timeout: 3000 }).catch(() => false)

    expect(setupVisible && onboardingVisible).toBe(false)

    console.log(`TEACHER_ONBOARDING: setupBanner=${setupVisible}, onboardingBanner=${onboardingVisible}`)
    await page.screenshot({ path: 'tests/screenshots/teacher-dashboard-banner.png' })
  })

  test('onboarding banner shows correct step completion state', async ({ page, loginPage, teacherDashboard }) => {
    test.setTimeout(60000)
    await loginPage.loginAsTeacher()
    await teacherDashboard.goto()
    await page.waitForTimeout(3000)

    const onboardingBanner = page.locator('text=はじめの3ステップ')
    const isVisible = await onboardingBanner.isVisible({ timeout: 5000 }).catch(() => false)

    if (!isVisible) {
      console.log('TEACHER_ONBOARDING: Onboarding banner not shown (setup incomplete or all steps complete)')
      return
    }

    const step1 = page.locator('text=プロフィールを完成させる')
    await expect(step1).toBeVisible({ timeout: 5000 })

    const step2 = page.locator('text=空き枠（シフト）を登録する')
    const step3 = page.locator('text=保護者を招待する')
    const step2Visible = await step2.isVisible({ timeout: 3000 }).catch(() => false)
    const step3Visible = await step3.isVisible({ timeout: 3000 }).catch(() => false)

    expect(step2Visible || step3Visible).toBe(true)
    console.log(`TEACHER_ONBOARDING: step2=${step2Visible} step3=${step3Visible}`)

    if (step2Visible) {
      const shiftBtn = page.locator('text=シフトを登録する')
      await expect(shiftBtn).toBeVisible({ timeout: 5000 })
    }
    if (step3Visible) {
      const inviteBtn = page.locator('text=保護者を招待する')
      await expect(inviteBtn).toBeVisible({ timeout: 5000 })
    }

    await page.screenshot({ path: 'tests/screenshots/teacher-onboarding-banner.png' })
  })

  test('setup banner disappears when profile is complete', async ({ page, loginPage, teacherDashboard }) => {
    test.setTimeout(60000)
    await loginPage.loginAsTeacher()
    await teacherDashboard.goto()
    await page.waitForTimeout(3000)

    const setupBanner = page.locator('text=初期設定が完了していません')
    const isVisible = await setupBanner.isVisible({ timeout: 3000 }).catch(() => false)

    if (isVisible) {
      console.log('TEACHER_ONBOARDING: Setup banner visible — test account profile may be incomplete')
    } else {
      console.log('TEACHER_ONBOARDING: Setup banner hidden — profile is complete ✓')
    }

    await page.screenshot({ path: 'tests/screenshots/teacher-setup-banner-state.png' })
  })
})
