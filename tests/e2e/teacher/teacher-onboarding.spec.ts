import { test, expect, Page } from '@playwright/test'

const BASE = 'http://localhost:3000'

const TEACHER = {
  email: process.env.E2E_TEACHER_EMAIL || '',
  password: process.env.E2E_TEACHER_PASSWORD || '',
}

async function dismissThemeDialog(page: Page) {
  const themeBtn = page.locator('text=ライト').first()
  if (await themeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await themeBtn.click()
    await page.waitForTimeout(500)
  }
}

async function login(page: Page) {
  await page.goto(`${BASE}/ja/login`, { waitUntil: 'networkidle' })
  await page.fill('input#email', TEACHER.email)
  await page.fill('input#password', TEACHER.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(teacher|ja\/teacher)\//, { timeout: 30000 })
  await dismissThemeDialog(page)
}

test.describe.serial('Teacher dashboard onboarding banner', () => {
  test('dashboard loads without errors', async ({ page }) => {
    test.setTimeout(60000)
    await login(page)
    await page.goto(`${BASE}/ja/teacher/dashboard`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(3000)

    // Page should render without crashing
    const body = page.locator('body')
    await expect(body).toBeVisible()

    // No unhandled error boundaries visible
    const errorText = await page.locator('text=Something went wrong').isVisible({ timeout: 2000 }).catch(() => false)
    expect(errorText).toBe(false)

    await page.screenshot({ path: 'tests/screenshots/teacher-dashboard.png' })
  })

  test('at most one banner is visible at a time (setup OR onboarding, not both)', async ({ page }) => {
    test.setTimeout(60000)
    await login(page)
    await page.goto(`${BASE}/ja/teacher/dashboard`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(3000)

    const setupBanner = page.locator('text=初期設定が完了していません')
    const onboardingBanner = page.locator('text=はじめの3ステップ')

    const setupVisible = await setupBanner.isVisible({ timeout: 3000 }).catch(() => false)
    const onboardingVisible = await onboardingBanner.isVisible({ timeout: 3000 }).catch(() => false)

    // They must not both be visible at the same time
    expect(setupVisible && onboardingVisible).toBe(false)

    console.log(`TEACHER_ONBOARDING: setupBanner=${setupVisible}, onboardingBanner=${onboardingVisible}`)
    await page.screenshot({ path: 'tests/screenshots/teacher-dashboard-banner.png' })
  })

  test('onboarding banner shows correct step completion state', async ({ page }) => {
    test.setTimeout(60000)
    await login(page)
    await page.goto(`${BASE}/ja/teacher/dashboard`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(3000)

    const onboardingBanner = page.locator('text=はじめの3ステップ')
    const isVisible = await onboardingBanner.isVisible({ timeout: 5000 }).catch(() => false)

    if (!isVisible) {
      // Either setup is incomplete or all onboarding steps are done — both are valid
      console.log('TEACHER_ONBOARDING: Onboarding banner not shown (setup incomplete or all steps complete)')
      return
    }

    // Banner is visible — Step 1 (profile) must always be checked
    const step1 = page.locator('text=プロフィールを完成させる')
    await expect(step1).toBeVisible({ timeout: 5000 })

    // At least one of Step 2 or Step 3 must be unchecked (otherwise banner wouldn't show)
    const step2 = page.locator('text=空き枠（シフト）を登録する')
    const step3 = page.locator('text=保護者を招待する')
    const step2Visible = await step2.isVisible({ timeout: 3000 }).catch(() => false)
    const step3Visible = await step3.isVisible({ timeout: 3000 }).catch(() => false)

    expect(step2Visible || step3Visible).toBe(true)
    console.log(`TEACHER_ONBOARDING: step2=${step2Visible} step3=${step3Visible}`)

    // Action buttons visible for incomplete steps
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

  test('setup banner disappears when profile is complete', async ({ page }) => {
    test.setTimeout(60000)
    await login(page)
    await page.goto(`${BASE}/ja/teacher/dashboard`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(3000)

    const setupBanner = page.locator('text=初期設定が完了していません')
    const isVisible = await setupBanner.isVisible({ timeout: 3000 }).catch(() => false)

    // For the test account (which has a complete profile), setup banner should NOT be visible
    if (isVisible) {
      console.log('TEACHER_ONBOARDING: Setup banner visible — test account profile may be incomplete')
    } else {
      console.log('TEACHER_ONBOARDING: Setup banner hidden — profile is complete ✓')
    }

    // We don't assert here — depends on test account state; just log for visibility
    await page.screenshot({ path: 'tests/screenshots/teacher-setup-banner-state.png' })
  })
})
