# 🧪 テスト実行ガイド

## ✅ 現在の状況
- 開発サーバー稼働中: http://localhost:3000
- Stripe設定済み（テストキー）
- Supabase設定済み

## 📋 事前準備（重要）

### 1. データベースセットアップ

[Supabase Studio](https://supabase.com/dashboard) → プロジェクト `hkyorpuygokhkezifxjl` で以下を順番に実行：

```sql
-- 1. メインスキーマ作成
-- ファイル: supabase/migrations/001_initial_schema.sql をコピーして実行

-- 2. ユーザー自動作成トリガー
-- ファイル: supabase/functions/handle-new-user.sql をコピーして実行
```

## 🎯 テスト手順

### ステップ1: 講師アカウント作成

1. **ブラウザ1でアクセス**
   ```
   http://localhost:3000/auth
   ```

2. **サインアップ**
   ```
   メール: teacher@test.com
   パスワード: test123456
   名前: テスト講師
   役割: teacher ← 重要！
   ```

3. **メール認証**
   - Supabaseから送信される確認メールをクリック
   - または Supabase Studio → Authentication → Users で手動確認

4. **講師機能テスト**
   - `/teacher/dashboard` - ダッシュボード表示確認
   - `/teacher/profile` - プロフィール編集
   - `/teacher/calendar` - シフト登録
   - `/teacher/tickets` - チケット作成

### ステップ2: 保護者アカウント作成

1. **別ブラウザ（シークレットモード）でアクセス**
   ```
   http://localhost:3000/auth
   ```

2. **サインアップ**
   ```
   メール: guardian@test.com
   パスワード: test123456
   名前: テスト保護者
   役割: guardian ← 重要！
   ```

3. **保護者機能テスト**
   - `/guardian/home` - ホーム画面表示確認
   - `/guardian/booking` - 授業予約
   - `/guardian/tickets` - チケット購入

### ステップ3: 決済テスト

1. **テスト用カード情報**
   ```
   カード番号: 4242 4242 4242 4242
   有効期限: 任意の未来日（例：12/34）
   CVC: 任意の3桁（例：123）
   郵便番号: 任意
   ```

2. **決済フロー確認**
   - チケット購入 → Stripe画面 → 決済完了 → 残高反映

### ステップ4: 公開ページテスト

```
http://localhost:3000/teacher/test-teacher
```

## 🔧 トラブルシューティング

### 認証エラーが発生する場合

1. **Supabaseプロジェクト確認**
   ```
   URL: https://hkyorpuygokhkezifxjl.supabase.co
   ```

2. **マイグレーション実行確認**
   - SQL Editor でテーブル作成済みか確認
   - `SELECT * FROM public.users LIMIT 1;`

### データが表示されない場合

1. **RLSポリシー確認**
   ```sql
   -- Supabase Studio で確認
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

2. **ユーザーデータ確認**
   ```sql
   -- 認証ユーザー確認
   SELECT * FROM auth.users;
   
   -- アプリケーションユーザー確認
   SELECT * FROM public.users;
   ```

### 決済エラーが発生する場合

1. **Stripeキー確認**
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51S6KhD...
   STRIPE_SECRET_KEY=sk_test_51S6KhD...
   ```

2. **ネットワーク確認**
   - 開発者ツール → Network タブでAPI呼び出し確認

## 📊 期待される動作

### 講師ダッシュボード
- ✅ 今日の予定、収益、生徒数表示
- ✅ 最近の予約一覧
- ✅ クイックアクション動作

### 保護者ホーム
- ✅ 次の授業、残りチケット表示
- ✅ 新着レポート表示
- ✅ 予約・購入ボタン動作

### 予約システム
- ✅ カレンダー表示
- ✅ 空き時間スロット表示
- ✅ 予約確定フロー

### 決済システム
- ✅ Stripe決済画面表示
- ✅ 決済完了後リダイレクト
- ✅ チケット残高反映

## 🚀 次のステップ

テストが完了したら：

1. **本番環境変数設定**
2. **Vercelデプロイ**
3. **カスタムドメイン設定**
4. **Stripe本番キー設定**

---

**問題が発生した場合は、開発者コンソールのエラーメッセージを確認してください。**