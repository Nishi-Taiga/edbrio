# EdBrio - CLAUDE.md

## プロジェクト概要

- プロジェクト名: EdBrio
- 概要: 家庭教師・個別指導講師向けオールインワン管理 SaaS（予約・決済・AI報告書・カリキュラム・チャット）
- ターゲットユーザー: 家庭教師（講師）、保護者（生徒の親）、管理者
- 用語辞書: @docs/GLOSSARY.md

## Tech Stack

| Category   | Tech                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| Framework  | Next.js 15 (App Router), React 19, TypeScript 5 (strict)                  |
| UI         | shadcn/ui (new-york), Radix UI, Tailwind CSS v4, lucide-react             |
| DB/Auth    | Supabase (PostgreSQL + Auth + RLS), cookie-based sessions (@supabase/ssr) |
| Payments   | Stripe (Checkout + Connect + Application Fees + Webhook)                  |
| i18n       | next-intl v4 (14 locales, default: ja)                                    |
| AI         | Anthropic Claude SDK (@anthropic-ai/sdk) — lesson report generation       |
| Email      | Resend                                                                    |
| Testing    | Vitest (unit/integration) + Playwright E2E (POM pattern)                  |
| Hosting    | Vercel                                                                    |
| Validation | Zod v4                                                                    |
| Calendar   | FullCalendar v6 + rrule                                                   |
| Editor     | Tiptap v3                                                                 |
| Charts     | Recharts v3                                                               |

## カラーパレット

ブランドカラー: `#6528F7`（紫）。Tailwindデフォルトカラー使用禁止。

| 用途        | Light     | Dark      |
| ----------- | --------- | --------- |
| Primary     | `#7c3aed` | `#8b4ff6` |
| Background  | `#ffffff` | `#0a0812` |
| Foreground  | `#0f0a1a` | `#f0ecf7` |
| Muted       | `#f5f0ff` | `#1a1625` |
| Border      | `#e9e5f0` | `#2a2538` |
| Destructive | `#dc2626` | `#dc2626` |
| Ring        | `#7c3aed` | `#8b4ff6` |

Brand scale: `brand-50` ~ `brand-950` (CSS変数 `--color-brand-*`)

## Commands

```bash
npm run dev / build / lint
npx playwright test [path]
```

## Key Rules

- **Import**: `@/*` alias only, never relative paths
- **i18n**: 日本語最優先、他言語は後回し。未翻訳は docs/i18n-pending.md に追記
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

| Skill                      | Purpose                                                  |
| -------------------------- | -------------------------------------------------------- |
| `e2e-testing.md`           | Playwright patterns, login flow, Radix UI handling       |
| `api-route.md`             | API route template with auth, validation, error handling |
| `component.md`             | Client/Server Component patterns                         |
| `db-migration.md`          | Supabase migration workflow                              |
| `i18n.md`                  | Translation key management, next-intl usage              |
| `security-audit.md`        | OWASP準拠ホワイトハッカー型セキュリティ監査 (5フェーズ)  |
| `vibe-security.md`         | Security checklist for Supabase + Next.js                |
| `verify-implementation.md` | 実装後の検証フロー (build/type/lint/E2E/受入基準)        |

## Commands (.claude/commands/)

| Command                      | Usage                                                                |
| ---------------------------- | -------------------------------------------------------------------- |
| `/security-audit [category]` | セキュリティ監査実行（all, access-control, injection, auth, xss 等） |

## Auth

- Supabase Auth (Email/Password + Google OAuth), cookie-based sessions (`@supabase/ssr`)
- `useAuth` hook (client), `ProtectedRoute` component, 10 failed attempts = 30min lock

## Verification & Specs

- 実装完了後は `verify-implementation` スキルに従って検証してからコミット
- 複雑な機能は `docs/specs/{feature}.md` にスペックを書いてから実装

## Build Notes

- ESLint/TS errors ignored during build (`next.config.ts`: `ignoreDuringBuilds`, `ignoreBuildErrors`)
- Vercel cron: `/api/cron/cleanup-chat-images` (daily 03:00 UTC)
