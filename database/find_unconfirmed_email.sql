-- ============================================
-- ENCONTRAR EMAIL NÃO CONFIRMADO
-- ============================================

-- Mostrar qual usuário não tem email confirmado
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ EMAIL NÃO CONFIRMADO'
    ELSE '✅ Email confirmado'
  END as status
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- Se não aparecer nenhum resultado acima, significa que todos os emails já estão confirmados
-- Nesse caso, veja todos os usuários:
SELECT 
  id,
  email,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ NÃO CONFIRMADO'
    ELSE '✅ Confirmado em ' || email_confirmed_at::text
  END as status_email,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;
