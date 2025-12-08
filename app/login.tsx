import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Alert } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useAuth();
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  
  const loginButtonTextColor = colorScheme === 'dark' ? '#000' : '#fff';

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
        Alert.alert('Erro', error.message || 'Erro ao fazer login. Verifique suas credenciais.');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError('Erro inesperado. Tente novamente.');
      Alert.alert('Erro', 'Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <ThemedView style={styles.content}>
            <ThemedView style={styles.header}>
              <ThemedView style={[styles.logoContainer, { backgroundColor: tintColor + '20' }]}>
                <Ionicons name="lock-closed" size={48} color={tintColor} />
              </ThemedView>
              <ThemedText type="title" style={styles.title}>
                Bem-vindo de volta
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Entre com suas credenciais para continuar
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.form}>
              <ThemedView style={styles.inputContainer}>
                <ThemedText style={styles.label}>E-mail</ThemedText>
                <ThemedView style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={textColor}
                    style={styles.inputIcon}
                  />
                  <ThemedTextInput
                    style={styles.input}
                    placeholder="seu@email.com"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </ThemedView>
              </ThemedView>

              <ThemedView style={styles.inputContainer}>
                <ThemedText style={styles.label}>Senha</ThemedText>
                <ThemedView style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={textColor}
                    style={styles.inputIcon}
                  />
                  <ThemedTextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="••••••••"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError('');
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    disabled={isLoading}>
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={textColor}
                    />
                  </TouchableOpacity>
                </ThemedView>
                {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
              </ThemedView>

              <TouchableOpacity
                style={styles.forgotPassword}
                disabled={isLoading}
                onPress={() => router.push('/forgot-password')}>
                <ThemedText style={[styles.forgotPasswordText, { color: tintColor }]}>
                  Esqueceu sua senha?
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  { backgroundColor: tintColor },
                  (!email || !password || isLoading) && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={!email || !password || isLoading}
                activeOpacity={0.8}>
                {isLoading ? (
                  <ActivityIndicator color={loginButtonTextColor} />
                ) : (
                  <ThemedText style={[styles.loginButtonText, { color: loginButtonTextColor }]}>Entrar</ThemedText>
                )}
              </TouchableOpacity>

              <ThemedView style={styles.dividerContainer}>
                <ThemedView style={[styles.divider, { backgroundColor: textColor + '20' }]} />
                <ThemedText style={styles.dividerText}>ou</ThemedText>
                <ThemedView style={[styles.divider, { backgroundColor: textColor + '20' }]} />
              </ThemedView>

              <ThemedView style={styles.socialContainer}>
                <TouchableOpacity
                  style={[styles.socialButton, { borderColor: textColor + '30' }]}
                  disabled={isLoading}>
                  <Ionicons name="logo-google" size={24} color={textColor} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.socialButton, { borderColor: textColor + '30' }]}
                  disabled={isLoading}>
                  <Ionicons name="logo-apple" size={24} color={textColor} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.socialButton, { borderColor: textColor + '30' }]}
                  disabled={isLoading}>
                  <Ionicons name="logo-facebook" size={24} color={textColor} />
                </TouchableOpacity>
              </ThemedView>

              <ThemedView style={styles.signUpContainer}>
                <ThemedText style={styles.signUpText}>Não tem uma conta? </ThemedText>
                <TouchableOpacity disabled={isLoading} onPress={() => router.push('/signup')}>
                  <ThemedText style={[styles.signUpLink, { color: tintColor }]}>
                    Cadastre-se
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    paddingLeft: 48,
    flex: 1,
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    opacity: 0.5,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 12,
    color: '#ff3b30',
    marginTop: 4,
    marginLeft: 4,
  },
});

