# EdBrio

家庭教師・個別指導講師のための **AI報告書生成 & 生徒管理プラットフォーム**。

授業記録の入力からAIによるレポート自動生成、予約管理、チケット決済まで、個別指導に必要な業務をワンストップで提供します。

## 主な機能

### 講師向け
- **AI報告書生成** — 授業メモから保護者向けレポートを自動生成（Anthropic Claude）
- **ダッシュボード** — 今日のレッスン概要、カレンダー、タスク管理、月次統計を一画面に集約
- **カレンダー・シフト管理** — FullCalendarによるシフト登録、繰り返しスケジュール対応
- **生徒カリキュラム管理** — 学習目標・弱点・スキル・ユニット・引継ぎメモの一元管理
- **予約管理** — 保護者からの予約を確認・承認・却下
- **チケット販売** — 授業チケットの作成・価格設定・在庫管理
- **メッセージ機能** — 保護者とのリアルタイムチャット（画像送信対応）
- **プロフィール設定** — 自己紹介・科目・学年設定、Stripe Connect連携、プラン管理
- **保護者招待** — メールまたはQRコードで保護者を招待

### 保護者向け
- **ダッシュボード** — 直近の予約・チケット残高・レポート概要・学習進捗を一覧表示
- **授業予約** — 講師の空き枠から週間カレンダーで簡単予約
- **チケット購入** — Stripe決済による安全なチケット購入
- **予約履歴** — 過去の予約一覧・キャンセル・フィルタリング
- **レポート閲覧** — AI生成レポートの閲覧
- **メッセージ機能** — 講師とのリアルタイムチャット
- **設定** — 通知設定・テーマ変更

### 管理者向け
- **ダッシュボード** — ユーザー数・予約数・売上のトレンド分析
- **ユーザー管理** — 全ユーザーの一覧・詳細確認
- **予約・レポート・チケット・支払い分析** — 各種データの集計・分析
- **監査ログ** — システム操作の履歴

### 共通機能
- **多言語対応（i18n）** — 14言語サポート（日本語がデフォルト）
- **ダーク/ライトモード** — テーマ切り替え
- **レスポンシブデザイン** — モバイル専用レイアウト対応
- **メール通知** — 予約確認・リマインダー・レポート公開通知（Resend）
- **SEO対応** — robots.txt、サイトマップ、OGP メタタグ

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui + Lucide Icons |
| 認証・DB | Supabase (Auth / PostgreSQL / RLS / SSR) |
| AI | Anthropic Claude API (`@anthropic-ai/sdk`) |
| 決済 | Stripe Checkout + Connect + Application Fee |
| メール | Resend SDK |
| カレンダー | FullCalendar v6 + rrule（繰り返しスケジュール） |
| エディタ | Tiptap（リッチテキスト編集） |
| チャート | Recharts（学習進捗グラフ） |
| テーマ | next-themes（ダーク/ライトモード） |
| i18n | next-intl（14言語対応） |
| テスト | Playwright（E2Eテスト） |
| デプロイ | Vercel |

## プロジェクト構成

```
src/
├── app/
│   ├── [locale]/
│   │   ├── page.tsx                # ランディングページ
│   │   ├── login/                  # 認証ページ
│   │   ├── pricing/                # 料金プラン
│   │   ├── legal/                  # 利用規約・プライバシーポリシー・特商法
│   │   ├── contact/                # お問い合わせ
│   │   ├── forgot-password/        # パスワードリセット
│   │   ├── reset-password/         # 新パスワード設定
│   │   ├── invite/[token]/         # 招待受付
│   │   ├── teacher/
│   │   │   ├── setup/              # 初期セットアップウィザード
│   │   │   └── (dashboard)/
│   │   │       ├── dashboard/      # ダッシュボード（デスクトップ・モバイル対応）
│   │   │       ├── calendar/       # シフト・カレンダー管理
│   │   │       ├── reports/        # レポート作成・管理・AI生成
│   │   │       ├── curriculum/     # 生徒カリキュラム管理
│   │   │       ├── tickets/        # チケット管理
│   │   │       ├── chat/           # メッセージ
│   │   │       ├── profile/        # プロフィール・プラン設定
│   │   │       └── contact/        # お問い合わせ
│   │   └── guardian/
│   │       ├── dashboard/          # ダッシュボード
│   │       ├── booking/            # 授業予約
│   │       ├── bookings/           # 予約履歴
│   │       ├── reports/            # レポート閲覧
│   │       ├── tickets/            # チケット購入
│   │       ├── chat/               # メッセージ
│   │       ├── settings/           # 設定
│   │       └── contact/            # お問い合わせ
│   ├── admin/                      # 管理者ページ（Basic Auth）
│   │   ├── dashboard/              # 管理ダッシュボード
│   │   ├── users/                  # ユーザー管理
│   │   ├── bookings/               # 予約分析
│   │   ├── reports/                # レポート分析
│   │   ├── tickets/                # チケット分析
│   │   ├── payments/               # 支払い管理
│   │   └── audit/                  # 監査ログ
│   └── api/
│       ├── auth/login/             # ログイン（レート制限付き）
│       ├── auth/callback/          # OAuth コールバック
│       ├── ai/generate-report/     # AI報告書生成
│       ├── email/send/             # メール送信
│       ├── checkout/session/       # Stripe Checkout
│       ├── checkout/subscription/  # サブスクリプション
│       ├── stripe/webhook/         # Stripe Webhook
│       ├── stripe/onboard/         # Stripe Connect
│       ├── stripe/portal/          # Stripe ポータル
│       ├── invites/                # 招待管理
│       ├── booking-reports/        # 予約レポート
│       ├── contact/                # お問い合わせ API
│       ├── areas/                  # エリアデータ
│       ├── teacher/tickets/grant/  # 無料チケット付与
│       ├── notification-preferences/ # 通知設定
│       ├── cron/booking-reminder/  # 予約リマインダー（Cron）
│       ├── cron/auto-approve-reports/ # レポート自動承認（Cron）
│       └── cron/cleanup-chat-images/ # チャット画像クリーンアップ（Cron）
├── components/
│   ├── ui/                         # shadcn/ui コンポーネント
│   ├── layout/                     # レイアウト（サイドバー・ヘッダー）
│   ├── auth/                       # 認証フォーム
│   ├── calendar/                   # カレンダー関連
│   ├── reports/                    # レポート関連
│   ├── curriculum/                 # カリキュラム関連
│   ├── chat/                       # チャット関連
│   └── dashboard/                  # ダッシュボード関連
├── hooks/                          # カスタムフック
│   ├── use-auth.ts                 # 認証
│   ├── use-bookings.ts             # 予約
│   ├── use-reports.ts              # レポート
│   ├── use-shifts.ts               # シフト
│   ├── use-availability.ts         # 空き枠
│   ├── use-tickets.ts              # チケット
│   ├── use-conversations.ts        # 会話
│   ├── use-messages.ts             # メッセージ
│   ├── use-student-profiles.ts     # 生徒プロフィール
│   ├── use-student-curriculum.ts   # カリキュラム
│   ├── use-ai-report.ts            # AI レポート生成
│   └── use-unread-count.ts         # 未読数
├── lib/
│   ├── supabase/                   # Supabaseクライアント（server/client/admin）
│   ├── stripe.ts                   # Stripe クライアント
│   ├── email.ts                    # メール送信ユーティリティ
│   ├── rate-limit.ts               # APIレート制限
│   ├── validations.ts              # Zodバリデーション
│   ├── i18n-date.ts                # ロケール対応日付フォーマット
│   ├── i18n-format.ts              # ロケール対応数値フォーマット
│   └── teacher-setup.ts            # オンボーディングチェック
├── i18n/                           # 多言語設定
│   ├── routing.ts                  # ロケール設定
│   ├── request.ts                  # サーバーサイドメッセージ読み込み
│   └── navigation.ts              # 型付きナビゲーション
└── messages/                       # 翻訳ファイル（14言語）
```

## セットアップ

### 前提条件

- Node.js 18+
- npm
- Supabase プロジェクト
- Stripe アカウント（テストモード可）
- Anthropic API キー
- Resend アカウント

### インストール

```bash
git clone https://github.com/Nishi-Taiga/edbrio.git
cd edbrio
npm install
```

### 環境変数

`.env.local` を作成し、以下を設定：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# プラットフォーム手数料
EDBRIO_PLATFORM_FEE_PERCENT_FREE=7
EDBRIO_PLATFORM_FEE_PERCENT_STANDARD=2
EDBRIO_MIN_FEE_JPY=50

# Anthropic (AI報告書生成)
ANTHROPIC_API_KEY=

# Resend (メール送信)
RESEND_API_KEY=
RESEND_FROM=info@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin (管理画面Basic Auth)
ADMIN_BASIC_AUTH_USER=
ADMIN_BASIC_AUTH_PASS=

# Cron (本番のみ)
CRON_SECRET=

# E2E テスト用
E2E_TEACHER_EMAIL=
E2E_TEACHER_PASSWORD=
E2E_GUARDIAN_EMAIL=
E2E_GUARDIAN_PASSWORD=
```

### 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセスできます。

## テスト

Playwright によるE2Eテストを実装しています。

### テスト実行

```bash
# Playwright をインストール（初回のみ）
npx playwright install

# テスト実行（開発サーバーが起動している状態で）
npx playwright test

# 特定のテストファイルを実行
npx playwright test tests/full-feature.spec.ts

# UIモードで実行
npx playwright test --ui
```

### テストカバレッジ

| カテゴリ | テスト数 | 内容 |
|---|---|---|
| パブリックページ | 7 | ランディング、ログイン、サインアップ切替、料金、法務、問い合わせ、パスワードリセット |
| 認証フロー | 3 | 講師ログイン、保護者ログイン、無効な認証情報 |
| 講師機能 | 9 | ダッシュボード、レポート一覧、レポート新規作成、カレンダー、チケット、カリキュラム、プロフィール、チャット、問い合わせ |
| 保護者機能 | 7 | ダッシュボード、予約、レポート、チケット、予約履歴、設定、チャット |
| ナビゲーション | 3 | 講師サイドバー、保護者サイドバー、言語切替 |
| レスポンシブ | 2 | モバイルランディング、モバイル講師ダッシュボード |
| API | 5 | 問い合わせAPI、認証API、AI生成API、チェックアウトAPI、CronAPI |
| **合計** | **36** | |

## データベース

Supabase上のPostgreSQLを使用。主要テーブル：

- `users` — ユーザー（講師・保護者・管理者）
- `teachers` — 講師プロフィール（プラン、Stripe ID等）
- `student_profiles` — 生徒プロフィール
- `shifts` — 講師シフト
- `availability` — 空き枠（シフトから自動生成）
- `bookings` — 予約
- `tickets` — チケット商品
- `ticket_balances` — チケット残高
- `reports` — AIレポート
- `conversations` — チャットスレッド
- `messages` — チャットメッセージ

すべてのテーブルにRow Level Security (RLS) が設定されています。

## セキュリティ

- Row Level Security (RLS) による行レベルアクセス制御
- ロールベースルーティング（講師/保護者/管理者）
- ログイン試行回数制限（10回失敗で30分ロックアウト）
- APIエンドポイントにレート制限を適用（トークンバケット方式）
- Stripe Checkout によるPCI DSS準拠の決済
- CronエンドポイントはBearer Token認証で保護
- 管理画面はHTTP Basic Auth で保護
- セキュリティヘッダー（HSTS、CSP、X-Frame-Options、Referrer-Policy）

## ライセンス

Private
