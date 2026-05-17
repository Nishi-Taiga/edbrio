# EdBrio クローズドベータ リリース ロードマップ（個別指導塾向け）

メンバー作業依頼用 / 2〜3週間でクローズドベータ開始想定

---

## プロジェクト概要

EdBrio を **個別指導塾** 向けに方向転換し、塾 1 校（管理者 1〜2 名 + 講師 3〜10 名 + 生徒 10〜30 名）が完結して使えるクローズドベータをリリースする。
従来の「家庭教師個人 × 保護者がチケット購入」モデル（Stripe Connect、公開講師ページなど）は **凍結**（コードは残すが UI から隠す）。

塾本体の課金は当面オフライン（ベータ無料 → 月額固定の塾向けサブスクリプションを Phase 2 以降で導入）。

### ターゲット利用シーン

1. 塾の管理者がアカウントを作成・塾名・運用設定をする
2. 管理者が講師・生徒・保護者を招待 or 直接作成
3. 管理者が時間割（曜日×時間×講師×生徒の固定枠）を作成
4. 講師は担当生徒のカリキュラムを編集し、レッスン後に報告書を作成・公開
5. 保護者・生徒はカレンダーで予定を、報告書・カリキュラムを閲覧
6. 講師⇔保護者がチャットでやり取り

---

## ロールと機能アクセス

| ロール | 主な権限 |
|-------|---------|
| **管理者 (admin / school)** | 塾内すべてのユーザー・時間割・カリキュラム・報告書を CRUD |
| **講師 (teacher)** | 担当生徒の時間割を閲覧、カリキュラム編集、報告書作成・公開、保護者とチャット |
| **保護者 (guardian)** | 子供の時間割・報告書・カリキュラムを閲覧、講師とチャット |
| **生徒 (student)** | 自分の時間割・報告書・カリキュラムを閲覧 |

---

## MVP に含める機能

1. **認証・ログイン**（メール+Google OAuth、4 ロール、メール検証、リセット、削除）
2. **報告書編集・公開**（Tiptap エディタ、下書き/公開、保護者・生徒閲覧）
3. **時間割作成**（曜日×時間の固定枠、講師-生徒の割当）
4. **カリキュラム**（教材・フェーズ・ガント・試験スケジュール・テスト得点・PDF/Excel・共有リンク）
5. **チャット**（講師⇔保護者の 1:1、未読バッジ、画像添付）
6. **カレンダー**（時間割を月/週ビュー表示、各ロールで自分の予定だけ見える）

## MVP に **含めない** 機能

| 機能 | 扱い | 将来 |
|------|------|------|
| Stripe 決済 / チケット販売 / Application Fee | UI 非表示、コード凍結 | 塾向けサブスクリプションで再設計 |
| 公開講師ページ `/teachers/[handle]` | 非公開化 | 一般公開フェーズで個人講師モデル復活時 |
| 個別の予約承認フロー（pending→confirmed） | 時間割に置換 | 必要なら振替予約として再実装 |
| AI レポート要約（Claude） | UI 導線非表示、API は env で 503 | Phase 2 で復活検討 |
| skill / goal / handover-note | DB+UI を撤去 | 削除済みとしてゼロから再設計 |
| 多言語（日本語以外13言語） | ja のみ | Phase 3 |
| LINE 通知 | なし | Phase 3 |
| 招待 URL からのセルフサインアップ | 管理者作成のみ | 管理者運用が固まれば自動化 |

---

## 作業タスク一覧

優先度: 🔴 必須（ベータブロッカー） / 🟡 推奨（ベータ前にやる） / 🟢 任意

### A. 組織モデル・データ基盤（最大の作業領域 / 合計 ≈ 2〜3 日）

塾を中心にしたマルチテナント構造への変換。

| ID | 優先 | タスク | 工数 | ファイル/対象 | 受け入れ基準 |
|----|------|--------|------|--------------|------------|
| A1 | 🔴 | `schools` テーブル作成（id, name, plan, created_at...） | 30min | 新規 migration | 1 塾を作成・更新できる |
| A2 | 🔴 | `users.school_id` を追加、既存ユーザー（運営テスト用）にバックフィル | 30min | migration | NULL の通常ユーザーは凍結 / 塾モデルのみ可視 |
| A3 | 🔴 | 主要テーブル（`student_profiles`, `bookings`, `reports`, `chats` 等）に `school_id` を追加、RLS を school スコープに書き換え | 4h | migration + RLS ポリシー一括 | 別塾のデータが SELECT で見えない |
| A4 | 🔴 | `users.role` の enum/check 制約を 4 ロール（admin, teacher, guardian, student）に統一、既存の `school` ロールを `admin` にリネーム | 30min | migration | サインアップで 4 ロールから選べる |
| A5 | 🟡 | `StudentProfile` 型・サインアップ周りの型整理 | 60min | `src/lib/types/database.ts` 他 | TypeScript ビルド緑 |

### B. 管理者ロール / 画面（合計 ≈ 1.5〜2 日）

塾管理者がチームを運営できる最小画面。

| ID | 優先 | タスク | 工数 | ファイル | 受け入れ基準 |
|----|------|--------|------|---------|------------|
| B1 | 🔴 | 管理者ダッシュボードのトップ画面 | 90min | `src/app/[locale]/admin/dashboard/page.tsx` 新規 | 講師数・生徒数・今週の時間割枠数のサマリ表示 |
| B2 | 🔴 | ユーザー一覧（講師・生徒・保護者） | 90min | `src/app/[locale]/admin/users/page.tsx` 新規 or 既存 `/admin/users/[id]` 拡張 | ロール別タブ、検索、CSV エクスポート |
| B3 | 🔴 | ユーザー作成フォーム（管理者が直接アカウント作成、初期パスを発行） | 90min | 同上 | 4 ロール作成可能、メール送信で初期パス通知 |
| B4 | 🔴 | 講師-生徒の担当割当 UI | 60min | 新規 or `teacher_students` 関連 | 1 講師に複数生徒、1 生徒に複数講師 |
| B5 | 🟡 | 保護者-生徒の紐付け UI | 60min | 同上 | 1 保護者に複数子、1 子に複数保護者 |
| B6 | 🟡 | 塾の基本情報設定（名前、ロゴ、運営時間） | 60min | `src/app/[locale]/admin/settings/page.tsx` | 塾名がヘッダなどに反映 |

### C. 時間割機能（合計 ≈ 2 日）

既存 `shifts` を流用しつつ「時間割エントリ」として再解釈。

| ID | 優先 | タスク | 工数 | ファイル | 受け入れ基準 |
|----|------|--------|------|---------|------------|
| C1 | 🔴 | `timetable_entries` テーブル設計（school_id, teacher_id, student_id, day_of_week, start_time, end_time, valid_from, valid_to, room?） | 90min | migration | 曜日×時間×講師×生徒の固定枠が表現できる |
| C2 | 🔴 | 管理者の時間割作成 UI（週グリッド、ドラッグで枠作成、講師・生徒選択） | 4h | `src/app/[locale]/admin/timetable/page.tsx` 新規 | 1 週間分の枠を作成・編集できる |
| C3 | 🔴 | 時間割→実授業セッション生成（バッチ or オンデマンドで個別 booking 行を作る） | 2h | API ルート or DB function | 週次でその週分のセッションが立つ |
| C4 | 🔴 | 既存 `bookings` の役割整理（時間割由来とアドホックを区別） | 60min | migration + 型 | source カラムで判別 |
| C5 | 🟡 | 振替・休講機能（特定週の枠を変更） | 2h | 同上 | 「来週月曜は休講」をマーク可能 |

### D. 既存機能の塾向け調整（合計 ≈ 1 日）

| ID | 優先 | タスク | 工数 | ファイル | 受け入れ基準 |
|----|------|--------|------|---------|------------|
| D1 | 🔴 | カリキュラム機能の塾向け検証（管理者・講師から生徒のカリキュラムが見える RLS） | 60min | 既存 + 新 RLS | 管理者は全生徒、講師は担当生徒のカリキュラムのみ可視 |
| D2 | 🔴 | 報告書の閲覧権限調整（保護者・生徒・管理者・担当講師が見える） | 60min | RLS + 画面 | 4 ロールでそれぞれ正しく見える |
| D3 | 🟡 | カリキュラム共有リンクの仕様維持（バグ修正は別途） | — | — | 引き続き有効 |
| D4 | 🔴 | チャット参加者の調整（講師⇔保護者、管理者も参加可？） | 90min | `src/app/[locale]/{teacher,guardian}/chat/` | 既存挙動が塾文脈で破綻しないか確認 |
| D5 | 🔴 | カレンダー画面で時間割エントリを表示（各ロール別の見え方） | 2h | `src/app/[locale]/{teacher,guardian,student,admin}/calendar/` | 自分の枠だけ見える |

### E. カリキュラム仕上げ（既存ロードマップから継続 / 合計 ≈ 2.5 時間）

| ID | 優先 | タスク | 工数 | ファイル | 受け入れ基準 |
|----|------|--------|------|---------|------------|
| E1 | 🔴 | 共有リンク DELETE API にオーナー検証を追加 | 15min | `src/app/api/curriculum/share/[token]/route.ts` | 他人のトークンを DELETE しようとすると 403 |
| E2 | 🔴 | 共有リンク GET の N+1 を IN 句一括取得に最適化 | 30min | 同上 | フェーズ数50で API レスポンス < 500ms |
| E3 | 🔴 | `test-score-list.tsx` の `is_main_subject` フィルタ追従 | 25min | `src/components/curriculum/test-score-list.tsx` | 「主要科目のみ」トグルが正しくフィルタリング |
| E4 | 🔴 | フェーズタスク進捗と `phase.status` の同期 | 20min | `src/hooks/use-curriculum-materials.ts` | 全タスク完了で status=completed |
| E5 | 🟡 | dead code 除去 | 10min | `src/components/curriculum/gantt-chart.tsx` | `npm run build` 緑 |
| E6 | 🟡 | カリキュラム E2E ハッピーパス | 70min | `tests/e2e/curriculum.spec.ts` | 教材作成→フェーズ→共有まで自動化 |

### F. 不要機能の凍結・削除（合計 ≈ 1.5 時間）

| ID | 優先 | タスク | 工数 | 対象 | 受け入れ基準 |
|----|------|--------|------|------|------------|
| F1 | 🔴 | Stripe 決済・チケット販売の UI 非表示（コードは残す） | 60min | `/teacher/(dashboard)/tickets/`, `/guardian/tickets/`, `/api/checkout/`, `/api/stripe/` | feature flag (`NEXT_PUBLIC_BILLING_ENABLED=false`) で非表示、API は 503 |
| F2 | 🔴 | 公開講師ページの非公開化 | 30min | `/teachers/[handle]`, `sitemap.ts`, `robots.txt` | 一般アクセスで 404 / noindex |
| F3 | 🔴 | AI レポート要約の UI 非表示 + API 503 化 | 20min | レポート編集画面、`/api/ai/generate-report` | UI ボタンなし、`ANTHROPIC_API_KEY` 任意化 |
| F4 | 🟡 | skill / goal / handover-note の DB DROP + コンポーネント削除 | 30min | migration + `src/components/curriculum/{skill,goal,handover-note}-*.tsx` | grep でゴーストなし |
| F5 | 🟡 | サインアップで講師セルフ登録をオフ（管理者作成のみ） | 30min | `auth-form.tsx`, サインアップ画面 | 一般ユーザーがセルフ登録できない |

### G. 運用整備・法的ページ・監視（合計 ≈ 1.5 日）

| ID | 優先 | タスク | 工数 | ファイル | 受け入れ基準 |
|----|------|--------|------|---------|------------|
| G1 | 🔴 | `/legal` の利用規約・プライバシー・特商法を塾向け文言に更新 | 120min | `src/app/[locale]/legal/page.tsx` | 法務確認済み、サインアップで同意チェック必須 |
| G2 | 🔴 | Resend 送信元・SPF/DKIM 確認 | 30min | DNS | spam に入らない |
| G3 | 🟡 | Sentry または Vercel アラート連携 | 60min | `next.config.ts`, env | 5xx 連続発生時に Slack/メール通知 |
| G4 | 🟡 | フィードバック窓口（Slack / Google Form / `/contact`） | 30min | — | ベータ塾向けに案内できる |
| G5 | 🔴 | 環境変数の整理（不要な Stripe 系を env required から外す） | 30min | `src/lib/env.ts` | 本番ビルドに不要 env が落ちない |

### H. ベータ前最終検証（合計 ≈ 0.5 日）

| ID | 優先 | タスク | 工数 | 受け入れ基準 |
|----|------|--------|------|------------|
| H1 | 🔴 | 塾運用ハッピーパス手動スモーク | 120min | 管理者作成→講師・生徒・保護者作成→担当割当→時間割→講師レポート→保護者閲覧 が完走 |
| H2 | 🟡 | `tests/e2e/release-smoke.spec.ts` で範囲限定の自動 E2E | 60min | CI で緑 |
| H3 | 🔴 | `npm run build` 本番ビルド緑、Vercel デプロイ READY | 5min | `www.edbrio.com` が応答 |

---

## マイルストーン

| 期間 | フェーズ | 完了基準 |
|------|---------|---------|
| Day 1〜4 | **A + F**（組織モデル + 凍結機能の非表示） | RLS が school スコープで動く、Stripe・公開講師ページが見えない |
| Day 5〜7 | **B**（管理者画面） | 管理者がユーザー作成・担当割当できる |
| Day 8〜11 | **C**（時間割機能） | 時間割が作成でき、各ロールのカレンダーに反映 |
| Day 12〜14 | **D + E**（既存機能の塾向け調整 + カリキュラム仕上げ） | カリキュラム・報告書・チャットが 4 ロールで動く |
| Day 15〜17 | **G + H**（運用・検証） | 手動スモーク緑、本番デプロイ READY |
| Day 17〜21 | クローズドベータ告知・受け入れ | ベータ塾 1〜3 校に招待 |

スコープが多いので 2 週間はタイトです。**3 週間** が現実的な見立て。

---

## 重要ファイル早見表

| 関心領域 | パス |
|---------|------|
| 環境変数の宣言 | `src/lib/env.ts` |
| 4 ロール定義・型 | `src/lib/types/database.ts`, `src/hooks/use-auth.ts` |
| 認証ガード | `src/components/layout/protected-route.tsx` |
| middleware | `src/middleware.ts`, `src/lib/supabase/middleware.ts` |
| シフト/時間割の現行実装 | `supabase/migrations/001_initial_schema.sql` (shifts), 講師シフト系画面 |
| カリキュラム編集 | `src/app/[locale]/teacher/(dashboard)/curriculum/[profileId]/page.tsx` |
| カリキュラム共有 API | `src/app/api/curriculum/share/[token]/route.ts` |
| Stripe（凍結） | `src/app/api/stripe/`, `src/app/api/checkout/` |
| 公開講師ページ（凍結） | `src/app/[locale]/teachers/[handle]/` |
| AI 連携（凍結） | `src/app/api/ai/generate-report/route.ts` |
| マイグレーション | `supabase/migrations/` |
| E2E テスト | `tests/e2e/` |

---

## リリース判定基準（Definition of Done）

下記がすべて緑になったらクローズドベータ開始可能:

- [ ] A1〜A4 すべて完了（school スコープの RLS が動く）
- [ ] B1〜B4 すべて完了（管理者がユーザー・割当を管理できる）
- [ ] C1〜C4 すべて完了（時間割を作成・表示できる）
- [ ] D1〜D5 すべて完了（既存機能が塾文脈で動く）
- [ ] E1〜E4 すべて完了（カリキュラムのバグ修正）
- [ ] F1〜F3 完了（凍結機能が隠れている）
- [ ] G1・G2・G5 完了、G3・G4 はベータ開始時にあれば良い
- [ ] H1・H3 完了
- [ ] Vercel 本番ビルド緑、`www.edbrio.com` が応答

---

## リリース後（Phase 2 以降の参考メモ）

ベータ運用開始後にユーザーフィードバックを集めながら以下を検討:

| 領域 | 優先度の見立て |
|------|-------------|
| 塾向けサブスクリプション課金（月額固定 or 生徒数従量） | 高（収益化のため） |
| AI レポート要約の復活 | フィードバック次第 |
| 振替・休講・体験授業のフロー | 高（運用ニーズ） |
| LINE 通知 | 高（保護者連絡の現場ニーズ） |
| 給与計算・講師シフト管理 | 中 |
| 個人家庭教師モデル（旧モデル）の復活 | フィードバック次第 |
| 多言語化 | 低 |

---

## 問い合わせ

- 用語辞書: `docs/GLOSSARY.md`
- 旧仕様: `docs/家庭教師SaaS 仕様書（小規模ブラウザ版）.md`（個人家庭教師向け、参考）
- 開発ガイド: `CONTRIBUTING.md`
- 不明点は本ロードマップ作成者まで
