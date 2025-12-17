-- ============================================
-- RPC FUNCTIONS PARA ADMIN PANEL
-- ============================================
-- Funções que podem ser chamadas do admin panel
-- usando apenas a anon key (com verificação de role)

-- ============================================
-- 1. FUNCTION: Get User Email (para admin)
-- ============================================
CREATE OR REPLACE FUNCTION get_user_email(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role')::text = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;

  -- Buscar email do usuário
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_uuid;

  RETURN user_email;
END;
$$;

-- ============================================
-- 2. FUNCTION: Get User Metadata (para admin)
-- ============================================
CREATE OR REPLACE FUNCTION get_user_metadata(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_metadata JSONB;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role')::text = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;

  -- Buscar metadata do usuário
  SELECT raw_user_meta_data INTO user_metadata
  FROM auth.users
  WHERE id = user_uuid;

  RETURN user_metadata;
END;
$$;

-- ============================================
-- 3. FUNCTION: List All Users (para admin)
-- ============================================
CREATE OR REPLACE FUNCTION list_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role')::text = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;

  -- Retornar todos os usuários
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data,
    au.created_at
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$;

-- ============================================
-- 4. FUNCTION: Update User Premium Status
-- ============================================
CREATE OR REPLACE FUNCTION update_user_premium(
  user_uuid UUID,
  is_premium_status BOOLEAN,
  premium_until_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role')::text = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores.';
  END IF;

  -- Atualizar na tabela profiles
  UPDATE profiles
  SET is_premium = is_premium_status,
      updated_at = NOW()
  WHERE user_id = user_uuid;

  -- Atualizar metadata do auth.users
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
    'is_premium', is_premium_status,
    'premium_since', CASE 
      WHEN is_premium_status = true AND (raw_user_meta_data->>'premium_since') IS NULL 
      THEN NOW()::text
      ELSE raw_user_meta_data->>'premium_since'
    END,
    'premium_until', CASE 
      WHEN premium_until_date IS NOT NULL THEN premium_until_date::text
      WHEN is_premium_status = false THEN NULL
      ELSE raw_user_meta_data->>'premium_until'
    END
  )
  WHERE id = user_uuid;
END;
$$;
