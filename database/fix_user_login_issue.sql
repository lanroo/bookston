-- ============================================
-- FIX: Problemas de Login de Usuários Normais
-- ============================================
-- Este script verifica e corrige problemas que podem
-- estar impedindo usuários normais de fazer login no app

-- ============================================
-- 1. VERIFICAR USUÁRIOS SEM PERFIL
-- ============================================
-- Se houver usuários sem perfil, criar automaticamente

INSERT INTO profiles (user_id, name, username, avatar_url)
SELECT 
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ) as name,
  NULL as username,
  NULL as avatar_url
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 2. GARANTIR QUE RLS ESTÁ CORRETO PARA PROFILES
-- ============================================
-- Verificar se as policies estão corretas

-- Remover policies antigas se existirem (para recriar)
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Recriar policies corretas
CREATE POLICY "Users can view all profiles" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================
-- 3. GARANTIR QUE TRIGGER DE SYNC ESTÁ ATIVO
-- ============================================
-- Verificar se o trigger que cria perfil automaticamente está funcionando

-- Recriar função de sync se não existir
CREATE OR REPLACE FUNCTION sync_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, name, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NULL,
    NULL
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    name = COALESCE(EXCLUDED.name, profiles.name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger se não existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_profile();

-- ============================================
-- 4. VERIFICAR SE HÁ PROBLEMAS COM METADATA
-- ============================================
-- Garantir que usuários normais não têm metadata quebrado

-- Limpar metadata problemático (se houver)
-- Isso não afeta admins, apenas limpa dados inválidos
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'broken_field'
WHERE raw_user_meta_data ? 'broken_field';

-- ============================================
-- 5. GARANTIR QUE EMAILS ESTÃO CONFIRMADOS
-- ============================================
-- Se necessário, confirmar emails de usuários existentes
-- (Descomente se precisar confirmar todos os emails)

-- UPDATE auth.users
-- SET email_confirmed_at = NOW()
-- WHERE email_confirmed_at IS NULL
-- AND created_at < NOW() - INTERVAL '1 day';

-- ============================================
-- 6. VERIFICAR STATUS FINAL
-- ============================================
-- Query para verificar se tudo está OK

SELECT 
  'Total de usuários' as metric,
  COUNT(*)::text as value
FROM auth.users
UNION ALL
SELECT 
  'Usuários com perfil' as metric,
  COUNT(*)::text as value
FROM profiles
UNION ALL
SELECT 
  'Usuários sem perfil' as metric,
  COUNT(*)::text as value
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
UNION ALL
SELECT 
  'Emails confirmados' as metric,
  COUNT(*)::text as value
FROM auth.users
WHERE email_confirmed_at IS NOT NULL;
