# 🚀 EdBrio Quick Setup Guide

## Step 1: Database Setup (Required First!)

1. Go to [Supabase Studio](https://supabase.com/dashboard)
2. Open your project: `hkyorpuygokhkezifxjl`
3. Go to **SQL Editor**
4. Copy and paste the entire content from `tests/database-setup.sql`
5. Click **Run** to execute all commands

## Step 2: Create Test Accounts

### Teacher Account
1. Open browser: http://localhost:3001/login
2. Click **Sign Up**
3. Fill in:
   ```
   Email: teacher@test.com
   Password: test123456
   Name: テスト講師
   Role: teacher (IMPORTANT!)
   ```
4. Check email and confirm account

### Guardian Account  
1. Open **new incognito/private browser window**
2. Go to: http://localhost:3001/login
3. Click **Sign Up**
4. Fill in:
   ```
   Email: guardian@test.com
   Password: test123456
   Name: テスト保護者
   Role: guardian (IMPORTANT!)
   ```
5. Check email and confirm account

## Step 3: Test the System

### Test Teacher Features
- Login as teacher@test.com
- Visit: http://localhost:3001/teacher/dashboard
- Check profile: http://localhost:3001/teacher/profile
- Manage calendar: http://localhost:3001/teacher/calendar
- Create tickets: http://localhost:3001/teacher/tickets

### Test Guardian Features
- Login as guardian@test.com (in private browser)
- Visit: http://localhost:3001/guardian/home
- Try booking: http://localhost:3001/guardian/booking
- Browse tickets: http://localhost:3001/guardian/tickets

### Test Public Profile
- Visit: http://localhost:3001/teacher/test-teacher

## Step 4: Test Payments (Optional)

Use Stripe test card:
```
Card: 4242 4242 4242 4242
Expiry: 12/34
CVC: 123
Zip: Any
```

## 🔧 Troubleshooting

### "Error fetching user" or login issues
1. Verify database setup completed successfully
2. Check Supabase Authentication settings
3. Ensure RLS policies are active

### "No data" or empty dashboards
1. Confirm user accounts were created properly
2. Check if email verification is complete
3. Verify test data was inserted

### Payment errors
1. Check Stripe keys in .env
2. Ensure webhook URL is configured
3. Test with Stripe test cards only

## ✅ Expected Results

After setup, you should see:

**Teacher Dashboard:**
- Today's schedule: 3件
- Recent bookings list
- Quick action buttons working

**Guardian Home:**
- Next lesson information
- Ticket balance display
- Report notifications

**Public Profile:**
- Teacher photo and info
- Subject/grade tags
- Available time slots
- Booking button active

---

**Need help?** Check the development console (F12) for error messages.
