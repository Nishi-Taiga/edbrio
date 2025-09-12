# EdBrio 家庭教師SaaS

講師と生徒をマッチングする家庭教師プラットフォーム。予約管理から決済まで、必要な機能がすべて揃っています。

## 🚀 開発サーバー起動中

**開発サーバーURL:** http://localhost:3000

## 📋 次に必要な設定

### 1. データベースセットアップ

[Supabase Studio](https://supabase.com/dashboard) でプロジェクト `hkyorpuygokhkezifxjl` を開き、以下のSQLを実行：

```sql
-- ファイル: supabase/migrations/001_initial_schema.sql の内容をコピーして実行
```

### 2. 環境変数の更新

`.env.local` を本番用に更新：

```bash
# Stripe（テスト用から本番用に変更）
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# SendGrid（メール送信用）
SENDGRID_API_KEY=SG.実際のAPIキー
SENDGRID_FROM=noreply@yourdomain.com
```

## 🎯 テスト手順

### 1. 講師アカウント作成
1. http://localhost:3000/auth でサインアップ
2. Role: `teacher` を選択
3. プロフィール設定完了
4. シフト登録 → チケット作成

### 2. 保護者アカウント作成
1. 新しいブラウザ（シークレットモード）で http://localhost:3000/auth
2. Role: `guardian` を選択  
3. チケット購入 → 授業予約

### 3. 公開ページテスト
- http://localhost:3000/teacher/tanaka-ichiro （モックデータ）

## 🏗️ アーキテクチャ

- **フロントエンド:** Next.js 14 + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **認証:** Supabase Auth
- **データベース:** Supabase PostgreSQL + RLS
- **決済:** Stripe Checkout + Application Fee
- **メール:** SendGrid

## 📁 主要ファイル構成

```
src/
├── app/
│   ├── auth/                    # 認証ページ
│   ├── teacher/                 # 講師向けページ
│   │   ├── dashboard/          # ダッシュボード
│   │   ├── profile/            # プロフィール設定
│   │   ├── calendar/           # シフト登録
│   │   ├── tickets/            # チケット管理
│   │   ├── reports/            # レポート作成
│   │   └── [handle]/           # 公開プロフィール
│   ├── guardian/               # 保護者向けページ
│   │   ├── home/               # ホーム
│   │   ├── booking/            # 予約
│   │   └── tickets/            # チケット購入
│   └── api/                    # API Routes
├── components/                  # UIコンポーネント
├── hooks/                      # カスタムフック
└── lib/                        # ユーティリティ
```

## 🔒 セキュリティ

- ✅ Row Level Security (RLS) 実装
- ✅ ロールベースアクセス制御
- ✅ Stripe セキュア決済
- ✅ 認証ガード

## 🚢 デプロイ

### Vercel デプロイ
1. GitHub連携
2. 環境変数設定
3. 自動デプロイ

### Stripe Webhook設定
- Endpoint: `https://yourdomain.com/api/stripe/webhook`
- Events: `checkout.session.completed`

## 📞 サポート

問題が発生した場合は `SETUP.md` を参照してください。

---

**開発完了！** 🎉 すべての機能が実装されています。
