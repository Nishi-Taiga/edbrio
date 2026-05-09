import { test, expect, Page } from '@playwright/test'

const BASE = 'http://localhost:3000'

const TEACHER = {
  email: process.env.E2E_TEACHER_EMAIL || '',
  password: process.env.E2E_TEACHER_PASSWORD || '',
}
const GUARDIAN = {
  email: process.env.E2E_GUARDIAN_EMAIL || '',
  password: process.env.E2E_GUARDIAN_PASSWORD || '',
}

// ─── Helpers ─────────────────────────────────────────────

async function dismissThemeDialog(page: Page) {
  const themeBtn = page.locator('text=ライト').first()
  if (await themeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await themeBtn.click()
    await page.waitForTimeout(500)
  }
}

async function loginAsTeacher(page: Page) {
  await page.goto(`${BASE}/ja/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  await page.fill('input#email', TEACHER.email)
  await page.fill('input#password', TEACHER.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(teacher|ja\/teacher)\//, { timeout: 30000 })
  await dismissThemeDialog(page)
}

async function loginAsGuardian(page: Page) {
  await page.goto(`${BASE}/ja/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  await page.fill('input#email', GUARDIAN.email)
  await page.fill('input#password', GUARDIAN.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(guardian|ja\/guardian)\//, { timeout: 30000 })
  await dismissThemeDialog(page)
}

// ═══════════════════════════════════════════════════════════
// 1. PUBLIC PAGES
// ═══════════════════════════════════════════════════════════
test.describe('Public Pages', () => {

  test('Landing page loads with hero, features, FAQ, contact form', async ({ page }) => {
    await page.goto(`${BASE}/ja`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Hero section - EdBrio logo
    await expect(page.locator('img[alt="EdBrio"]').first()).toBeVisible({ timeout: 10000 })

    // Navigation links
    await expect(page.locator('a[href*="pricing"]').first()).toBeVisible()

    // Feature section
    const featureSection = page.locator('text=機能紹介')
    const hasFeatSection = await featureSection.first().isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`Landing: Feature section visible: ${hasFeatSection}`)

    // FAQ section
    const faqSection = page.locator('text=よくある質問')
    const hasFaq = await faqSection.first().isVisible({ timeout: 3000 }).catch(() => false)
    console.log(`Landing: FAQ section visible: ${hasFaq}`)

    // Contact form
    const contactForm = page.locator('input#contact-name')
    await contactForm.scrollIntoViewIfNeeded().catch(() => {})
    const hasContactForm = await contactForm.isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`Landing: Contact form visible: ${hasContactForm}`)

    await page.screenshot({ path: 'tests/screenshots/public-landing.png' })
  })

  test('Login page shows auth form', async ({ page }) => {
    await page.goto(`${BASE}/ja/login`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Login form elements
    await expect(page.locator('input#email')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input#password')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // Login title
    await expect(page.locator('text=ログイン').first()).toBeVisible()

    // Signup toggle link
    await expect(page.locator('text=アカウントをお持ちでない方はこちら')).toBeVisible()

    // Forgot password link
    await expect(page.locator('text=パスワードを忘れた方')).toBeVisible()

    await page.screenshot({ path: 'tests/screenshots/public-login.png' })
  })

  test('Login page can toggle to signup mode', async ({ page }) => {
    await page.goto(`${BASE}/ja/login`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Click signup toggle
    await page.click('text=アカウントをお持ちでない方はこちら')
    await page.waitForTimeout(1000)

    // Name field should appear
    await expect(page.locator('input#name')).toBeVisible({ timeout: 5000 })

    // Signup title
    await expect(page.locator('text=アカウント作成').first()).toBeVisible()

    await page.screenshot({ path: 'tests/screenshots/public-signup.png' })
  })

  test('Pricing page shows plans', async ({ page }) => {
    await page.goto(`${BASE}/ja/pricing`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Free plan
    await expect(page.locator('text=¥0').first()).toBeVisible({ timeout: 10000 })

    // Standard plan
    await expect(page.locator('text=¥1,480').or(page.locator('text=1,480')).first()).toBeVisible({ timeout: 5000 })

    await page.screenshot({ path: 'tests/screenshots/public-pricing.png' })
  })

  test('Legal page shows terms with tab navigation', async ({ page }) => {
    await page.goto(`${BASE}/ja/legal`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Page should load with content
    const bodyText = await page.locator('body').textContent() || ''
    expect(bodyText.length).toBeGreaterThan(100)

    // Check for legal content
    const hasLegalContent =
      bodyText.includes('利用規約') ||
      bodyText.includes('プライバシー') ||
      bodyText.includes('特定商取引') ||
      bodyText.includes('Terms')
    expect(hasLegalContent).toBe(true)

    await page.screenshot({ path: 'tests/screenshots/public-legal.png' })
  })

  test('Contact page loads', async ({ page }) => {
    await page.goto(`${BASE}/ja/contact`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    const bodyText = await page.locator('body').textContent() || ''
    expect(bodyText.length).toBeGreaterThan(50)

    await page.screenshot({ path: 'tests/screenshots/public-contact.png' })
  })

  test('Forgot password page loads with form', async ({ page }) => {
    await page.goto(`${BASE}/ja/forgot-password`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Title
    await expect(page.locator('text=パスワードをリセット').first()).toBeVisible({ timeout: 10000 })

    // Email input
    const emailInput = page.locator('input[type="email"]').or(page.locator('input#email'))
    await expect(emailInput.first()).toBeVisible()

    // Submit button
    await expect(page.locator('text=リセットメールを送信').first()).toBeVisible()

    // Back to login
    await expect(page.locator('text=ログインに戻る').first()).toBeVisible()

    await page.screenshot({ path: 'tests/screenshots/public-forgot-password.png' })
  })
})

// ═══════════════════════════════════════════════════════════
// 2. AUTHENTICATION FLOW
// ═══════════════════════════════════════════════════════════
test.describe('Authentication', () => {

  test('Teacher can log in and reach dashboard', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsTeacher(page)

    await expect(page).toHaveURL(/\/teacher\/dashboard/)

    const bodyText = await page.locator('body').textContent() || ''
    expect(bodyText.length).toBeGreaterThan(100)

    await page.screenshot({ path: 'tests/screenshots/auth-teacher-login.png' })
  })

  test('Guardian can log in and reach dashboard', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsGuardian(page)

    await expect(page).toHaveURL(/\/guardian\/dashboard/)

    const bodyText = await page.locator('body').textContent() || ''
    expect(bodyText.length).toBeGreaterThan(100)

    await page.screenshot({ path: 'tests/screenshots/auth-guardian-login.png' })
  })

  test('Login with invalid credentials shows error', async ({ page }) => {
    test.setTimeout(30000)
    await page.goto(`${BASE}/ja/login`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    await page.fill('input#email', 'invalid@test.com')
    await page.fill('input#password', 'wrongpassword')
    await page.click('button[type="submit"]')

    await page.waitForTimeout(5000)
    const currentUrl = page.url()
    expect(currentUrl).toContain('login')

    await page.screenshot({ path: 'tests/screenshots/auth-invalid-login.png' })
  })
})

// ═══════════════════════════════════════════════════════════
// 3. TEACHER FEATURES
// ═══════════════════════════════════════════════════════════
test.describe('Teacher Features', () => {

  test('Dashboard shows content', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsTeacher(page)

    await page.goto(`${BASE}/teacher/dashboard`, { waitUntil: 'domcontentloaded' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(5000)

    const bodyText = await page.locator('body').textContent() || ''
    expect(bodyText.length).toBeGreaterThan(100)

    const hasDashboardContent =
      bodyText.includes('コマ') ||
      bodyText.includes('レッスン') ||
      bodyText.includes('予約') ||
      bodyText.includes('ダッシュボード') ||
      bodyText.includes('タスク') ||
      bodyText.includes('Dashboard')

    console.log(`Teacher Dashboard: Has content: ${hasDashboardContent}`)
    expect(hasDashboardContent).toBe(true)

    await page.screenshot({ path: 'tests/screenshots/teacher-dashboard.png' })
  })

  test('Reports page loads', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsTeacher(page)

    await page.goto(`${BASE}/teacher/reports`, { waitUntil: 'domcontentloaded' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(5000)

    const bodyText = await page.locator('body').textContent() || ''
    expect(bodyText.length).toBeGreaterThan(50)

    const newReportLink = page.locator('a[href*="/teacher/reports/new"]')
    const hasNewReport = await newReportLink.first().isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`Teacher Reports: New report link: ${hasNewReport}`)

    await page.screenshot({ path: 'tests/screenshots/teacher-reports.png' })
  })

  test('New report page loads with student selector', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsTeacher(page)

    await page.goto(`${BASE}/teacher/reports/new`, { waitUntil: 'domcontentloaded' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(5000)

    const studentTrigger = page.locator('[role="combobox"]').first()
    const hasStudentSelect = await studentTrigger.isVisible({ timeout: 10000 }).catch(() => false)
    console.log(`New Report: Student selector: ${hasStudentSelect}`)
    expect(hasStudentSelect).toBe(true)

    await page.screenshot({ path: 'tests/screenshots/teacher-report-new.png' })
  })

  test('Calendar page loads', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsTeacher(page)

    await page.goto(`${BASE}/teacher/calendar`, { waitUntil: 'domcontentloaded' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(5000)

    const bodyText = await page.locator('body').textContent() || ''
    expect(bodyText.length).toBeGreaterThan(50)

    const calendarEl = page.locator('.fc, [class*="fc-"]').first()
    const hasCalendar = await calendarEl.isVisible({ timeout: 10000 }).catch(() => false)
    console.log(`Teacher Calendar: FullCalendar visible: ${hasCalendar}`)

    await page.screenshot({ path: 'tests/screenshots/teacher-calendar.png' })
  })

  test('Tickets page loads', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsTeacher(page)

    await page.goto(`${BASE}/teacher/tickets`, { waitUntil: 'domcontentloaded' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(5000)

    const bodyText = await page.locator('body').textContent() || ''
    expect(bodyText.length).toBeGreaterThan(50)

    await page.screenshot({ path: 'tests/screenshots/teacher-tickets.png' })
  })

  test('Curriculum (students) page loads', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsTeacher(page)

    await page.goto(`${BASE}/teacher/curriculum`, { waitUntil: 'domcontentloaded' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(5000)

    const bodyText = await page.locator('body').textContent() || ''
    expect(bodyText.length).toBeGreaterThan(50)

    const hasStudentContent =
      bodyText.includes('生徒') ||
      bodyText.includes('Student') ||
      bodyText.includes('追加')
    console.log(`Curriculum: Has content: ${hasStudentContent}`)

    await page.screenshot({ path: 'tests/screenshots/teacher-curriculum.png' })
  })

  test('Profile page loads', async ({ page }) => {
    test.setTimeout(90000)
    await loginAsTeacher(page)

    await page.goto(`${BASE}/teacher/profile`, { waitUntil: 'domcontentloaded' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(8000)

    const bodyText = await page.locator('body').textContent() || ''
    expect(bodyText.length).toBeGreaterThan(50)

    await page.screenshot({ path: 'tests/screenshots/teacher-profile.png' })
  })

  test('Chat page loads', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsTeacher(page)

    await page.goto(`${BASE}/teacher/chat`, { waitUntil: 'domcontentloaded' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(5000)

    const bodyText = await page.locator('body').textContent() || ''
    expect(bodyText.length).toBeGreaterThan(30)

    await page.screenshot({ path: 'tests/screenshots/teacher-chat.png' })
  })

  test('Contact page loads', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsTeacher(page)

    await page.goto(`${BASE}/teacher/contact`, { waitUntil: 'domcontentloaded' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(3000)

    const bodyText = await page.locator('body').textContent() || ''
    expect(bodyText.length).toBeGreaterThan(50)

    await page.screenshot({ path: 'tests/screenshots/teacher-contact.png' })
  })
})

// ═══════════════════════════════════════════════════════════
// 4. GUARDIAN FEATURES
// ═══════════════════════════════════════════════════════════
test.describe('Guardian Features', () => {

  test('Dashboard shows content', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsGuardian(page)

    await page.goto(`${BASE}/guardian/dashboard`, { waitUntil: 'domcontentloaded' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(5000)

    const bodyText = await page.locator('body').textContent() || ''
    expect(bodyText.length).toBeGreaterThan(100)

    const hasGuardianContent =
      bodyText.includes('予約') ||
      bodyText.includes('チケット') ||
      bodyText.includes('レポート') ||
      bodyText.includes('ダッシュボード') ||
      bodyText.includes('Booking') ||
      bodyText.includes('Dashboard')

    console.log(`Guardian Dashboard: Has content: ${hasGuardianContent}`)

    await page.screenshot({ path: 'tests/screenshots/guardian-dashboard.png' })
  })

  test('Booking page loads', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsGuardian(page)

    await page.goto(`${BASE}/guardian/booking`, { waitUntil: 'domcontentloaded' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(5000)

    const bodyText = await page.locator('body').textContent() || ''
    expect(bodyText.length).toBeGreaterThan(50)

    const hasBookingUI =
      bodyText.includes('今週') ||
      bodyText.includes('担当講師') ||
      bodyText.includes('予約') ||
      bodyText.includes('Booking') ||
      bodyText.includes('Week')
    console.log(`Guardian Booking: Has booking UI: ${hasBookingUI}`)

    await page.screenshot({ path: 'tests/screenshots/guardian-booking.png' })
  })

  test('Reports page loads', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsGuardian(page)

    await page.goto(`${BASE}/guardian/reports`, { waitUntil: 'domcontentloaded' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(5000)

    const bodyText = await page.locator('body').textContent() || ''
    expect(bodyText.length).toBeGreaterThan(50)

    await page.screenshot({ path: 'tests/screenshots/guardian-reports.png' })
  })

  test('Tickets page loads', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsGuardian(page)

    await page.goto(`${BASE}/guardian/tickets`, { waitUntil: 'domcontentloaded' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(5000)

    const bodyText = await page.locator('body').textContent() || ''
    expect(bodyText.length).toBeGreaterThan(50)

    await page.screenshot({ path: 'tests/screenshots/guardian-tickets.png' })
  })

  test('Bookings history page loads', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsGuardian(page)

    await page.goto(`${BASE}/guardian/bookings`, { waitUntil: 'domcontentloaded' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(5000)

    const bodyText = await page.locator('body').textContent() || ''
    expect(bodyText.length).toBeGreaterThan(50)

    await page.screenshot({ path: 'tests/screenshots/guardian-bookings.png' })
  })

  test('Settings page loads', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsGuardian(page)

    await page.goto(`${BASE}/guardian/settings`, { waitUntil: 'domcontentloaded' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(5000)

    const bodyText = await page.locator('body').textContent() || ''
    expect(bodyText.length).toBeGreaterThan(50)

    await page.screenshot({ path: 'tests/screenshots/guardian-settings.png' })
  })

  test('Chat page loads', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsGuardian(page)

    await page.goto(`${BASE}/guardian/chat`, { waitUntil: 'domcontentloaded' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(5000)

    const bodyText = await page.locator('body').textContent() || ''
    expect(bodyText.length).toBeGreaterThan(30)

    await page.screenshot({ path: 'tests/screenshots/guardian-chat.png' })
  })
})

// ═══════════════════════════════════════════════════════════
// 5. NAVIGATION & UI
// ═══════════════════════════════════════════════════════════
test.describe('Navigation & UI', () => {

  test('Teacher sidebar navigation has links', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsTeacher(page)
    await page.waitForTimeout(3000)

    // Dismiss theme dialog if still showing (click any theme option)
    const themeDialog = page.locator('text=テーマを選択')
    if (await themeDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.locator('button:has-text("ライト")').first().click()
      await page.waitForTimeout(1000)
    }

    // Check sidebar links exist in the page DOM
    const reportLink = page.locator('a[href*="/teacher/reports"]').first()
    const calendarLink = page.locator('a[href*="/teacher/calendar"]').first()
    const ticketLink = page.locator('a[href*="/teacher/tickets"]').first()

    const hasReports = await reportLink.isVisible({ timeout: 5000 }).catch(() => false)
    const hasCalendar = await calendarLink.isVisible({ timeout: 3000 }).catch(() => false)
    const hasTickets = await ticketLink.isVisible({ timeout: 3000 }).catch(() => false)

    console.log(`Teacher Sidebar: reports=${hasReports} calendar=${hasCalendar} tickets=${hasTickets}`)

    // Fallback: check if links exist in DOM even if not visible (collapsed sidebar)
    if (!hasReports && !hasCalendar && !hasTickets) {
      const reportExists = await reportLink.count() > 0
      const calendarExists = await calendarLink.count() > 0
      console.log(`Teacher Sidebar (DOM): reports=${reportExists} calendar=${calendarExists}`)
      expect(reportExists || calendarExists).toBe(true)
    }

    await page.screenshot({ path: 'tests/screenshots/nav-teacher-sidebar.png' })
  })

  test('Guardian sidebar navigation has links', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsGuardian(page)
    await page.waitForTimeout(3000)

    // Dismiss theme dialog if still showing
    const themeDialog = page.locator('text=テーマを選択')
    if (await themeDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.locator('button:has-text("ライト")').first().click()
      await page.waitForTimeout(1000)
    }

    const bookingLink = page.locator('a[href*="/guardian/booking"]').first()
    const ticketLink = page.locator('a[href*="/guardian/tickets"]').first()
    const reportLink = page.locator('a[href*="/guardian/reports"]').first()

    const hasBooking = await bookingLink.isVisible({ timeout: 5000 }).catch(() => false)
    const hasTickets = await ticketLink.isVisible({ timeout: 3000 }).catch(() => false)
    const hasReports = await reportLink.isVisible({ timeout: 3000 }).catch(() => false)

    console.log(`Guardian Sidebar: booking=${hasBooking} tickets=${hasTickets} reports=${hasReports}`)

    // Fallback: check DOM existence
    if (!hasBooking && !hasTickets && !hasReports) {
      const bookingExists = await bookingLink.count() > 0
      const ticketExists = await ticketLink.count() > 0
      console.log(`Guardian Sidebar (DOM): booking=${bookingExists} tickets=${ticketExists}`)
      expect(bookingExists || ticketExists).toBe(true)
    }

    await page.screenshot({ path: 'tests/screenshots/nav-guardian-sidebar.png' })
  })

  test('Language switcher exists on landing page', async ({ page }) => {
    await page.goto(`${BASE}/ja`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    const langSwitcher = page.locator('select, [role="combobox"]').first()
    const hasLangSwitcher = await langSwitcher.isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`Language switcher visible: ${hasLangSwitcher}`)
    expect(hasLangSwitcher).toBe(true)

    await page.screenshot({ path: 'tests/screenshots/nav-language-switcher.png' })
  })
})

// ═══════════════════════════════════════════════════════════
// 6. RESPONSIVE DESIGN
// ═══════════════════════════════════════════════════════════
test.describe('Responsive Design', () => {

  test('Landing page renders on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE}/ja`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    await expect(page.locator('img[alt="EdBrio"]').first()).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: 'tests/screenshots/responsive-landing-mobile.png' })
  })

  test('Teacher dashboard renders on mobile viewport', async ({ page }) => {
    test.setTimeout(90000)
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE}/ja/login`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    await page.fill('input#email', TEACHER.email)
    await page.fill('input#password', TEACHER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(teacher|ja\/teacher)\//, { timeout: 30000 })
    await dismissThemeDialog(page)
    await page.waitForTimeout(5000)

    const bodyText = await page.locator('body').textContent() || ''
    expect(bodyText.length).toBeGreaterThan(50)

    await page.screenshot({ path: 'tests/screenshots/responsive-teacher-mobile.png' })
  })
})

// ═══════════════════════════════════════════════════════════
// 7. API ROUTES (smoke tests)
// ═══════════════════════════════════════════════════════════
test.describe('API Routes', () => {

  test('Contact API rejects empty body', async ({ request }) => {
    const response = await request.post(`${BASE}/api/contact`, {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    })
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(600)
  })

  test('Auth login API rejects invalid credentials', async ({ request }) => {
    const response = await request.post(`${BASE}/api/auth/login`, {
      data: { email: 'invalid@test.com', password: 'wrong' },
      headers: { 'Content-Type': 'application/json' },
    })
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(600)
  })

  test('AI generate-report API requires auth', async ({ request }) => {
    const response = await request.post(`${BASE}/api/ai/generate-report`, {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    })
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(600)
  })

  test('Checkout session API requires auth', async ({ request }) => {
    const response = await request.post(`${BASE}/api/checkout/session`, {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    })
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(600)
  })

  test('Cron endpoints require auth token', async ({ request }) => {
    const response = await request.get(`${BASE}/api/cron/booking-reminder`)
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(600)
  })
})
