# EdBrio - CLAUDE.md

EdBrio は家庭教師プラットフォーム SaaS。Next.js 15 App Router + React 19 + Supabase + Stripe で構成。

## Tech Stack

| カテゴリ | 技術 |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript 5 (strict) |
| UI | shadcn/ui (new-york style), Radix UI, Tailwind CSS v4, lucide-react |
| DB/Auth | Supabase (PostgreSQL + Auth + RLS) |
| Payments | Stripe (Checkout + Webhook + Billing Portal) |
| i18n | next-intl v4 (14 locales, default: ja) |
| AI | Anthropic Claude SDK (レッスンレポート生成) |
| Email | Resend (トランザクションメール) |
| Testing | Playwright (E2E のみ、ユニットテストなし) |
| Hosting | Vercel |

## Project Structure

```
src/
├── app/              # Next.js App Router (pages, layouts, API routes)
│   ├── [locale]/     # i18n ルーティング
│   └── api/          # API routes (REST)
├── components/
│   ├── ui/           # shadcn/ui プリミティブ
│   ├── layout/       # レイアウト共通コンポーネント
│   └── [domain]/     # 機能別コンポーネント (auth, teacher, guardian, etc.)
├── hooks/            # カスタム Hooks (use-[feature].ts)
├── i18n/             # next-intl 設定 (routing, request, navigation)
└── lib/
    ├── supabase/     # Supabase クライアント (client, server, admin, middleware)
    ├── types/        # 型定義 (database.ts)
    ├── validations.ts # Zod バリデーション
    └── rate-limit.ts # レートリミッター
messages/             # 翻訳 JSON (ja.json, en.json, etc.)
supabase/migrations/  # DB マイグレーション SQL
tests/                # Playwright E2E テスト
```

## Development Commands

```bash
npm run dev           # 開発サーバー起動 (localhost:3000)
npm run build         # プロダクションビルド
npm run lint          # ESLint 実行
npx playwright test   # E2E テスト実行
```

## Coding Conventions

### ファイル命名

- コンポーネント: `kebab-case.tsx` (例: `auth-form.tsx`)
- Hooks: `use-[feature].ts` (例: `use-bookings.ts`)
- API routes: ディレクトリベース `[feature]/route.ts`
- ページローカルコンポーネント: `_components/` サブディレクトリ

### インポート

- パスエイリアス `@/*` を常に使用 (`./src/*` に対応)、相対パスは使わない
- 例: `import { cn } from '@/lib/utils'`

### React パターン

- Client Component: `'use client'` ディレクティブ + `useMemo(() => createClient(), [])` で Supabase クライアント生成
- Server Component: `await createClient()` from `@/lib/supabase/server`
- 状態管理: グローバルストアなし。カスタム Hooks + useState/useEffect で管理
- スタイリング: `cn()` ユーティリティ (clsx + tailwind-merge) でクラス結合
- アイコン: lucide-react を使用
- トースト通知: sonner の `toast()` を使用

### API Routes パターン

- `export const dynamic = 'force-dynamic'` を設定
- `createClient()` で認証確認 → Zod でバリデーション → DB 操作
- レスポンス: `NextResponse.json({ error: '...' }, { status: NNN })`
- レートリミッター適用 (`@/lib/rate-limit.ts`)
- Admin API: Basic Auth (middleware で制御)

### TypeScript

- strict モード有効
- DB 型は `src/lib/types/database.ts` に手動定義 (自動生成ではない)
- UserRole: `'teacher' | 'guardian' | 'student'`

## Database (Supabase)

- RLS (Row Level Security) 有効 — ポリシーを必ず設定
- マイグレーションは `supabase/migrations/` に連番 SQL ファイル
- Service Role クライアント (`@/lib/supabase/admin`) は Webhook/Server Action 専用 (RLS バイパス)
- テーブル変更時は新規マイグレーション SQL を作成すること

## i18n (多言語化)

- **日本語 (ja) を最優先で実装**、他言語は後回し
- 未翻訳キーは `i18n-pending.md` に追記し、翻訳完了後に削除
- 14 locales: ja, en, fr, es, it, sv, ru, zh, ko, ar, pt, de, hi, zh-TW
- デフォルト locale: `ja` (URL プレフィックスなし、`as-needed` 戦略)
- Client: `useTranslations('namespace')` / Server: `getTranslations('namespace')`
- ナビゲーション: `@/i18n/navigation` の `Link`, `redirect`, `useRouter` を使用
- Admin ルートは日本語固定

## Authentication

- Supabase Auth (Email/Password + Google OAuth)
- Cookie ベースのセッション管理 (`@supabase/ssr`)
- `useAuth` Hook でクライアント側の認証状態取得
- `ProtectedRoute` コンポーネントでルート保護
- ログイン試行制限: 10 回失敗で 30 分ロック (middleware)

## Workflow Rules

- **修正後は必ず `git commit` & `git push` まで行うこと**
- コミットメッセージは英語で、Conventional Commits 形式 (feat:, fix:, refactor:, etc.)
- ブランチ: master が本番ブランチ

## Environment Variables

主要な環境変数 (`.env` / `.env.local`):

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase 接続
- `SUPABASE_SERVICE_ROLE_KEY` — Service Role (サーバー専用)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` — Stripe
- `STRIPE_WEBHOOK_SECRET` — Stripe Webhook 検証
- `RESEND_API_KEY` — メール送信
- `ANTHROPIC_API_KEY` — AI レポート生成
- `ADMIN_BASIC_AUTH_USER` / `ADMIN_BASIC_AUTH_PASS` — Admin 認証
- `NEXT_PUBLIC_APP_URL` — アプリ URL

## Build Notes

- `next.config.ts` で ESLint と TypeScript のビルドエラーを無視する設定 (`ignoreDuringBuilds: true`, `ignoreBuildErrors: true`)
- Vercel cron: `/api/cron/cleanup-chat-images` (毎日 03:00 UTC)
