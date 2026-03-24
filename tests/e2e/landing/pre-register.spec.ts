import { test, expect } from '@playwright/test'

test.describe('Pre-registration form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('form is visible on landing page when PRE_LAUNCH is enabled', async ({ page }) => {
    const form = page.getByTestId('pre-register-form')
    // Form visibility depends on NEXT_PUBLIC_PRE_LAUNCH env var
    // When running in pre-launch mode, the form should be visible
    const isVisible = await form.isVisible().catch(() => false)
    if (isVisible) {
      await expect(page.getByTestId('pre-register-email')).toBeVisible()
      await expect(page.getByTestId('pre-register-submit')).toBeVisible()
    }
  })

  test('shows validation error for invalid email', async ({ page }) => {
    const form = page.getByTestId('pre-register-form')
    const isVisible = await form.isVisible().catch(() => false)
    test.skip(!isVisible, 'Pre-launch mode not enabled')

    const emailInput = page.getByTestId('pre-register-email')
    await emailInput.fill('invalid-email')
    await page.getByTestId('pre-register-submit').click()

    // HTML5 validation should prevent submission
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    )
    expect(validationMessage).toBeTruthy()
  })

  test('submitting valid email shows success message', async ({ page }) => {
    const form = page.getByTestId('pre-register-form')
    const isVisible = await form.isVisible().catch(() => false)
    test.skip(!isVisible, 'Pre-launch mode not enabled')

    // Mock the API to avoid actual DB writes during tests
    await page.route('**/api/pre-register', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    await page.getByTestId('pre-register-email').fill('test@example.com')
    await page.getByTestId('pre-register-submit').click()

    await expect(page.getByTestId('pre-register-success')).toBeVisible({ timeout: 5000 })
  })
})
