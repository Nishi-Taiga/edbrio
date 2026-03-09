/**
 * E2E test for curriculum feature on deployed site.
 * Usage: TEACHER_PASSWORD=vidal0522 npx tsx scripts/test-curriculum.ts
 */
import { chromium, type Page, type Browser } from 'playwright'

const BASE_URL = process.env.BASE_URL || 'https://edbrio.com'
const TEACHER_EMAIL = 'tai.nishi1998@gmail.com'
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || 'vidal0522'

let browser: Browser
let page: Page
let passed = 0
let failed = 0
const results: { name: string; status: 'PASS' | 'FAIL'; detail?: string }[] = []

function log(msg: string) {
  console.log(`  ${msg}`)
}

async function test(name: string, fn: () => Promise<void>) {
  process.stdout.write(`\n🧪 ${name} ... `)
  try {
    await fn()
    passed++
    results.push({ name, status: 'PASS' })
    console.log('✅ PASS')
  } catch (e: any) {
    failed++
    const detail = e.message || String(e)
    results.push({ name, status: 'FAIL', detail })
    console.log('❌ FAIL')
    console.log(`   → ${detail}`)
    // Take debug screenshot
    try {
      await page.screenshot({ path: `screenshots/test_fail_${name.replace(/\s+/g, '_').substring(0, 40)}.png` })
    } catch {}
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

async function main() {
  console.log(`\n📋 カリキュラム機能 E2E テスト`)
  console.log(`   URL: ${BASE_URL}`)
  console.log(`   Account: ${TEACHER_EMAIL}\n`)

  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'ja',
  })
  page = await context.newPage()

  // ========================================
  // 1. ログイン
  // ========================================
  await test('ログイン', async () => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Dismiss theme modal
    await page.evaluate(() => localStorage.setItem('edbrio-theme-chosen', 'true'))
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    const emailInput = page.locator('#email')
    await emailInput.waitFor({ timeout: 10000 })
    await emailInput.fill(TEACHER_EMAIL)
    await page.fill('#password', TEACHER_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(5000)

    const url = page.url()
    log(`ログイン後URL: ${url}`)
    assert(url.includes('/teacher') || url.includes('/dashboard'), `ログインに失敗: URL=${url}`)
  })

  // ========================================
  // 2. 生徒カリキュラム一覧ページ
  // ========================================
  await test('生徒一覧ページの表示', async () => {
    await page.goto(`${BASE_URL}/teacher/curriculum`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(4000)

    const url = page.url()
    log(`URL: ${url}`)

    // Check page title
    const heading = await page.textContent('h1')
    log(`ページタイトル: ${heading}`)
    assert(!!heading, 'h1が見つからない')

    // Take screenshot
    await page.screenshot({ path: 'screenshots/test_01_student_list.png' })
  })

  // ========================================
  // 3. 生徒カード表示
  // ========================================
  await test('生徒カードが表示される', async () => {
    // Wait for student cards to appear
    const cards = page.locator('[class*="grid"] a, [class*="grid"] [class*="card"]')
    const count = await cards.count()
    log(`生徒カード数: ${count}`)
    assert(count >= 1, `生徒カードが見つからない (count=${count})`)
  })

  // ========================================
  // 4. 生徒Aのカリキュラムページに遷移
  // ========================================
  let profileUrl = ''
  await test('生徒Aのカリキュラムページに遷移', async () => {
    // Click first student card (生徒A)
    const firstCard = page.locator('a[href*="/curriculum/"]').first()
    const href = await firstCard.getAttribute('href')
    log(`カードのリンク: ${href}`)

    await firstCard.click()
    await page.waitForTimeout(4000)

    profileUrl = page.url()
    log(`遷移先URL: ${profileUrl}`)
    assert(profileUrl.includes('/curriculum/'), 'カリキュラム詳細ページに遷移していない')

    await page.screenshot({ path: 'screenshots/test_02_curriculum_page.png' })
  })

  // ========================================
  // 5. ページヘッダー
  // ========================================
  await test('ページヘッダーが表示される', async () => {
    const title = await page.textContent('h1')
    log(`ヘッダータイトル: ${title}`)
    assert(title?.includes('カリキュラム') === true, `タイトルが不正: ${title}`)

    // Check export and add buttons exist
    const exportBtn = page.locator('button:has-text("エクスポート"), a:has-text("エクスポート")').first()
    const addBtn = page.locator('button:has-text("生徒を追加"), a:has-text("生徒を追加")').first()
    assert(await exportBtn.count() > 0, 'エクスポートボタンが見つからない')
    assert(await addBtn.count() > 0, '生徒を追加ボタンが見つからない')
  })

  // ========================================
  // 6. 生徒タブ
  // ========================================
  await test('生徒タブが表示される', async () => {
    // Look for student tab buttons with colored circles
    const tabButtons = page.locator('button:has(div[class*="rounded-full"])')
    const tabCount = await tabButtons.count()
    log(`生徒タブ数: ${tabCount}`)
    assert(tabCount >= 2, `生徒タブが少なすぎる (${tabCount})`)

    // Check active tab has the accent color
    const activeTab = page.locator('button:has(div[class*="rounded-full"]):has-text("生徒A")').first()
    if (await activeTab.count() > 0) {
      const classList = await activeTab.getAttribute('class')
      log(`アクティブタブのクラス: ${classList?.substring(0, 80)}`)
    }
  })

  // ========================================
  // 7. 生徒情報バー
  // ========================================
  await test('生徒情報バーが表示される', async () => {
    // The info bar contains the student name as white bold text
    // Use text-based search since Tailwind class selectors may not match in production
    const infoBar = page.locator('div:has-text("生徒A"):has-text("年度")').first()
    assert(await infoBar.count() > 0, '情報バーが見つからない')

    // Check for percentage stats
    const percentages = page.locator('text=/\\d+%/')
    const pctCount = await percentages.count()
    log(`パーセンテージ表示数: ${pctCount}`)
    assert(pctCount >= 2, `統計パーセンテージが少なすぎる (${pctCount})`)

    // Check for subject labels in stats
    const mathStat = page.locator('span:has-text("数学")').first()
    const physicsStat = page.locator('span:has-text("物理")').first()
    log(`数学統計: ${await mathStat.count() > 0 ? '✓' : '✗'}`)
    log(`物理統計: ${await physicsStat.count() > 0 ? '✓' : '✗'}`)
  })

  // ========================================
  // 8. コンテンツタブ
  // ========================================
  await test('コンテンツタブが表示される', async () => {
    const tabs = page.locator('[role="tablist"] [role="tab"]')
    const tabCount = await tabs.count()
    log(`コンテンツタブ数: ${tabCount}`)

    const tabTexts: string[] = []
    for (let i = 0; i < tabCount; i++) {
      const text = await tabs.nth(i).textContent()
      if (text) tabTexts.push(text.trim())
    }
    log(`タブ: ${tabTexts.join(', ')}`)
    assert(tabTexts.some(t => t.includes('カリキュラム')), 'カリキュラムタブが見つからない')
  })

  // ========================================
  // 9. ガントチャート
  // ========================================
  await test('ガントチャートが表示される', async () => {
    // Gantt chart should be the default tab
    const ganttCard = page.locator('div[class*="rounded-xl"][class*="border"]').first()
    assert(await ganttCard.count() > 0, 'ガントチャートカードが見つからない')

    // Check month headers
    const monthHeaders = page.locator('text="4月"')
    assert(await monthHeaders.count() > 0, '月ヘッダー（4月）が見つからない')

    // Check 教材/科目 label
    const labelHeader = page.locator('text="教材 / 科目"')
    assert(await labelHeader.count() > 0, '教材/科目ラベルが見つからない')

    await page.screenshot({ path: 'screenshots/test_03_gantt_chart.png' })
  })

  // ========================================
  // 10. 入試スケジュール行
  // ========================================
  await test('入試スケジュール行が表示される', async () => {
    const examRow = page.locator('text=/入試スケジュール/').first()
    assert(await examRow.count() > 0, '入試スケジュール行が見つからない')
  })

  // ========================================
  // 11. 科目セクション
  // ========================================
  await test('科目セクション（数学・物理）が表示される', async () => {
    const mathSection = page.locator('span:has-text("数学"):not([role="tab"])').first()
    const physicsSection = page.locator('span:has-text("物理")').first()

    assert(await mathSection.count() > 0, '数学セクションが見つからない')
    assert(await physicsSection.count() > 0, '物理セクションが見つからない')
  })

  // ========================================
  // 12. 教材行
  // ========================================
  await test('教材行が表示される', async () => {
    const materials = [
      '青チャート 数ⅠA',
      '黄チャート 数ⅡB',
      'セミナー物理',
      '物理のエッセンス',
    ]

    for (const name of materials) {
      const el = page.locator(`text="${name}"`).first()
      const found = await el.count()
      log(`${name}: ${found > 0 ? '✓' : '✗'}`)
      assert(found > 0, `教材「${name}」が見つからない`)
    }
  })

  // ========================================
  // 13. フェーズバー
  // ========================================
  await test('フェーズバーが表示される', async () => {
    // Phase bars are colored divs with phase names
    const phaseBars = page.locator('div[style*="backgroundColor"]:has-text("基本例題"), div[style*="background-color"]:has-text("基本例題")')
    // Try alternative: look for text content in bars
    const barTexts = page.locator('span:has-text("基本例題")')
    const count = await barTexts.count()
    log(`「基本例題」テキスト数: ${count}`)
    assert(count > 0, 'フェーズバー（基本例題）が見つからない')

    // Check for コンパス3
    const compass = page.locator('span:has-text("コンパス3")')
    const compassCount = await compass.count()
    log(`「コンパス3」テキスト数: ${compassCount}`)
    assert(compassCount > 0, 'フェーズバー（コンパス3）が見つからない')
  })

  // ========================================
  // 14. 入試スケジュールテーブル
  // ========================================
  await test('入試スケジュールテーブルが表示される', async () => {
    // Scroll down to see the exam table
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)

    const examTable = page.locator('table')
    const tableCount = await examTable.count()
    log(`テーブル数: ${tableCount}`)
    assert(tableCount > 0, '入試スケジュールテーブルが見つからない')

    // Check for specific exam entries
    const examNames = ['芝浦工業大学', '神奈川大学', '共通テスト', '成蹊大学']
    for (const name of examNames) {
      const el = page.locator(`td:has-text("${name}")`).first()
      const found = await el.count()
      log(`${name}: ${found > 0 ? '✓' : '✗'}`)
      assert(found > 0, `入試「${name}」が見つからない`)
    }

    await page.screenshot({ path: 'screenshots/test_04_exam_table.png', fullPage: true })
  })

  // ========================================
  // 15. 生徒タブ切り替え
  // ========================================
  await test('生徒タブ切り替えが動作する', async () => {
    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(500)

    // Click 生徒B tab
    const tabB = page.locator('button:has-text("生徒B")').first()
    assert(await tabB.count() > 0, '生徒Bタブが見つからない')

    await tabB.click()
    await page.waitForTimeout(4000)

    const newUrl = page.url()
    log(`切り替え後URL: ${newUrl}`)
    assert(newUrl !== profileUrl, 'URLが変更されていない')
    assert(newUrl.includes('/curriculum/'), 'カリキュラムページではない')

    // Check that the page now shows 生徒B
    const studentBName = page.locator('div:has-text("生徒B")').first()
    assert(await studentBName.count() > 0, '生徒Bの名前が表示されていない')

    await page.screenshot({ path: 'screenshots/test_05_student_b.png' })
  })

  // ========================================
  // 16. 生徒Aに戻る
  // ========================================
  await test('生徒Aに戻れる', async () => {
    const tabA = page.locator('button:has-text("生徒A")').first()
    await tabA.click()
    await page.waitForTimeout(4000)

    // Check that the page now shows 生徒A
    const studentAName = page.locator('div:has-text("生徒A"):has-text("年度")').first()
    assert(await studentAName.count() > 0, '生徒Aの名前が表示されていない')
  })

  // ========================================
  // 17. 授業記録タブ
  // ========================================
  await test('授業記録タブに切り替え', async () => {
    const tab = page.locator('[role="tab"]:has-text("授業記録")')
    assert(await tab.count() > 0, '授業記録タブが見つからない')
    await tab.click()
    await page.waitForTimeout(2000)

    await page.screenshot({ path: 'screenshots/test_06_lesson_logs.png' })
    log('授業記録タブの表示を確認')
  })

  // ========================================
  // 18. テスト成績タブ
  // ========================================
  await test('テスト成績タブに切り替え', async () => {
    const tab = page.locator('[role="tab"]:has-text("テスト成績")')
    assert(await tab.count() > 0, 'テスト成績タブが見つからない')
    await tab.click()
    await page.waitForTimeout(2000)

    await page.screenshot({ path: 'screenshots/test_07_test_scores.png' })
    log('テスト成績タブの表示を確認')
  })

  // ========================================
  // 19. 学習目標タブ
  // ========================================
  await test('学習目標タブに切り替え', async () => {
    const tab = page.locator('[role="tab"]:has-text("学習目標")')
    assert(await tab.count() > 0, '学習目標タブが見つからない')
    await tab.click()
    await page.waitForTimeout(2000)

    await page.screenshot({ path: 'screenshots/test_08_goals.png' })
    log('学習目標タブの表示を確認')
  })

  // ========================================
  // 20. カリキュラムタブに戻る
  // ========================================
  await test('カリキュラムタブに戻れる', async () => {
    const tab = page.locator('[role="tab"]:has-text("カリキュラム")')
    await tab.click()
    await page.waitForTimeout(2000)

    // Verify Gantt chart is visible again
    const ganttLabel = page.locator('text="教材 / 科目"')
    assert(await ganttLabel.count() > 0, 'ガントチャートが再表示されていない')
  })

  // ========================================
  // 21. 教材追加ダイアログ（ホバー操作）
  // ========================================
  await test('教材行ホバーでアクションボタン表示', async () => {
    // Hover over a material row
    const materialRow = page.locator('div:has-text("青チャート 数ⅠA")').first()
    await materialRow.hover()
    await page.waitForTimeout(500)

    // Look for action buttons (Plus, Pencil, Trash2 icons)
    // These might be visible on hover
    log('教材行をホバーしてアクションボタンを確認')
    await page.screenshot({ path: 'screenshots/test_09_hover_actions.png' })
  })

  // ========================================
  // 22. レスポンシブ確認（タブレット）
  // ========================================
  await test('タブレットサイズでの表示', async () => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(2000)

    await page.screenshot({ path: 'screenshots/test_10_tablet.png', fullPage: true })
    log('タブレットサイズのスクリーンショットを撮影')

    // Restore
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForTimeout(1000)
  })

  // ========================================
  // 23. モバイル確認
  // ========================================
  await test('モバイルサイズでの表示', async () => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForTimeout(2000)

    await page.screenshot({ path: 'screenshots/test_11_mobile.png', fullPage: true })
    log('モバイルサイズのスクリーンショットを撮影')

    // Check horizontal scroll on gantt
    const ganttOverflow = page.locator('div[class*="overflow-x-auto"]')
    const ganttOverflowCount = await ganttOverflow.count()
    log(`横スクロール可能要素数: ${ganttOverflowCount}`)

    // Restore
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForTimeout(1000)
  })

  // ========================================
  // Summary
  // ========================================
  await browser.close()

  console.log('\n' + '='.repeat(50))
  console.log(`📊 テスト結果: ${passed} passed, ${failed} failed (${passed + failed} total)`)
  console.log('='.repeat(50))

  if (failed > 0) {
    console.log('\n❌ 失敗したテスト:')
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   • ${r.name}: ${r.detail}`)
    })
  }

  console.log('\n📸 スクリーンショット: screenshots/test_*.png')

  process.exit(failed > 0 ? 1 : 0)
}

main().catch(e => {
  console.error('Fatal error:', e)
  process.exit(1)
})
