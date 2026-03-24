import type { Page } from '@playwright/test'
import { dismissThemeDialog } from '../helpers/dismiss-theme'

const BASE = 'http://localhost:3000'

export class TeacherDashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${BASE}/ja/teacher/dashboard`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(this.page)
  }

  async navigateTo(path: string) {
    await this.page.goto(`${BASE}/ja/teacher/${path}`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(this.page)
  }

  async navigateToCurriculum() {
    await this.navigateTo('curriculum')
  }

  async navigateToCalendar() {
    await this.navigateTo('calendar')
  }

  async navigateToReports() {
    await this.navigateTo('reports')
  }

  async navigateToTickets() {
    await this.navigateTo('tickets')
  }

  async navigateToChat() {
    await this.navigateTo('chat')
  }

  async navigateToProfile() {
    await this.navigateTo('profile')
  }

  get heading() {
    return this.page.locator('h1')
  }
}
