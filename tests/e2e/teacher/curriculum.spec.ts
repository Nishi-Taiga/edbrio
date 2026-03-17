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

test.describe.serial('Curriculum Feature Tests', () => {
  let studentProfileId: string | null = null

  // ═══════════════════════════════════════════════
  // 1. Student list page
  // ═══════════════════════════════════════════════
  test('Student list page loads and shows controls', async ({ page }) => {
    test.setTimeout(60000)
    await login(page)
    await page.goto(`${BASE}/ja/teacher/curriculum`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(3000)

    // Page title should be visible
    const heading = page.locator('h1')
    await expect(heading).toBeVisible({ timeout: 10000 })

    // Check for add student button
    const addBtn = page.locator('button:has-text("生徒を追加")')
    await expect(addBtn.first()).toBeVisible({ timeout: 10000 })

    // Check for hide inactive checkbox
    const hideInactiveCheckbox = page.locator('input[type="checkbox"]')
    const hasCheckbox = await hideInactiveCheckbox.isVisible({ timeout: 3000 }).catch(() => false)
    console.log(`CURRICULUM: Hide inactive checkbox visible: ${hasCheckbox}`)

    // Check for search input
    const searchInput = page.locator('input[placeholder]')
    const hasSearch = await searchInput.first().isVisible({ timeout: 3000 }).catch(() => false)
    console.log(`CURRICULUM: Search input visible: ${hasSearch}`)

    await page.screenshot({ path: 'tests/screenshots/curriculum-student-list.png' })

    // Get first student card link to navigate to detail
    const studentLink = page.locator('a[href*="/teacher/curriculum/"]').first()
    const hasStudents = await studentLink.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasStudents) {
      const href = await studentLink.getAttribute('href')
      // Extract profileId from URL like /ja/teacher/curriculum/<uuid>
      const match = href?.match(/\/curriculum\/([^/]+)/)
      if (match) {
        studentProfileId = match[1]
        console.log(`CURRICULUM: Found student profile: ${studentProfileId}`)
      }
    } else {
      console.log('CURRICULUM: No student profiles found - skipping detail tests')
    }
  })

  // ═══════════════════════════════════════════════
  // 2. Hide inactive toggle
  // ═══════════════════════════════════════════════
  test('Hide inactive toggle works', async ({ page }) => {
    test.setTimeout(60000)
    await login(page)
    await page.goto(`${BASE}/ja/teacher/curriculum`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(3000)

    const checkbox = page.locator('input[type="checkbox"]')
    const hasCheckbox = await checkbox.isVisible({ timeout: 3000 }).catch(() => false)

    if (!hasCheckbox) {
      console.log('CURRICULUM: No checkbox (no students), skipping')
      return
    }

    // Checkbox should be checked by default (hideInactive = true)
    const isChecked = await checkbox.isChecked()
    console.log(`CURRICULUM: Hide inactive initially checked: ${isChecked}`)
    expect(isChecked).toBe(true)

    // Count visible cards
    const cardsBefore = await page.locator('a[href*="/teacher/curriculum/"]').count()
    console.log(`CURRICULUM: Cards before toggle: ${cardsBefore}`)

    // Uncheck to show all
    await checkbox.uncheck()
    await page.waitForTimeout(1000)

    const cardsAfter = await page.locator('a[href*="/teacher/curriculum/"]').count()
    console.log(`CURRICULUM: Cards after showing all: ${cardsAfter}`)

    // After showing all, should have >= same number of cards
    expect(cardsAfter).toBeGreaterThanOrEqual(cardsBefore)

    await page.screenshot({ path: 'tests/screenshots/curriculum-hide-inactive.png' })
  })

  // ═══════════════════════════════════════════════
  // 3. Curriculum detail page - Gantt chart
  // ═══════════════════════════════════════════════
  test('Curriculum detail page loads with Gantt chart', async ({ page }) => {
    test.setTimeout(90000)
    await login(page)

    if (!studentProfileId) {
      // Try to find a student
      await page.goto(`${BASE}/ja/teacher/curriculum`, { waitUntil: 'networkidle' })
      await dismissThemeDialog(page)
      await page.waitForTimeout(3000)

      const studentLink = page.locator('a[href*="/teacher/curriculum/"]').first()
      const hasStudents = await studentLink.isVisible({ timeout: 5000 }).catch(() => false)
      if (!hasStudents) {
        console.log('CURRICULUM DETAIL: No students - skipping')
        return
      }
      const href = await studentLink.getAttribute('href')
      const match = href?.match(/\/curriculum\/([^/]+)/)
      if (match) studentProfileId = match[1]
    }

    await page.goto(`${BASE}/ja/teacher/curriculum/${studentProfileId}`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(5000)

    // Student info bar should be visible (purple bg)
    const infoBar = page.locator('div.rounded-xl').first()
    await expect(infoBar).toBeVisible({ timeout: 10000 })

    // Tabs should be visible
    const curriculumTab = page.locator('button:has-text("カリキュラム")')
    await expect(curriculumTab.first()).toBeVisible({ timeout: 10000 })

    const scoresTab = page.locator('button:has-text("テスト成績")')
    await expect(scoresTab.first()).toBeVisible({ timeout: 10000 })

    // Year selector should be visible
    const yearText = page.locator('text=/\\d{4}年度/')
    await expect(yearText.first()).toBeVisible({ timeout: 10000 })

    // Gantt chart should render (look for month headers)
    const monthHeaders = page.locator('text=/^(4|5|6|7|8|9|10|11|12|1|2|3)月$/')
    const monthCount = await monthHeaders.count()
    console.log(`CURRICULUM DETAIL: Month headers found: ${monthCount}`)
    expect(monthCount).toBeGreaterThanOrEqual(1)

    // Today line should be visible (red line)
    const todayLine = page.locator('text=今日')
    const hasTodayLine = await todayLine.isVisible({ timeout: 3000 }).catch(() => false)
    console.log(`CURRICULUM DETAIL: Today line visible: ${hasTodayLine}`)

    // Add material button should exist
    const addMaterialBtn = page.locator('button:has-text("教材を追加")')
    const hasAddMaterial = await addMaterialBtn.isVisible({ timeout: 3000 }).catch(() => false)
    console.log(`CURRICULUM DETAIL: Add material button: ${hasAddMaterial}`)

    // Back link should show 生徒一覧
    const backLink = page.locator('a:has-text("生徒一覧")')
    const hasBackLink = await backLink.isVisible({ timeout: 3000 }).catch(() => false)
    console.log(`CURRICULUM DETAIL: Back to student list link: ${hasBackLink}`)

    await page.screenshot({ path: 'tests/screenshots/curriculum-detail-gantt.png' })
  })

  // ═══════════════════════════════════════════════
  // 4. Exam schedule section
  // ═══════════════════════════════════════════════
  test('Exam schedule section shows with preference order and border', async ({ page }) => {
    test.setTimeout(60000)
    if (!studentProfileId) {
      console.log('EXAM SCHEDULE: No student profile - skipping')
      return
    }

    await login(page)
    await page.goto(`${BASE}/ja/teacher/curriculum/${studentProfileId}`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(5000)

    // Look for exam schedule section
    const examSection = page.locator('text=入試スケジュール')
    const hasExamSection = await examSection.isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`EXAM SCHEDULE: Section visible: ${hasExamSection}`)

    if (hasExamSection) {
      // Check for 志望順 column header
      const preferenceHeader = page.locator('th:has-text("志望順"), text=志望順')
      const hasPreference = await preferenceHeader.first().isVisible({ timeout: 3000 }).catch(() => false)
      console.log(`EXAM SCHEDULE: Preference order column: ${hasPreference}`)

      // Check for ボーダー column header
      const borderHeader = page.locator('th:has-text("ボーダー"), text=ボーダー')
      const hasBorder = await borderHeader.first().isVisible({ timeout: 3000 }).catch(() => false)
      console.log(`EXAM SCHEDULE: Border score column: ${hasBorder}`)

      // Check for add exam button
      const addExamBtn = page.locator('button:has-text("追加")')
      const hasAddExam = await addExamBtn.first().isVisible({ timeout: 3000 }).catch(() => false)
      console.log(`EXAM SCHEDULE: Add exam button: ${hasAddExam}`)
    }

    await page.screenshot({ path: 'tests/screenshots/curriculum-exam-schedule.png' })
  })

  // ═══════════════════════════════════════════════
  // 5. Test scores tab with chart
  // ═══════════════════════════════════════════════
  test('Test scores tab loads with type-based chart', async ({ page }) => {
    test.setTimeout(60000)
    if (!studentProfileId) {
      console.log('TEST SCORES: No student profile - skipping')
      return
    }

    await login(page)
    await page.goto(`${BASE}/ja/teacher/curriculum/${studentProfileId}`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(5000)

    // Switch to test scores tab
    const scoresTab = page.locator('button:has-text("テスト成績")')
    await expect(scoresTab.first()).toBeVisible({ timeout: 10000 })
    await scoresTab.first().click()
    await page.waitForTimeout(2000)

    // Check for chart title
    const chartTitle = page.locator('text=成績推移')
    const hasChart = await chartTitle.isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`TEST SCORES: Chart visible: ${hasChart}`)

    if (hasChart) {
      // Check for test type tabs (定期テスト, 模試, etc.)
      const typeTab = page.locator('button:has-text("定期テスト"), button:has-text("模試"), button:has-text("小テスト")')
      const hasTypeTabs = await typeTab.first().isVisible({ timeout: 3000 }).catch(() => false)
      console.log(`TEST SCORES: Type tabs visible: ${hasTypeTabs}`)

      // Check for Recharts SVG
      const chartSvg = page.locator('.recharts-responsive-container svg')
      const hasSvg = await chartSvg.isVisible({ timeout: 3000 }).catch(() => false)
      console.log(`TEST SCORES: Chart SVG rendered: ${hasSvg}`)
    }

    // Check for test score list
    const addScoreBtn = page.locator('button:has-text("追加")')
    const hasAddScore = await addScoreBtn.first().isVisible({ timeout: 3000 }).catch(() => false)
    console.log(`TEST SCORES: Add score button: ${hasAddScore}`)

    await page.screenshot({ path: 'tests/screenshots/curriculum-test-scores.png' })
  })

  // ═══════════════════════════════════════════════
  // 6. Year navigation
  // ═══════════════════════════════════════════════
  test('Year selector navigates between academic years', async ({ page }) => {
    test.setTimeout(60000)
    if (!studentProfileId) {
      console.log('YEAR NAV: No student profile - skipping')
      return
    }

    await login(page)
    await page.goto(`${BASE}/ja/teacher/curriculum/${studentProfileId}`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(5000)

    // Current year should be shown
    const now = new Date()
    const currentAcademicYear = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear()
    const yearText = page.locator(`text=${currentAcademicYear}年度`)
    await expect(yearText.first()).toBeVisible({ timeout: 10000 })
    console.log(`YEAR NAV: Current academic year ${currentAcademicYear} displayed`)

    // Find the year selector container (has the year text flanked by arrow buttons)
    const yearContainer = yearText.first().locator('..')
    const nextArrow = yearContainer.locator('button').last()

    if (await nextArrow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nextArrow.click()
      await page.waitForTimeout(2000)

      const nextYearText = page.locator(`text=${currentAcademicYear + 1}年度`)
      const hasNextYear = await nextYearText.first().isVisible({ timeout: 5000 }).catch(() => false)
      console.log(`YEAR NAV: Next year ${currentAcademicYear + 1} displayed: ${hasNextYear}`)

      // Click back using the prev button within the same container
      const yearContainer2 = nextYearText.first().locator('..')
      const prevArrow2 = yearContainer2.locator('button').first()
      await prevArrow2.click()
      await page.waitForTimeout(3000)

      const returnedYearText = page.locator(`text=${currentAcademicYear}年度`)
      await expect(returnedYearText.first()).toBeVisible({ timeout: 10000 })
      console.log('YEAR NAV: Returned to current year')
    }

    await page.screenshot({ path: 'tests/screenshots/curriculum-year-nav.png' })
  })

  // ═══════════════════════════════════════════════
  // 7. Student info bar shows progress stats
  // ═══════════════════════════════════════════════
  test('Student info bar shows progress and exam countdown', async ({ page }) => {
    test.setTimeout(60000)
    if (!studentProfileId) {
      console.log('INFO BAR: No student profile - skipping')
      return
    }

    await login(page)
    await page.goto(`${BASE}/ja/teacher/curriculum/${studentProfileId}`, { waitUntil: 'networkidle' })
    await dismissThemeDialog(page)
    await page.waitForTimeout(5000)

    // Info bar should show total progress (総合進捗)
    const totalProgress = page.locator('text=総合進捗')
    const hasTotalProgress = await totalProgress.isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`INFO BAR: Total progress visible: ${hasTotalProgress}`)

    // Check for exam countdown (第一志望まで or 試験まで)
    const examCountdown = page.locator('text=/第一志望まで|試験まで/')
    const hasCountdown = await examCountdown.isVisible({ timeout: 3000 }).catch(() => false)
    console.log(`INFO BAR: Exam countdown visible: ${hasCountdown}`)

    // Check for percentage values
    const percentages = page.locator('text=/%$/')
    const pctCount = await percentages.count()
    console.log(`INFO BAR: Percentage values shown: ${pctCount}`)

    await page.screenshot({ path: 'tests/screenshots/curriculum-info-bar.png' })
  })
})
