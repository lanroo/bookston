-- ============================================
-- VERIFICAR E CORRIGIR USUÁRIOS DO APP
-- ============================================
-- Script para verificar se os usuários do app podem fazer login

-- ============================================
-- 1. VERIFICAR STATUS DOS USUÁRIOS
-- ============================================
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmado,
  u.created_at,
  u.last_sign_in_at,
  u.raw_user_meta_data->>'role' as role,
  CASE WHEN p.user_id IS NOT NULL THEN 'Sim' ELSE 'Não' END as tem_perfil,
  p.name as nome_perfil,
  p.is_premium as premium
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
ORDER BY u.created_at DESC;

-- ============================================
-- 2. CRIAR PERFIS PARA USUÁRIOS SEM PERFIL
-- ============================================
INSERT INTO profiles (user_id, name, username, avatar_url, is_premium)
SELECT 
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ) as name,
  NULL as username,
  NULL as avatar_url,
  COALESCE((u.raw_user_meta_data->>'is_premium')::boolean, false) as is_premium
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 3. GARANTIR QUE EMAILS ESTÃO CONFIRMADOS
-- ============================================
-- Se os emails não estiverem confirmados, isso pode impedir o login
-- Descomente a linha abaixo se precisar confirmar todos os emails:

-- UPDATE auth.users
-- SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
-- WHERE email_confirmed_at IS NULL;

-- ============================================
-- 4. VERIFICAR RLS POLICIES
-- ============================================
-- Verificar se as policies de profiles estão corretas
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================
-- 5. VERIFICAR SE TRIGGER ESTÁ ATIVO
-- ============================================
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND event_object_schema = 'auth'
AND trigger_name = 'on_auth_user_created';

-- ============================================
-- 6. RESULTADO FINAL - VERIFICAR SE TUDO ESTÁ OK
-- ============================================
SELECT 
  'Total de usuários' as metrica,
  COUNT(*)::text as valor
FROM auth.users
UNION ALL
SELECT 
  'Usuários com perfil' as metrica,
  COUNT(*)::text as valor
FROM profiles
UNION ALL
SELECT 
  'Usuários sem perfil' as metrica,
  COUNT(*)::text as valor
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
UNION ALL
SELECT 
  'Emails confirmados' as metrica,
  COUNT(*)::text as valor
FROM auth.users
WHERE email_confirmed_at IS NOT NULL
UNION ALL
SELECT 
  'Último login (últimos 7 dias)' as metrica,
  COUNT(*)::text as valor
FROM auth.users
WHERE last_sign_in_at > NOW() - INTERVAL '7 days';
