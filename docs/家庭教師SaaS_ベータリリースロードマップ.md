# EdBrio クローズドベータ リリース ロードマップ

メンバー作業依頼用 / 2週間以内クローズドベータ開始想定

---

## プロジェクト概要

EdBrio を **個人家庭教師1名 × 生徒10名以下** の利用想定でクローズドベータリリースする。ターゲット時期は **2週間以内**。
ベータでフィードバックを得てから一般公開・Pro/法人プラン・多言語へ拡張する。

### MVP に含める機能

- 認証（メール+Google OAuth、3ロール、メール検証、リセット、削除）
- 講師オンボ（プロフィール、Stripe Connect Express **本番**）
- シフト・予約管理（FullCalendar、rrule、承認/キャンセル/done）
- チケット販売・**Stripe 本番決済**（保護者購入、Application Fee 配分、Connect 経由）
- レッスン報告（Tiptap、下書き/公開、保護者閲覧）※AI 要約は **オフ**
- カリキュラム フルセット（教材・フェーズ・ガント・試験スケジュール・テスト得点・PDF/Excel・共有リンク）
- チャット（Standard プラン解放、未読バッジ、画像添付）
- 保護者・生徒ダッシュボード（予約・チケット残高・レポート・カリキュラム共有閲覧）
- 加入導線: **講師発行の招待 URL**（主）+ 公開講師ページ `/teachers/[handle]` からの検索（例外、SEO 最適化なし）
- 法的ページ（利用規約・プライバシー・特商法、同意チェック）
- Resend メール通知
- Sentry / Vercel アラート監視

### MVP に **含めない** 機能

| 機能 | 扱い | 将来 |
|------|------|------|
| AI レポート要約（Claude） | UI 導線非表示、API は env で 503 | ベータ後にユーザーニーズを見て復活 |
| skill / goal / handover-note | DB+UI を撤去 | 削除済みとしてゼロから再設計 |
| 生徒本人のチケット購入 | 保護者のみ可 | Phase 3 で検討 |
| `school` ロール（塾・学校） | 触らない | Phase 4 横展開 |
| 多言語（日本語以外13言語） | ja のみ | Phase 3 |
| LINE 通知 | なし | Phase 3 |
| 公開講師ページの SEO | 機能のみ提供 | Phase 3 で OGP・構造化データ |

---

## 作業タスク一覧

優先度: 🔴 必須（ベータブロッカー） / 🟡 推奨（ベータ前にやる） / 🟢 任意

### A. カリキュラム仕上げ（合計 ≈ 3時間）

| ID | 優先 | タスク | 工数 | ファイル | 受け入れ基準 |
|----|------|--------|------|---------|------------|
| A1 | 🔴 | 共有リンク DELETE API にオーナー検証を追加 | 15min | `src/app/api/curriculum/share/[token]/route.ts` | 他人のトークンを DELETE しようとすると 403 |
| A2 | 🔴 | 共有リンク GET の N+1 を IN 句一括取得に最適化 | 30min | 同上 | フェーズ数50で API レスポンス < 500ms |
| A3 | 🔴 | `test-score-list.tsx` の `is_main_subject` フィルタ追従 | 25min | `src/components/curriculum/test-score-list.tsx` | 「主要科目のみ」トグルが正しくフィルタリング |
| A4 | 🔴 | フェーズタスク進捗と `phase.status` の同期 | 20min | `src/hooks/use-curriculum-materials.ts` (updateTask) | 全タスク完了で status=completed、0% で not_started |
| A5 | 🟡 | dead code 除去（旧 `getWeekLabel`/`snapToMonday`/`snapToSunday`） | 10min | `src/components/curriculum/gantt-chart.tsx` | 未使用関数なし、`npm run build` 緑 |
| A6 | 🟡 | カリキュラム E2E ハッピーパス | 70min | `tests/e2e/curriculum.spec.ts` | 教材作成→フェーズ→共有リンク発行→閲覧まで自動化 |

### B. 削除タスク（コードベース整理 / 合計 ≈ 50分）

| ID | 優先 | タスク | 工数 | 対象 | 受け入れ基準 |
|----|------|--------|------|------|------------|
| B1 | 🟡 | `skill_assessments` / `student_goals` / `handover_notes` テーブルの DROP マイグレーション | 15min | `supabase/migrations/035_drop_unused_curriculum_tables.sql` | マイグレーション後にビルド緑、参照箇所もコード上削除 |
| B2 | 🟡 | 関連コンポーネント削除 | 15min | `src/components/curriculum/{skill,goal,handover-note}-{form,list}.tsx`, `src/hooks/use-handover-notes.ts` | 削除後 grep でゴーストが残らない |
| B3 | 🟡 | `use-student-curriculum.ts` の関連 CRUD 削除 | 10min | 同フック | type エラーなし |
| B4 | 🔴 | AI レポート要約の無効化 | 20min | `src/app/api/ai/generate-report/route.ts`、レポート編集画面 | UI に AI ボタンが出ない、env で 503 を返せる、`ANTHROPIC_API_KEY` を必須から外す |

### C. Stripe 本番化（合計 ≈ 1日）

Stripe Dashboard 操作と `src/lib/env.ts` の値設定。

| ID | 優先 | タスク | 工数 | 受け入れ基準 |
|----|------|--------|------|------------|
| C1 | 🔴 | `STRIPE_STANDARD_PRICE_ID` を Stripe Dashboard で作成、Vercel env に設定 | 30min | 講師が Standard プランへアップグレードできる |
| C2 | 🔴 | `EDBRIO_PLATFORM_FEE_PERCENT_FREE` / `EDBRIO_PLATFORM_FEE_PERCENT_STANDARD` / `EDBRIO_MIN_FEE_JPY` を本番値で設定 | 15min | `calculateApplicationFee()` テスト出力が想定通り |
| C3 | 🔴 | `NEXT_PUBLIC_APP_URL` を `https://www.edbrio.com` に | 5min | OAuth コールバック・Stripe リダイレクトが本番ドメインに |
| C4 | 🔴 | Stripe Connect (Express) 本番アカウント切替 | 60min | 講師オンボ完走、Express 口座作成成功 |
| C5 | 🔴 | Webhook URL 本番設定、`STRIPE_WEBHOOK_SECRET` 更新 | 30min | テスト Webhook 送信で 200 を返す |
| C6 | 🔴 | `calculateApplicationFee()` 呼び出し箇所が有効になっているか確認・復活 | 30min | `src/app/api/checkout/session/route.ts` などでコメントアウトされていない |
| C7 | 🔴 | 本番で1円〜100円程度の少額決済テスト | 60min | 講師の Express 口座に Application Fee 引き後の額が入金 |

### D. オンボーディング・法的ページ・運用（合計 ≈ 1.5日）

| ID | 優先 | タスク | 工数 | ファイル | 受け入れ基準 |
|----|------|--------|------|---------|------------|
| D1 | 🔴 | オンボ完了判定の Single Source 化 | 60min | `src/lib/teacher-setup.ts`, `OnboardingBanner` 関連 | `getMissingSetupItems()` を全画面で参照、`is_onboarding_complete` と一致 |
| D2 | 🔴 | 招待 URL フロー検証 | 30min | 講師ダッシュボードの招待 UI | 招待リンク経由で保護者が登録 → 自動で該当講師に紐付く |
| D3 | 🔴 | `/legal` の利用規約・プライバシー・特商法を本番文言に更新 | 120min | `src/app/[locale]/legal/page.tsx` | 法務確認済み文言で公開、サインアップで同意チェック必須 |
| D4 | 🟡 | サイトマップから `/teachers/*` を除外 | 10min | `src/app/sitemap.ts` または該当ファイル | クローズドベータ中は検索エンジン上に公開講師ページが出ない |
| D5 | 🔴 | Resend 送信元アドレス・SPF/DKIM 確認 | 30min | DNS 設定 | spam フォルダに入らないこと |
| D6 | 🟡 | Sentry または Vercel アラート連携 | 60min | `next.config.ts`, env | 5xx 連続発生時に Slack/メール通知 |
| D7 | 🟡 | フィードバック窓口（Slack channel / Google Form / `/contact`） | 30min | — | ベータユーザー向けに案内できる |

### E. ベータ前最終検証（合計 ≈ 0.5日）

| ID | 優先 | タスク | 工数 | 受け入れ基準 |
|----|------|--------|------|------------|
| E1 | 🔴 | 家庭教師ハッピーパス手動スモーク | 120min | 講師サインアップ → セットアップ → 招待 → 保護者登録 → チケット販売 → 予約 → レッスン → レポート公開 → カリキュラム共有 が完走 |
| E2 | 🟡 | `tests/e2e/release-smoke.spec.ts` で上記をできる範囲で自動化 | 60min | CI で緑 |
| E3 | 🔴 | `npm run build` 本番ビルド緑 | 5min | Vercel デプロイで READY |

---

## マイルストーン

| 日数 | フェーズ | 完了基準 |
|-----|----------|---------|
| Day 1〜3 | A + B（カリキュラム仕上げ + 削除） | 全 A タスクの受け入れ基準を満たす、未使用コードが消える |
| Day 4〜7 | C + D（Stripe 本番化 + 運用整備） | 本番で少額決済が動く、法的ページ公開、監視通知が来る |
| Day 8〜10 | E（最終検証）+ バッファ | 手動スモーク・自動 E2E ともに緑 |
| Day 10〜14 | クローズドベータ告知・受け入れ | 招待 URL を 5〜10名の講師に配布 |

---

## 重要ファイル早見表

| 関心領域 | パス |
|---------|------|
| 環境変数の宣言 | `src/lib/env.ts` |
| 決済（Connect・Checkout・Webhook） | `src/app/api/stripe/`, `src/app/api/checkout/` |
| 講師オンボ判定 | `src/lib/teacher-setup.ts` |
| 講師ダッシュボード | `src/app/[locale]/teacher/(dashboard)/` |
| カリキュラム編集 | `src/app/[locale]/teacher/(dashboard)/curriculum/[profileId]/page.tsx` |
| カリキュラム共有 API | `src/app/api/curriculum/share/[token]/route.ts` |
| AI 連携（オフ予定） | `src/app/api/ai/generate-report/route.ts` |
| middleware / 認証 | `src/middleware.ts`, `src/lib/supabase/middleware.ts` |
| E2E テスト | `tests/e2e/` |
| マイグレーション | `supabase/migrations/` |

---

## リリース判定基準（Definition of Done）

下記がすべて緑になったらクローズドベータ開始可能:

- [ ] A1〜A6 すべて完了（カリキュラム機能が想定通り動作）
- [ ] B1〜B4 すべて完了（コードベース整理・AI 無効化）
- [ ] C1〜C7 すべて完了（Stripe 本番決済が回る）
- [ ] D1〜D5 完了、D6・D7 はベータ開始時にあれば良い
- [ ] E1〜E3 完了
- [ ] Vercel 本番ビルド緑、`www.edbrio.com` が応答

---

## リリース後（Phase 2 以降の参考メモ）

ベータ運用開始後にユーザーフィードバックを集めながら以下を検討:

| 領域 | 優先度の見立て |
|------|-------------|
| AI レポート要約の復活（プロンプト改善付き） | フィードバック次第 |
| 生徒本人のチケット購入 | 高校生以上のニーズが出れば |
| LINE 通知 | 高（家庭教師の現場ニーズ） |
| 多言語化（まず英語） | 低 |
| 公開講師ページの SEO | 集客戦略が固まったら |
| 塾・学校向け（school ロール） | 法人需要が見えたら |

---

## 問い合わせ

- 仕様確認: `docs/家庭教師SaaS 仕様書（小規模ブラウザ版）.md`
- 用語辞書: `docs/GLOSSARY.md`
- 開発ガイド: `CONTRIBUTING.md`
- 不明点は本ロードマップ作成者まで
