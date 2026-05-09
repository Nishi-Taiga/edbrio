0. 目的・コンセプト

講師の事務負担（予約・集金・報告）を最小化し、生徒指導に専念できる環境を提供する。

MVPは 講師集客＝講師自身 を前提。プロダクトは予約・決済・レポートのワンストップ化に集中。

チケット価格は講師が自由に設定可能。

1. ユーザーとユースケース
1.1 ロール

講師（Teacher）：シフト登録、空き枠公開、予約管理、チケット販売、報告書作成。

保護者／生徒（Guardian/Student）：アカウント必須。予約、チケット購入、レポート閲覧。

1.2 ユースケース

講師：公開プロフィールURLの発行／共有、繰り返しシフト登録、空き枠公開、チケット商品作成・販売、予約確定、報告書作成・公開、メール通知。

保護者／生徒：アカウント作成、講師ページから空き枠予約、チケット購入（Stripe）、予約確認、レポート閲覧。

2. アーキテクチャ

フロント：Next.js（App Router, Server Actions 最小）、Vercelデプロイ

認証：Supabase Auth（Email/Password, Google, LINE）※メール検証必須

バックエンド：Supabase Edge Functions（TS/Go）にビジネスロジック集約

DB：Supabase Postgres（RLS有効）

決済：Stripe Checkout／Billing Portal＋Webhook

通知：SendGrid（メール）

AI（任意）：OpenAI APIで報告書整形/要約（有料オプション）

3. データモデル（主要テーブル草案）

users(id, role, email, name)／teachers(id, handle(unique), subjects[], grades[], public_profile)

guardians(id, phone)／students(id, guardian_id, grade, notes)

teacher_students(id, teacher_id, student_id, status)

invites(id, teacher_id, token, role, expires_at, used)

shifts(id, teacher_id, start, end, rrule, location, is_published)

availability(id, teacher_id, slot_start, slot_end, source, is_bookable)

tickets(id, teacher_id, name, minutes, bundle_qty, price_cents, valid_days, is_active, stripe_price_id)

payments(id, teacher_id, payer_id, amount_cents, processor, processor_payment_id, status, created_at)

ticket_balances(id, student_id, ticket_id, remaining, purchased_at, expires_at, payment_id)

bookings(id, teacher_id, student_id, start, end, status, ticket_balance_id, source, notes)

reports(id, booking_id, content_raw, content_public, ai_summary, visibility, published_at)

audit_logs(id, actor_id, action, target_table, target_id, meta, created_at)

制約・インデックス

Postgres btree_gist を用いた 二重予約防止：EXCLUDE USING gist (teacher_id WITH =, tstzrange(start,"end") WITH &&)

期間検索最適化：availability(teacher_id, slot_start) 複合Index

RLSポリシー

teachers：本人のみRW、公開プロフィールはhandle経由で匿名閲覧

bookings / ticket_balances / reports：当該teacher_idまたは当該student/guardianに限定

availability：公開フラグ時のみ匿名可

4. API / Edge Functions
Public

GET /api/public/teachers/:handle：公開プロフィール＋近30日の空き枠

POST /api/auth/sign-up：Supabase Authラッパ（招待トークン承認）

Auth（Teacher）

POST /functions/create_shift

POST /functions/publish_availability

GET /functions/dashboard

POST /functions/create_ticket / PATCH /functions/update_ticket

POST /functions/issue_invite

POST /functions/create_report

Auth（Guardian/Student）

GET /functions/my_overview

POST /functions/create_booking

POST /functions/purchase_ticket

GET /functions/my_reports

Webhooks

POST /api/stripe/webhook

checkout.session.completed：payments挿入→ticket_balances付与

5. ビジネスルール

予約：

ステータス：pending/confirmed/canceled/done

シフトと重複不可。

チケット：

講師が価格・有効期限・回数を自由に設定。

消費は授業分数に応じて。期限切れは予約不可。

キャンセル：N時間前以降は自動消費や返金不可（講師設定に従う）。

6. 画面要件
生徒・保護者

ホーム：次の予約、残チケット、CTA（新規予約／購入）

チケット：残数・有効期限、購入履歴、領収書DL

予約：空き枠一覧→選択→チケット選択/購入→確定

予約一覧：今後・過去の予約履歴

レポート：最新レポート、過去一覧

通知：予約確定・前日リマインド・レポ公開（メール）

設定：アカウント情報編集、通知設定

講師

ダッシュボード：今日の予定、未提出レポ、ミニKPI

カレンダー：シフト登録・空き枠管理

チケット管理：商品作成・価格設定・有効期限設定

予約管理：生徒からの予約一覧・詳細・キャンセル処理

報告書作成：生徒ごとの学習報告

公開プロフィール設定：講師情報編集、URL確認

招待リンク発行：保護者／生徒用リンク生成

設定：アカウント情報、受取情報、通知設定

公開ページ

講師公開プロフィール：講師情報、空き枠、チケット情報、予約ボタン（ログイン誘導）

7. 画面遷移
講師側

ログイン／サインアップ → 講師ダッシュボードへ

講師ダッシュボード → カレンダー管理／予約管理／チケット管理／報告書作成／公開プロフィール設定／招待リンク発行／設定

カレンダー管理 → シフト登録／公開設定 → ダッシュボードに戻る

予約管理 → 予約詳細の確認・キャンセル処理 → ダッシュボードに戻る

チケット管理 → 新規作成・編集 → ダッシュボードに戻る

報告書作成 → 入力・公開 → ダッシュボードに戻る

公開プロフィール設定 → 講師情報編集 → ダッシュボードに戻る

招待リンク発行 → リンク生成 → ダッシュボードに戻る

設定 → アカウント／受取情報／通知設定 → ダッシュボードに戻る

生徒・保護者側

ログイン／サインアップ → 生徒ホームへ

生徒ホーム → チケット画面／予約画面／予約一覧／レポート画面／設定

チケット画面 → チケット確認・購入 → 予約画面へ遷移可

予約画面 → 講師カレンダーから予約確定 → 予約一覧へ

予約一覧 → 今後・過去の履歴確認 → 生徒ホームに戻る

レポート画面 → 最新・過去レポート確認 → 生徒ホームに戻る

設定 → アカウント情報・通知設定 → 生徒ホームに戻る

公開ページ

講師公開プロフィール → 空き枠確認・チケット情報 → 「予約する」 → 生徒ログイン画面へ

8. 通知仕様

reservation_confirmed（iCal添付）

reservation_reminder_24h

report_published

low_ticket_balance（残≤3）

9. セキュリティ

Supabase RLS徹底、最小権限ポリシー。

Stripeカード情報は保持しない。Webhook署名検証必須。

監査ログ：action/actor/target/ip/ua を保存。

PII露出制御：公開ページにメール/電話は表示しない。