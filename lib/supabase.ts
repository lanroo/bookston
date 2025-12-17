import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 [SUPABASE] Inicializando cliente Supabase...');
console.log('   - URL presente:', !!supabaseUrl);
console.log('   - URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NÃO ENCONTRADA');
console.log('   - Anon Key presente:', !!supabaseAnonKey);
console.log('   - Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NÃO ENCONTRADA');

const isConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('YOUR_') && 
  !supabaseAnonKey.includes('YOUR_') &&
  supabaseUrl.startsWith('http');

if (!isConfigured) {
  console.error('❌ [SUPABASE] Configuração inválida!');
  throw new Error('Supabase não está configurado. Configure as variáveis de ambiente EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ [SUPABASE] Variáveis de ambiente não encontradas!');
  throw new Error('Variáveis de ambiente do Supabase não encontradas. Verifique o arquivo .env');
}

console.log('✅ [SUPABASE] Cliente Supabase configurado com sucesso');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
