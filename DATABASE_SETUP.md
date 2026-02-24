# Database Setup Instructions

To initialize your Supabase database, follow these steps:

1.  **Open Supabase Dashboard**: Go to your project at [supabase.com](https://supabase.com).
2.  **SQL Editor**: Navigate to the **SQL Editor** in the left sidebar.
3.  **New Query**: Click "+ New query".
4.  **Copy SQL**: Copy the entire content of [supabase/migrations/001_initial_schema.sql](file:///c:/Users/charl/EdBrio/supabase/migrations/001_initial_schema.sql).
5.  **Run**: Paste the SQL into the editor and click **Run**.

### What this script does:
- Creates all necessary tables (`users`, `teachers`, `bookings`, etc.).
- Sets up **Row Level Security (RLS)** to protect user data.
- Configures a **Trigger** to automatically create a profile when a new user signs up.
- Enables support for performance or calendar-based queries.

### Verification:
After running the script, go to **Table Editor** to verify that the tables have been created.
Try signing up a new account in your application and verify that a record appears in both `auth.users` (Auth section) and `public.users` (Table Editor).
