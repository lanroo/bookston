-- ============================================
-- Add Profile Sync Trigger
-- Execute este script DEPOIS de verificar que o login está funcionando
-- ============================================

-- Drop trigger se já existir
DROP TRIGGER IF EXISTS sync_user_profile_trigger ON auth.users;

-- Criar trigger para sincronizar perfil automaticamente
-- ATENÇÃO: Execute apenas se o login estiver funcionando normal
CREATE TRIGGER sync_user_profile_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_profile();

-- Verificar se o trigger foi criado
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'sync_user_profile_trigger';

