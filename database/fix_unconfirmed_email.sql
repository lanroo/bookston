-- ============================================
-- FIX: Confirmar email de usuário não confirmado
-- ============================================

-- 1. Ver qual usuário não tem email confirmado
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- 2. Confirmar email do usuário que não está confirmado
-- (Isso permite que o usuário faça login)
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 3. Verificar resultado
SELECT 
  'Emails confirmados agora' as status,
  COUNT(*)::text as total
FROM auth.users
WHERE email_confirmed_at IS NOT NULL;
