-- ============================================
-- Sync Existing Users to Profiles Table
-- This script populates the profiles table with existing auth.users
-- ============================================

-- Insert all existing users into profiles table
INSERT INTO profiles (user_id, name, username, avatar_url)
SELECT 
  id as user_id,
  COALESCE(
    raw_user_meta_data->>'name', 
    split_part(email, '@', 1), 
    'Usuário'
  ) as name,
  raw_user_meta_data->>'username' as username,
  raw_user_meta_data->>'avatar_url' as avatar_url
FROM auth.users
ON CONFLICT (user_id) DO UPDATE SET
  name = COALESCE(EXCLUDED.name, profiles.name),
  username = COALESCE(EXCLUDED.username, profiles.username),
  avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
  updated_at = TIMEZONE('utc'::text, NOW());

