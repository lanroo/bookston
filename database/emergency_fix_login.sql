-- ============================================
-- CORREÇÃO DE EMERGÊNCIA - Problemas de Login
-- Execute este script se não conseguir fazer login
-- ============================================

-- 1. Remover qualquer trigger que possa estar causando problemas
DROP TRIGGER IF EXISTS sync_user_profile_trigger ON auth.users;

-- 2. Verificar se o trigger foi removido
SELECT 
  trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND event_object_schema = 'auth'
AND trigger_name = 'sync_user_profile_trigger';

-- Se retornar vazio, o trigger foi removido com sucesso

-- 3. Verificar se ainda há outros triggers ativos
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND event_object_schema = 'auth';

-- 4. Testar se a função sync_user_profile está causando problemas
-- Se necessário, você pode comentar a função temporariamente:
-- DROP FUNCTION IF EXISTS sync_user_profile() CASCADE;

-- ============================================
-- APÓS EXECUTAR ESTE SCRIPT:
-- ============================================
-- 1. Feche completamente o app (force quit)
-- 2. Reabra o app
-- 3. Tente fazer login novamente
-- 4. Se funcionar, continue com sync_existing_users.sql

