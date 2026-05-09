import type { Page } from '@playwright/test'
import { dismissThemeDialog } from '../helpers/dismiss-theme'

const BASE = 'http://localhost:3000'

export class GuardianDashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${BASE}/ja/guardian/dashboard`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(this.page)
  }

  async navigateTo(path: string) {
    await this.page.goto(`${BASE}/ja/guardian/${path}`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(this.page)
  }

  async navigateToTickets() {
    await this.navigateTo('tickets')
  }

  async navigateToBooking() {
    await this.navigateTo('booking')
  }

  async navigateToReports() {
    await this.navigateTo('reports')
  }

  async navigateToChat() {
    await this.navigateTo('chat')
  }

  get heading() {
    return this.page.locator('h1')
  }
}
