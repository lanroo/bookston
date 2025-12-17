-- ============================================
-- FIX: Garantir que usuários do app podem fazer login
-- ============================================
-- Execute este script para corrigir problemas de login

-- ============================================
-- 1. CRIAR PERFIS PARA TODOS OS USUÁRIOS
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
ON CONFLICT (user_id) DO UPDATE
SET 
  name = COALESCE(EXCLUDED.name, profiles.name),
  updated_at = NOW();

-- ============================================
-- 2. GARANTIR QUE RLS ESTÁ CORRETO
-- ============================================
-- Remover e recriar policies para garantir que estão corretas

DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

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
-- 3. GARANTIR QUE TRIGGER ESTÁ ATIVO
-- ============================================
-- Recriar função de sync
CREATE OR REPLACE FUNCTION sync_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, name, username, avatar_url, is_premium)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NULL,
    NULL,
    COALESCE((NEW.raw_user_meta_data->>'is_premium')::boolean, false)
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    name = COALESCE(EXCLUDED.name, profiles.name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_profile();

-- ============================================
-- 4. CONFIRMAR EMAILS (OPCIONAL - DESCOMENTE SE PRECISAR)
-- ============================================
-- Se os usuários não conseguem fazer login porque o email não está confirmado,
-- descomente a linha abaixo:

-- UPDATE auth.users
-- SET email_confirmed_at = NOW()
-- WHERE email_confirmed_at IS NULL
-- AND created_at < NOW() - INTERVAL '1 hour';

-- ============================================
-- 5. VERIFICAR RESULTADO
-- ============================================
-- Verificar se todos os usuários agora têm perfil
SELECT 
  u.email,
  CASE WHEN p.user_id IS NOT NULL THEN '✅ Tem perfil' ELSE '❌ Sem perfil' END as status_perfil,
  CASE WHEN u.email_confirmed_at IS NOT NULL THEN '✅ Email confirmado' ELSE '⚠️ Email não confirmado' END as status_email
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
ORDER BY u.email;
