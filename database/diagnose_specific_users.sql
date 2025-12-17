-- ============================================
-- DIAGNÓSTICO DETALHADO DOS USUÁRIOS
-- ============================================

-- Ver detalhes completos de cada usuário
SELECT 
  u.id,
  u.email,
  CASE 
    WHEN u.email_confirmed_at IS NULL THEN '❌ NÃO CONFIRMADO'
    ELSE '✅ Confirmado'
  END as status_email,
  u.created_at as criado_em,
  u.last_sign_in_at as ultimo_login,
  CASE 
    WHEN u.last_sign_in_at IS NULL THEN '❌ NUNCA LOGOU'
    WHEN u.last_sign_in_at > NOW() - INTERVAL '7 days' THEN '✅ Login recente'
    ELSE '⚠️ Login antigo'
  END as status_login,
  u.raw_user_meta_data->>'role' as role_metadata,
  CASE 
    WHEN p.user_id IS NOT NULL THEN '✅ Tem perfil'
    ELSE '❌ SEM PERFIL'
  END as status_perfil,
  p.name as nome_perfil,
  p.is_premium as premium
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
ORDER BY u.created_at DESC;

-- Verificar se há problemas específicos
SELECT 
  'Usuários que podem ter problema de login:' as diagnostico,
  COUNT(*)::text as quantidade
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE 
  u.email_confirmed_at IS NULL  -- Email não confirmado
  OR p.user_id IS NULL          -- Sem perfil
  OR (u.last_sign_in_at IS NULL AND u.created_at < NOW() - INTERVAL '1 day');  -- Nunca logou mas foi criado há mais de 1 dia
