import { supabase } from '@/lib/supabase';
import { Session, AuthError as SupabaseAuthError, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: SupabaseAuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: SupabaseAuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: SupabaseAuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as SupabaseAuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 [AUTH] Iniciando login...');
    console.log('📧 [AUTH] Email:', email);
    console.log('🔑 [AUTH] Senha fornecida:', password ? '***' : 'VAZIA');
    
    try {
      console.log('⏳ [AUTH] Chamando supabase.auth.signInWithPassword...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('📦 [AUTH] Resposta recebida:');
      console.log('   - Data:', data ? 'Presente' : 'Nula');
      console.log('   - Error:', error ? JSON.stringify(error, null, 2) : 'Nenhum erro');

      if (error) {
        console.error('❌ [AUTH] Erro no login:');
        console.error('   - Código:', error.status || 'N/A');
        console.error('   - Mensagem:', error.message);
        console.error('   - Nome:', error.name);
        console.error('   - Erro completo:', JSON.stringify(error, null, 2));
        return { error };
      }

      if (data?.user) {
        console.log('✅ [AUTH] Login bem-sucedido!');
        console.log('   - User ID:', data.user.id);
        console.log('   - Email:', data.user.email);
        console.log('   - Email confirmado:', data.user.email_confirmed_at ? 'Sim' : 'Não');
        console.log('   - Metadata:', JSON.stringify(data.user.user_metadata, null, 2));
      } else {
        console.warn('⚠️ [AUTH] Login retornou sem erro, mas sem user também');
      }

      return { error: null };
    } catch (error: any) {
      console.error('💥 [AUTH] Exceção capturada no login:');
      console.error('   - Tipo:', error?.constructor?.name || 'Desconhecido');
      console.error('   - Mensagem:', error?.message || 'Sem mensagem');
      console.error('   - Stack:', error?.stack || 'Sem stack');
      console.error('   - Erro completo:', JSON.stringify(error, null, 2));
      return { error: error as SupabaseAuthError };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'myapp://reset-password',
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as SupabaseAuthError };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

