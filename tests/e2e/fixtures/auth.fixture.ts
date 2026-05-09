/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from '@playwright/test'
import { LoginPage } from '../pages/login.page'
import { TeacherDashboardPage } from '../pages/teacher-dashboard.page'
import { GuardianDashboardPage } from '../pages/guardian-dashboard.page'

/**
 * Extended test fixture with pre-configured page objects.
 * Usage:
 *   import { test, expect } from '../fixtures/auth.fixture'
 *   test('my test', async ({ loginPage, teacherDashboard }) => { ... })
 */
export const test = base.extend<{
  loginPage: LoginPage
  teacherDashboard: TeacherDashboardPage
  guardianDashboard: GuardianDashboardPage
}>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
  teacherDashboard: async ({ page }, use) => {
    await use(new TeacherDashboardPage(page))
  },
  guardianDashboard: async ({ page }, use) => {
    await use(new GuardianDashboardPage(page))
  },
})

export { expect } from '@playwright/test'
