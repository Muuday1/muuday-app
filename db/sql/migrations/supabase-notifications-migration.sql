-- Add notification_preferences to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "booking_confirmation": true,
  "session_reminder_24h": true,
  "session_reminder_1h": true,
  "payment_confirmation": true,
  "payment_failed": true,
  "booking_cancelled": true,
  "new_booking_received": true,
  "new_review": true,
  "news_promotions": true
}'::jsonb;
