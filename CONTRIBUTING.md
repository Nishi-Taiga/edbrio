# 開発ガイド（CONTRIBUTING.md）

## 0. Git用語集

開発で使う用語の説明です。初めての方はここから読んでください。

### 基本用語

| 用語 | 意味 |
|------|------|
| **リポジトリ（Repository）** | プロジェクトのコード・履歴をまとめて管理する場所。GitHubにある「edbrio」がこのプロジェクトのリポジトリ |
| **クローン（Clone）** | リポジトリを自分のPCにコピーすること。最初に1回だけ行う |
| **コミット（Commit）** | 変更を「保存ポイント」として記録すること。ゲームのセーブに近い。コミットメッセージで何を変えたか書く |
| **プッシュ（Push）** | 自分のPCのコミットをGitHubにアップロードすること。これをしないと他の人に変更が共有されない |
| **プル（Pull）** | GitHubの最新のコードを自分のPCにダウンロードすること。作業開始前に行う |
| **ブランチ（Branch）** | コードの「作業コピー」。本番コード（master）に影響を与えずに機能開発ができる |
| **マージ（Merge）** | ブランチの変更を別のブランチに統合すること。完成した機能をmasterに取り込む時に使う |

### GitHub用語

| 用語 | 意味 |
|------|------|
| **PR（Pull Request）** | 「この変更をmasterに取り込んでください」というリクエスト。レビューを受けてから取り込まれる |
| **レビュー（Review）** | PRの変更内容を他の人がチェックすること。問題があればコメントで指摘する |
| **Approve（承認）** | レビューでOKを出すこと。承認されたらマージできる |
| **Issue** | タスク・バグ・質問を管理するチケット。「何をするか」を書いて担当者を決める |
| **Squash and Merge** | 複数のコミットを1つにまとめてマージすること。履歴がきれいになる |

### よく使う操作の流れ

```
① masterを最新にする
   git checkout master
   git pull origin master

② 作業用ブランチを作る
   git checkout -b feat/weak-points-ui
   （ここから自由にコードを変更できる。masterには影響しない）

③ コードを変更して保存する
   git add src/components/curriculum/weak-point-list.tsx
   git commit -m "feat: 弱点UIコンポーネントの追加"
   （この時点ではまだ自分のPCの中だけ）

④ GitHubにアップロードする
   git push -u origin feat/weak-points-ui
   （GitHubに変更が反映される）

⑤ GitHubでPRを作成する
   GitHub上で「Pull Request」ボタンを押して作成
   → リードがレビュー → 承認 → マージ → masterに反映
```

### コンフリクト（Conflict）とは

2人が同じファイルの同じ箇所を変更した場合に発生します。

```
<<<<<<< HEAD
自分の変更
=======
相手の変更
>>>>>>> feat/other-feature
```

このような表示が出たら、どちらの変更を残すか選んで修正します。
困ったときはIssueで相談してください。

### 用語の関係図

```
あなたのPC                          GitHub
┌──────────────┐                ┌──────────────┐
│              │  ── push ──►  │              │
│  ローカル     │                │  リモート     │
│  リポジトリ   │  ◄── pull ──  │  リポジトリ   │
│              │                │              │
│  master      │                │  master      │ ← 本番（Vercelが自動デプロイ）
│  feat/xxx    │                │  feat/xxx    │ ← PRを作成してレビュー
└──────────────┘                └──────────────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │   Vercel     │
                                │  自動デプロイ  │
                                │  本番サイト    │
                                └──────────────┘
```

---

## チーム体制

| 役割 | 担当 |
|------|------|
| リード | プロジェクト全体の設計・レビュー・マージ権限 |
| メンバー | 機能実装・テスト・PR作成 |

連絡手段: **GitHub Issues**

---

## 1. ブランチ戦略

```
master（本番）
  └── feat/xxx（機能開発）
  └── fix/xxx（バグ修正）
```

### ルール

- `master` = 本番環境（Vercelが自動デプロイ）
- `master` への直接pushは禁止 → 必ずPR経由
- 作業は必ずブランチを切って行う

### ブランチ命名規則

| 種類 | 命名 | 例 |
|------|------|----|
| 新機能 | `feat/機能名` | `feat/weak-points-ui` |
| バグ修正 | `fix/内容` | `fix/skill-form-validation` |
| リファクタリング | `refactor/内容` | `refactor/curriculum-hooks` |
| ドキュメント | `docs/内容` | `docs/api-reference` |

### ブランチの作り方

```bash
# masterを最新にしてからブランチ作成
git checkout master
git pull origin master
git checkout -b feat/weak-points-ui
```

---

## 2. コミットメッセージ

### フォーマット

```
種類: 日本語で簡潔に内容を書く
```

### 種類一覧

| 種類 | 用途 |
|------|------|
| `feat` | 新機能の追加 |
| `fix` | バグ修正 |
| `refactor` | 機能変更なしのコード改善 |
| `docs` | ドキュメントの追加・修正 |
| `test` | テストの追加・修正 |
| `chore` | ビルド設定・依存関係の更新 |

### 例

```
feat: 弱点UIコンポーネントの追加
fix: スキル評価フォームのバリデーションエラーを修正
refactor: useStudentCurriculum hookの型定義を整理
```

### 注意

- 1コミット = 1つの変更（大きな変更は分割する）
- 動く状態でコミットする（ビルドが通らないコミットは避ける）

---

## 3. Pull Request（PR）

### 作成ルール

1. PRタイトルはコミットメッセージと同じフォーマット
2. 本文に「何を変えたか」「なぜ変えたか」を書く
3. 関連するIssue番号をリンクする（`Closes #12`）

### PRテンプレート

```markdown
## 概要
<!-- 何を変更したかを1〜3行で -->

## 変更内容
- 
- 

## テスト方法
- [ ] ローカルで動作確認済み
- [ ] ビルドが通ることを確認（`npm run build`）

## 関連Issue
Closes #
```

### レビューフロー

```
メンバー: PR作成 → リードにレビュー依頼
リード: レビュー → 承認 or 修正依頼
メンバー: 修正があれば対応 → 再レビュー依頼
リード: 承認 → マージ
```

- PRは必ずリードがレビューしてからマージ
- マージ方法: **Squash and merge**（履歴をきれいに保つ）

---

## 4. GitHub Issues の使い方

### Issue作成ルール

- 1つのIssueに1つのタスク（大きすぎる場合は分割）
- ラベルをつける

### ラベル

| ラベル | 用途 |
|--------|------|
| `feature` | 新機能 |
| `bug` | バグ |
| `question` | 質問・相談 |
| `blocked` | 他タスクの完了待ち |

### ワークフロー

```
Issue作成 → ブランチ作成 → 実装 → PR作成（IssueをCloses） → レビュー → マージ → Issue自動クローズ
```

---

## 5. 開発環境セットアップ

### 必要なツール

- Node.js 20以上
- npm（パッケージマネージャ）
- Git
- VS Code（推奨エディタ）

### 推奨VS Code拡張機能

- ESLint
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- Japanese Language Pack

### 初回セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/Nishi-Taiga/edbrio.git
cd edbrio

# 依存パッケージをインストール
npm install

# 環境変数ファイルを作成（リードから値を受け取る）
cp .env.example .env.local

# 開発サーバー起動
npm run dev
```

### 環境変数（.env.local）

リードから以下の値を受け取って設定してください：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

> **注意**: `.env.local` はGitにコミットしない（`.gitignore` に含まれている）

---

## 6. コーディング規約

### 基本ルール

- TypeScriptの型は省略しない（`any` は禁止）
- コンポーネントは関数コンポーネント + hooks で書く
- CSSはTailwind CSSのユーティリティクラスを使う（カスタムCSSは最小限）
- 既存のコードパターンに合わせる（新しいパターンを勝手に導入しない）

### ファイル命名規則

| 種類 | 命名規則 | 例 |
|------|----------|----|
| コンポーネント | kebab-case | `student-card.tsx` |
| フック | `use-`接頭辞 + kebab-case | `use-student-profiles.ts` |
| 型定義 | PascalCase（ファイル内） | `interface StudentProfile {}` |
| ページ | `page.tsx`（Next.js規約） | `curriculum/page.tsx` |

### ディレクトリ構成（カリキュラム関連）

```
src/
├── app/[locale]/teacher/(dashboard)/curriculum/
│   ├── page.tsx                    # 生徒一覧
│   └── [profileId]/page.tsx        # 生徒詳細
├── components/curriculum/
│   ├── student-card.tsx            # 生徒カード
│   ├── unit-list.tsx               # ユニット一覧
│   ├── unit-form.tsx               # ユニット作成フォーム
│   ├── goal-list.tsx               # 目標一覧
│   ├── goal-form.tsx               # 目標作成フォーム
│   ├── skill-list.tsx              # スキル一覧
│   └── skill-form.tsx              # スキル評価フォーム
└── hooks/
    ├── use-student-profiles.ts     # プロフィールCRUD
    └── use-student-curriculum.ts   # カリキュラムデータ管理
```

### 新しいコンポーネントの作り方

既存パターンに合わせてください。例：`goal-list.tsx` を参考に `weak-point-list.tsx` を作る。

```tsx
'use client'

import { useState } from 'react'
// 既存のUIコンポーネントを使う
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Props {
  profileId: string
}

export function WeakPointList({ profileId }: Props) {
  // 実装
}
```

---

## 7. 開発の進め方

### 作業手順

1. **Issueを確認** — 担当するIssueを選ぶ
2. **ブランチを作成** — `feat/issue内容` の命名で
3. **実装** — 小さく区切ってコミット
4. **ローカルで確認** — `npm run dev` で動作確認
5. **ビルド確認** — `npm run build` でエラーがないことを確認
6. **PR作成** — テンプレートに沿って記入
7. **レビュー対応** — 指摘があれば修正

### 困ったとき

- まずIssueにコメントで質問する
- エラーメッセージは全文を貼る
- スクリーンショットがあると伝わりやすい

---

## 8. よく使うコマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド（PR前に必ず実行）
npm run build

# リント
npm run lint

# テスト
npm run test

# Storybook
npm run storybook

# masterを最新にする
git checkout master && git pull origin master

# ブランチ作成
git checkout -b feat/機能名

# 変更をステージ＆コミット
git add ファイル名
git commit -m "feat: 説明"

# プッシュ
git push -u origin feat/機能名
```
