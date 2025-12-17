-- ============================================
-- MIGRATION: Tabela de Administradores
-- ============================================
-- Tabela dedicada para gestão de administradores
-- Criada especificamente para o painel administrativo

-- ============================================
-- 1. CRIAR TABELA admins
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id), -- Quem criou este admin
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  notes TEXT, -- Notas sobre o admin
  permissions JSONB DEFAULT '{}'::jsonb, -- Permissões específicas (futuro)
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS admins_user_id_idx ON admins(user_id);
CREATE INDEX IF NOT EXISTS admins_email_idx ON admins(email);
CREATE INDEX IF NOT EXISTS admins_is_active_idx ON admins(is_active);
CREATE INDEX IF NOT EXISTS admins_created_at_idx ON admins(created_at);

-- ============================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver a tabela de admins
CREATE POLICY "Admins can view all admins" 
  ON admins FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- Apenas admins podem inserir novos admins
CREATE POLICY "Admins can insert admins" 
  ON admins FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- Apenas admins podem atualizar admins
CREATE POLICY "Admins can update admins" 
  ON admins FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- Apenas admins podem deletar admins
CREATE POLICY "Admins can delete admins" 
  ON admins FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- ============================================
-- 3. FUNCTION: Criar Admin
-- ============================================
CREATE OR REPLACE FUNCTION create_admin(
  admin_user_id UUID,
  admin_email TEXT,
  admin_name TEXT,
  admin_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_id UUID;
  current_admin_id UUID;
BEGIN
  -- Verificar se o usuário atual é admin
  SELECT id INTO current_admin_id
  FROM auth.users
  WHERE id = auth.uid()
  AND (raw_user_meta_data->>'role')::text = 'admin';

  IF current_admin_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem criar admins.';
  END IF;

  -- Verificar se o usuário existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = admin_user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado.';
  END IF;

  -- Verificar se já é admin
  IF EXISTS (SELECT 1 FROM admins WHERE user_id = admin_user_id) THEN
    RAISE EXCEPTION 'Usuário já é administrador.';
  END IF;

  -- Criar registro na tabela admins
  INSERT INTO admins (user_id, email, name, created_by, notes)
  VALUES (admin_user_id, admin_email, admin_name, current_admin_id, admin_notes)
  RETURNING id INTO admin_id;

  -- Atualizar metadata do auth.users para adicionar role admin
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
  WHERE id = admin_user_id;

  RETURN admin_id;
END;
$$;

-- ============================================
-- 4. FUNCTION: Remover Admin
-- ============================================
CREATE OR REPLACE FUNCTION remove_admin(admin_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_admin_id UUID;
BEGIN
  -- Verificar se o usuário atual é admin
  SELECT id INTO current_admin_id
  FROM auth.users
  WHERE id = auth.uid()
  AND (raw_user_meta_data->>'role')::text = 'admin';

  IF current_admin_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem remover admins.';
  END IF;

  -- Não permitir remover a si mesmo
  IF admin_user_id = current_admin_id THEN
    RAISE EXCEPTION 'Você não pode remover seu próprio acesso de admin.';
  END IF;

  -- Remover da tabela admins
  DELETE FROM admins WHERE user_id = admin_user_id;

  -- Remover role admin do metadata
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data - 'role'
  WHERE id = admin_user_id;
END;
$$;

-- ============================================
-- 5. FUNCTION: Listar Todos os Admins
-- ============================================
CREATE OR REPLACE FUNCTION list_all_admins()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  name TEXT,
  created_by UUID,
  created_by_name TEXT,
  is_active BOOLEAN,
  last_login_at TIMESTAMPTZ,
  notes TEXT,
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

  -- Retornar todos os admins
  RETURN QUERY
  SELECT 
    a.id,
    a.user_id,
    a.email,
    a.name,
    a.created_by,
    creator.name as created_by_name,
    a.is_active,
    a.last_login_at,
    a.notes,
    a.created_at
  FROM admins a
  LEFT JOIN admins creator ON creator.user_id = a.created_by
  ORDER BY a.created_at DESC;
END;
$$;

-- ============================================
-- 6. FUNCTION: Atualizar Status do Admin
-- ============================================
CREATE OR REPLACE FUNCTION update_admin_status(
  admin_user_id UUID,
  is_active_status BOOLEAN
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

  -- Atualizar status
  UPDATE admins
  SET is_active = is_active_status,
      updated_at = NOW()
  WHERE user_id = admin_user_id;
END;
$$;

-- ============================================
-- 7. FUNCTION: Atualizar Last Login
-- ============================================
CREATE OR REPLACE FUNCTION update_admin_last_login(admin_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admins
  SET last_login_at = NOW(),
      updated_at = NOW()
  WHERE user_id = admin_user_id;
END;
$$;

-- ============================================
-- 8. TRIGGER: Atualizar updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. COMENTÁRIOS
-- ============================================
COMMENT ON TABLE admins IS 'Tabela dedicada para gestão de administradores do painel';
COMMENT ON COLUMN admins.created_by IS 'ID do admin que criou este registro';
COMMENT ON COLUMN admins.is_active IS 'Se o admin está ativo (pode fazer login)';
COMMENT ON COLUMN admins.permissions IS 'Permissões específicas do admin (JSON)';
