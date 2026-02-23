import { test } from '@playwright/test'

const paths = [
  '/',
  '/login',
  '/guardian/dashboard',
  '/guardian/booking',
  '/guardian/tickets',
  '/guardian/bookings',
  '/guardian/reports',
  '/teacher/dashboard',
  '/teacher/calendar',
  '/teacher/tickets',
  '/teacher/reports',
  '/teacher/bookings',
  '/teacher/profile',
]

for (const path of paths) {
  test(`console check: ${path}`, async ({ page }) => {
    const errors: string[] = []
    const warns: string[] = []
    const fails: string[] = []
    page.on('console', (msg) => {
      const type = msg.type()
      const text = msg.text()
      if (type === 'error') errors.push(text)
      if (type === 'warning') warns.push(text)
    })
    page.on('requestfailed', (req) => {
      const f = req.failure()
      fails.push(`${req.method()} ${req.url()} :: ${f?.errorText}`)
    })
    page.on('response', (res) => {
      const status = res.status()
      if (status >= 400) {
        fails.push(`${res.request().method()} ${res.url()} :: HTTP ${status}`)
      }
    })

    await page.goto(`http://localhost:3000${path}`, { waitUntil: 'networkidle' })

    if (errors.length) {
      console.log(`ERRORS@${path}:\n` + errors.join('\n'))
    }
    if (warns.length) {
      console.log(`WARNS@${path}:\n` + warns.join('\n'))
    }
    if (fails.length) {
      console.log(`FAILED_REQ@${path}:\n` + fails.join('\n'))
    }
  })
}
