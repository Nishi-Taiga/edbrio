# EdBrio - CLAUDE.md

家庭教師プラットフォーム SaaS。Next.js 15 App Router + React 19 + Supabase + Stripe。

## Tech Stack

| Category | Tech |
|----------|------|
| Framework | Next.js 15 (App Router), React 19, TypeScript 5 (strict) |
| UI | shadcn/ui (new-york), Radix UI, Tailwind CSS v4, lucide-react |
| DB/Auth | Supabase (PostgreSQL + Auth + RLS) |
| Payments | Stripe (Checkout + Webhook + Billing Portal) |
| i18n | next-intl v4 (14 locales, default: ja) |
| AI | Anthropic Claude SDK (lesson reports) |
| Email | Resend |
| Testing | Playwright E2E (POM pattern) |
| Hosting | Vercel |

## Commands

```bash
npm run dev / build / lint
npx playwright test [path]
```

## Key Rules

- **Import**: `@/*` alias only, never relative paths
- **i18n**: 日本語最優先、他言語は後回し。未翻訳は memory/i18n-pending.md に追記
- **Client Component**: `'use client'` + `useMemo(() => createClient(), [])`
- **Server Component**: `await createClient()` from `@/lib/supabase/server`
- **API Routes**: `force-dynamic` + `getUser()` (not getSession) + Zod + rate limit → see `.claude/skills/api-route.md`
- **DB**: RLS 必須、新 migration SQL で変更 → see `.claude/skills/db-migration.md`
- **Styling**: `cn()` (clsx + tailwind-merge), lucide-react icons, sonner toasts
- **File naming**: Components `kebab-case.tsx`, Hooks `use-*.ts`, API `[feature]/route.ts`, page-local `_components/`
- **TypeScript**: strict mode, DB types in `src/lib/types/database.ts` (manual), UserRole: `teacher | guardian | student`
- **Commit**: English, conventional commits (feat/fix/refactor/...), always push after commit
- **Branch**: master = production
- **Testing**: POM pattern, `data-testid` attributes, no `waitForTimeout()` → see `.claude/skills/e2e-testing.md`
- **E2E必須**: 機能修正後は対応する E2E テストを作成・実行すること。テストは `tests/e2e/` 配下に配置

## Skills (.claude/skills/)

| Skill | Purpose |
|-------|---------|
| `e2e-testing.md` | Playwright patterns, login flow, Radix UI handling |
| `api-route.md` | API route template with auth, validation, error handling |
| `component.md` | Client/Server Component patterns |
| `db-migration.md` | Supabase migration workflow |
| `i18n.md` | Translation key management, next-intl usage |

## Auth

- Supabase Auth (Email/Password + Google OAuth), cookie-based sessions (`@supabase/ssr`)
- `useAuth` hook (client), `ProtectedRoute` component, 10 failed attempts = 30min lock

## Build Notes

- ESLint/TS errors ignored during build (`next.config.ts`: `ignoreDuringBuilds`, `ignoreBuildErrors`)
- Vercel cron: `/api/cron/cleanup-chat-images` (daily 03:00 UTC)
