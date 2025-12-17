-- ============================================
-- MIGRATION: Admin Role e Premium System
-- ============================================
-- Este script adiciona suporte para:
-- 1. Role de administrador
-- 2. Sistema de usuários premium
-- 3. Tabela de pagamentos (preparação futura)

-- ============================================
-- 1. ADICIONAR COLUNA is_premium NA TABELA profiles
-- ============================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS profiles_is_premium_idx ON profiles(is_premium);

-- ============================================
-- 2. CRIAR TABELA DE PAGAMENTOS (Preparação futura)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  plan TEXT NOT NULL, -- 'monthly', 'yearly', etc
  payment_method TEXT, -- 'stripe', 'mercadopago', etc
  payment_id TEXT, -- ID do gateway de pagamento
  metadata JSONB, -- Dados adicionais do pagamento
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);
CREATE INDEX IF NOT EXISTS payments_created_at_idx ON payments(created_at);

-- ============================================
-- 3. ROW LEVEL SECURITY PARA PAYMENTS
-- ============================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver todos os pagamentos
-- Usuários podem ver apenas seus próprios pagamentos
CREATE POLICY "Users can view their own payments" 
  ON payments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" 
  ON payments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- ============================================
-- 4. FUNCTION PARA ATUALIZAR PREMIUM QUANDO PAGAMENTO É CONCLUÍDO
-- ============================================
CREATE OR REPLACE FUNCTION update_premium_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um pagamento é marcado como 'completed', atualizar premium
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Atualizar perfil
    UPDATE profiles
    SET is_premium = true,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    -- Atualizar metadata do auth
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
      'is_premium', true,
      'premium_since', COALESCE(
        (raw_user_meta_data->>'premium_since')::timestamp,
        NOW()
      ),
      'premium_until', CASE 
        WHEN NEW.plan = 'monthly' THEN NOW() + INTERVAL '1 month'
        WHEN NEW.plan = 'yearly' THEN NOW() + INTERVAL '1 year'
        ELSE NULL
      END
    )
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar premium automaticamente
DROP TRIGGER IF EXISTS trigger_update_premium_on_payment ON payments;
CREATE TRIGGER trigger_update_premium_on_payment
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_premium_on_payment();

-- ============================================
-- 5. FUNCTION PARA ATUALIZAR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. COMENTÁRIOS
-- ============================================
COMMENT ON TABLE payments IS 'Tabela de pagamentos para sistema premium';
COMMENT ON COLUMN payments.status IS 'Status do pagamento: pending, completed, failed, refunded';
COMMENT ON COLUMN payments.plan IS 'Plano contratado: monthly, yearly, etc';
COMMENT ON COLUMN payments.payment_method IS 'Método de pagamento: stripe, mercadopago, etc';
