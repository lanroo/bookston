-- ============================================
-- Diagnóstico de Problemas com Profiles
-- Execute este script para ver o status atual
-- ============================================

-- 1. Verificar se a tabela profiles existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
) as profiles_table_exists;

-- 2. Verificar quantos usuários existem
SELECT COUNT(*) as total_users FROM auth.users;

-- 3. Verificar quantos perfis existem
SELECT COUNT(*) as total_profiles FROM profiles;

-- 4. Verificar se há triggers ativos na tabela auth.users
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND event_object_schema = 'auth';

-- 5. Ver perfis existentes (primeiros 10)
SELECT 
  user_id,
  name,
  username,
  avatar_url,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- 6. Ver usuários SEM perfil
SELECT 
  u.id as user_id,
  u.email,
  u.raw_user_meta_data->>'name' as metadata_name,
  u.created_at
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
LIMIT 10;

-- 7. Verificar RLS policies na tabela profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';

-- 8. Verificar se a função sync_user_profile existe
SELECT EXISTS (
  SELECT FROM pg_proc 
  WHERE proname = 'sync_user_profile'
) as sync_function_exists;

