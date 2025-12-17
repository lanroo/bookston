import { createClient } from '@supabase/supabase-js'

// Aceita tanto VITE_ quanto EXPO_PUBLIC_ (para compatibilidade)
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.EXPO_PUBLIC_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY

// Para operações admin, você pode usar service_role_key (apenas no backend)
// Por enquanto, vamos usar anon key e criar RPC functions no Supabase

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
      'Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Nota: Para operações admin (listUsers, getUserById), você precisa:
// 1. Criar Edge Functions no Supabase que usam service_role_key
// 2. Ou usar service_role_key apenas no backend (nunca no frontend!)
