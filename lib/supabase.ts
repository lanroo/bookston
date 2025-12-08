import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('YOUR_') && 
  !supabaseAnonKey.includes('YOUR_') &&
  supabaseUrl.startsWith('http');

if (!isConfigured) {
  const errorMessage = `
╔══════════════════════════════════════════════════════════════╗
║  ⚠️  SUPABASE NÃO CONFIGURADO                                ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Para usar a autenticação, você precisa configurar:         ║
║                                                              ║
║  1. Crie um arquivo .env na raiz do projeto                 ║
║  2. Adicione suas credenciais do Supabase:                  ║
║                                                              ║
║     EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co║
║     EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-aqui            ║
║                                                              ║
║  3. Reinicie o servidor (npm start)                         ║
║                                                              ║
║  Veja SUPABASE_SETUP.md para instruções detalhadas          ║
╚══════════════════════════════════════════════════════════════╝
  `;
  console.error(errorMessage);
  throw new Error('Supabase não está configurado. Configure as variáveis de ambiente EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env');
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não encontradas. Verifique o arquivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

