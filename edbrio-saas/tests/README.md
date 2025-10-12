# テスト用データ・アカウント

## テスト用アカウント情報

### 講師アカウント
```
メール: teacher@test.com
パスワード: test123456
名前: 田中一郎
役割: teacher
ハンドル: tanaka-test
```

### 保護者アカウント
```
メール: guardian@test.com
パスワード: test123456
名前: 山田花子
役割: guardian
```

## テスト用モックデータ

### 講師プロフィール
- **名前:** 田中一郎
- **ハンドル:** tanaka-test
- **科目:** 数学, 物理
- **学年:** 高1, 高2, 高3
- **経験:** 5年
- **評価:** 4.8 (24件のレビュー)

### 用意されているチケット
1. **数学 単発授業**
   - 60分 × 1回
   - ¥5,000
   - 有効期限: 30日

2. **数学 5回パック**
   - 60分 × 5回
   - ¥22,500 (10% OFF)
   - 有効期限: 90日

3. **物理 単発授業**
   - 60分 × 1回
   - ¥5,200
   - 有効期限: 30日

### テストシナリオ

#### 1. 講師アカウントテスト
1. `/login` でサインアップ・ログイン
2. `/teacher/dashboard` でダッシュボード確認
3. `/teacher/profile` でプロフィール編集
4. `/teacher/calendar` でシフト登録
5. `/teacher/tickets` でチケット作成
6. `/teacher/reports` でレポート作成

#### 2. 保護者アカウントテスト
1. 別ブラウザで `/login` でサインアップ・ログイン
2. `/guardian/home` でホーム画面確認
3. `/guardian/booking` で授業予約
4. `/guardian/tickets` でチケット購入
5. レポート閲覧

#### 3. 公開ページテスト
- `/teacher/tanaka-test` で公開プロフィール表示

## トラブルシューティング

### よくあるエラー

#### 認証エラー
- Supabaseプロジェクトが正しく設定されているか確認
- メール認証が完了しているか確認

#### データベースエラー
- Supabase Studioでマイグレーションが実行されているか確認
- RLSポリシーが正しく適用されているか確認

#### 決済エラー
- Stripeのテストキーが正しく設定されているか確認
- Webhook URLが正しく設定されているか確認

## 手動テスト用SQLクエリ

### ユーザー確認
```sql
SELECT * FROM auth.users;
SELECT * FROM public.users;
```

### 講師データ確認
```sql
SELECT * FROM public.teachers;
```

### 保護者・生徒データ確認
```sql
SELECT * FROM public.guardians;
SELECT * FROM public.students;
```

### チケット・予約データ確認
```sql
SELECT * FROM public.tickets;
SELECT * FROM public.bookings;
SELECT * FROM public.ticket_balances;
```
