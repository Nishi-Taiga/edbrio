-- Add notification_preferences JSONB column to users table
-- Default '{}' means all notifications are ON (opt-out model)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}' NOT NULL;

-- Allow users to update only their own notification_preferences
CREATE POLICY "users_update_own_notification_preferences"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
