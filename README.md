# EdBrio

家庭教師・個別指導講師のための **AI報告書生成 & 生徒管理プラットフォーム**。

授業記録の入力からAIによるレポート自動生成、予約管理、チケット決済まで、個別指導に必要な業務をワンストップで提供します。

## 主な機能

### 講師向け
- **AI報告書生成** — 授業メモから保護者向けレポートを自動生成（Anthropic Claude）
- **カレンダー・シフト管理** — FullCalendarによるシフト登録、繰り返しスケジュール対応
- **生徒管理** — プロフィール・弱点分析・学習記録の一元管理
- **予約管理** — 保護者からの予約を確認・承認
- **チケット販売** — 授業チケットの作成・価格設定

### 保護者向け
- **授業予約** — 空き枠からワンクリック予約、週間カレンダー表示
- **チケット購入** — Stripe決済による安全なチケット購入
- **レポート閲覧** — AI生成レポートの閲覧・ダウンロード
- **メール通知** — 予約確認・リマインダー・レポート公開通知

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui + Lucide Icons |
| 認証・DB | Supabase (Auth / PostgreSQL / RLS / SSR) |
| AI | Anthropic Claude API (`@anthropic-ai/sdk`) |
| 決済 | Stripe Checkout + Application Fee |
| メール | Resend SDK |
| カレンダー | FullCalendar + rrule（繰り返しスケジュール） |
| エディタ | Tiptap（リッチテキスト編集） |
| テーマ | next-themes（ダーク/ライトモード） |
| デプロイ | Vercel |

## プロジェクト構成

```
src/
├── app/
│   ├── (public)
│   │   ├── page.tsx              # ランディングページ
│   │   ├── login/                # 認証ページ
│   │   └── legal/                # 利用規約・プライバシーポリシー
│   ├── teacher/                  # 講師向けページ
│   │   ├── dashboard/            # ダッシュボード
│   │   ├── calendar/             # シフト・カレンダー管理
│   │   ├── students/             # 生徒管理
│   │   ├── reports/              # レポート作成・管理
│   │   ├── bookings/             # 予約管理
│   │   ├── tickets/              # チケット管理
│   │   └── profile/              # プロフィール設定
│   ├── guardian/                  # 保護者向けページ
│   │   ├── dashboard/            # ダッシュボード
│   │   ├── booking/              # 授業予約
│   │   ├── reports/              # レポート閲覧
│   │   ├── bookings/             # 予約履歴
│   │   └── tickets/              # チケット購入
│   ├── admin/                    # 管理者向けページ
│   └── api/
│       ├── ai/generate-report/   # AI報告書生成
│       ├── email/send/           # メール送信
│       ├── checkout/session/     # Stripe Checkout
│       ├── stripe/onboard/       # Stripe Connect
│       └── cron/booking-reminder/# 予約リマインダー（Cron）
├── components/
│   ├── ui/                       # shadcn/ui コンポーネント
│   └── calendar/                 # カレンダー関連コンポーネント
├── hooks/                        # カスタムフック（予約・シフト・空き枠）
└── lib/
    ├── supabase/                 # Supabaseクライアント（server/client）
    ├── email.ts                  # メール送信ユーティリティ
    └── rate-limit.ts             # APIレート制限
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

# Anthropic (AI報告書生成)
ANTHROPIC_API_KEY=

# Resend (メール送信)
RESEND_API_KEY=
RESEND_FROM=info@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron (本番のみ)
CRON_SECRET=
```

### 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセスできます。

## データベース

Supabase上のPostgreSQLを使用。主要テーブル：

- `users` — ユーザー（講師・保護者・管理者）
- `student_profiles` — 生徒プロフィール
- `shifts` — 講師シフト
- `availability` — 空き枠（シフトから自動生成）
- `bookings` — 予約
- `tickets` — チケット商品
- `reports` — AIレポート

すべてのテーブルにRow Level Security (RLS) が設定されています。

## セキュリティ

- Row Level Security (RLS) による行レベルアクセス制御
- ロールベースルーティング（講師/保護者/管理者）
- APIエンドポイントにレート制限を適用
- Stripe Checkout によるPCI DSS準拠の決済
- CronエンドポイントはBearer Token認証で保護

## ライセンス

Private
