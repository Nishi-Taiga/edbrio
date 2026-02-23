# EdBrio 家庭教師SaaS セットアップガイド

## 1. データベースセットアップ

### Supabase Studio でマイグレーション実行

1. [Supabase Studio](https://supabase.com/dashboard) にアクセス
2. プロジェクト `hkyorpuygokhkezifxjl` を選択
3. 左メニューから「SQL Editor」を開く
4. `supabase/migrations/001_initial_schema.sql` の内容をコピー＆実行

### 必要な設定

```sql
-- 以下のスクリプトを Supabase Studio で実行してください
-- ファイル: supabase/migrations/001_initial_schema.sql
```

## 2. 環境変数設定

`.env.local` ファイルは既に設定済みです：

- ✅ Supabase URL & Keys
- ⚠️ Stripe Keys（本番用に更新が必要）
- ⚠️ SendGrid API Key（メール送信用）

## 3. 開発サーバー起動

```bash
npm run dev
```

開発サーバーは http://localhost:3000 で起動します。

## 4. 初回セットアップ手順

### 講師アカウントの作成
1. `/login` でサインアップ
2. Role: `teacher` を選択
3. プロフィール設定 → Handle設定
4. シフト登録 → チケット作成

### 保護者アカウントの作成
1. `/login` でサインアップ
2. Role: `guardian` を選択
3. チケット購入 → 授業予約

## 5. テスト用データ

### モックデータが実装済み
- 講師プロフィール（田中一郎、佐藤花子、鈴木健太）
- 授業予約スロット
- チケット残高
- レポート履歴

## 6. 主要機能へのアクセス

### 講師向け
- ダッシュボード: `/teacher/dashboard`
- プロフィール設定: `/teacher/profile`
- カレンダー管理: `/teacher/calendar`
- チケット管理: `/teacher/tickets`
- レポート作成: `/teacher/reports`

### 保護者向け
- ホーム: `/guardian/home`
- 授業予約: `/guardian/booking`
- チケット購入: `/guardian/tickets`

### 公開ページ
- 講師プロフィール: `/teacher/[handle]`
- 例: `/teacher/tanaka-ichiro`

## 7. 本番デプロイ時の設定

### Vercel デプロイ
1. Vercel に GitHub連携
2. 環境変数設定
3. ドメイン設定

### Stripe Webhook設定
1. Stripe Dashboard で Webhook URL設定
2. `/api/stripe/webhook` エンドポイント
3. イベント選択: `checkout.session.completed`

### SendGrid 設定
1. SendGrid API Key取得
2. 送信者認証設定
3. テンプレート作成（予約確認・レポート通知）

## 8. セキュリティ設定

✅ Row Level Security (RLS) 実装済み
✅ 認証ガード実装済み
✅ ロールベースアクセス制御

## トラブルシューティング

### 認証エラー
- `.env.local` のSupabase設定確認
- Supabase Auth設定確認

### 決済エラー
- Stripe設定確認
- Webhook URL設定確認

### データベースエラー
- RLSポリシー確認
- テーブル権限確認
