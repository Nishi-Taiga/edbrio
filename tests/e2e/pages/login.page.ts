import type { Page } from '@playwright/test'
import { dismissThemeDialog } from '../helpers/dismiss-theme'

const BASE = 'http://localhost:3000'

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${BASE}/ja/login`, { waitUntil: 'networkidle' })
  }

  async loginAsTeacher() {
    const email = process.env.E2E_TEACHER_EMAIL || ''
    const password = process.env.E2E_TEACHER_PASSWORD || ''
    await this.login(email, password, /\/(teacher|ja\/teacher)\//)
  }

  async loginAsGuardian() {
    const email = process.env.E2E_GUARDIAN_EMAIL || ''
    const password = process.env.E2E_GUARDIAN_PASSWORD || ''
    await this.login(email, password, /\/(guardian|ja\/guardian)\//)
  }

  private async login(email: string, password: string, urlPattern: RegExp) {
    await this.goto()
    await this.page.fill('input#email', email)
    await this.page.fill('input#password', password)
    await this.page.click('button[type="submit"]')
    await this.page.waitForURL(urlPattern, { timeout: 30000 })
    await dismissThemeDialog(this.page)
  }
}
