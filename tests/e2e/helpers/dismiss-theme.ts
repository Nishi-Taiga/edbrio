import type { Page } from '@playwright/test'

/**
 * Dismisses the theme selection dialog that appears on first visit.
 * Clicks the "ライト" (Light) button if visible.
 */
export async function dismissThemeDialog(page: Page) {
  const themeBtn = page.locator('text=ライト').first()
  if (await themeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await themeBtn.click()
    await page.waitForTimeout(500)
  }
}
