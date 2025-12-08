import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
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
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import { Alert } from 'react-native';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { signUp } = useAuth();
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  
  const signupButtonTextColor = colorScheme === 'dark' ? '#000' : '#fff';

  const isFormValid = () => {
    return (
      name.trim() &&
      email.trim() &&
      password.trim() &&
      confirmPassword.trim() &&
      password === confirmPassword &&
      password.length >= 6
    );
  };

  const handleSignUp = async () => {
    if (!isFormValid()) {
      setError('Por favor, preencha todos os campos corretamente');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, name);
      
      if (error) {
        setError(error.message || 'Erro ao criar conta. Tente novamente.');
        Alert.alert('Erro', error.message || 'Erro ao criar conta. Tente novamente.');
      } else {
        Alert.alert(
          'Conta criada!',
          'Sua conta foi criada com sucesso! Verifique seu e-mail para confirmar.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/login'),
            },
          ]
        );
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
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                disabled={isLoading}>
                <Ionicons name="arrow-back" size={24} color={textColor} />
              </TouchableOpacity>
              <ThemedView style={[styles.logoContainer, { backgroundColor: tintColor + '20' }]}>
                <Ionicons name="person-add" size={48} color={tintColor} />
              </ThemedView>
              <ThemedText type="title" style={styles.title}>
                Criar conta
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Preencha os dados para se cadastrar
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.form}>
              <ThemedView style={styles.inputContainer}>
                <ThemedText style={styles.label}>Nome completo</ThemedText>
                <ThemedView style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={textColor}
                    style={styles.inputIcon}
                  />
                  <ThemedTextInput
                    style={styles.input}
                    placeholder="Seu nome completo"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </ThemedView>
              </ThemedView>

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
                    onChangeText={setEmail}
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
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChangeText={setPassword}
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
              </ThemedView>

              <ThemedView style={styles.inputContainer}>
                <ThemedText style={styles.label}>Confirmar senha</ThemedText>
                <ThemedView style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={textColor}
                    style={styles.inputIcon}
                  />
                  <ThemedTextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                    disabled={isLoading}>
                    <Ionicons
                      name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={textColor}
                    />
                  </TouchableOpacity>
                </ThemedView>
                {confirmPassword && password !== confirmPassword && (
                  <ThemedText style={styles.errorText}>As senhas não coincidem</ThemedText>
                )}
                {password && password.length < 6 && (
                  <ThemedText style={styles.errorText}>A senha deve ter no mínimo 6 caracteres</ThemedText>
                )}
                {error && !confirmPassword && password === confirmPassword && (
                  <ThemedText style={styles.errorText}>{error}</ThemedText>
                )}
              </ThemedView>

              <TouchableOpacity
                style={[
                  styles.signupButton,
                  { backgroundColor: tintColor },
                  (!isFormValid() || isLoading) && styles.signupButtonDisabled,
                ]}
                onPress={handleSignUp}
                disabled={!isFormValid() || isLoading}
                activeOpacity={0.8}>
                {isLoading ? (
                  <ActivityIndicator color={signupButtonTextColor} />
                ) : (
                  <ThemedText style={[styles.signupButtonText, { color: signupButtonTextColor }]}>
                    Cadastrar
                  </ThemedText>
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

              <ThemedView style={styles.loginContainer}>
                <ThemedText style={styles.loginText}>Já tem uma conta? </ThemedText>
                <TouchableOpacity disabled={isLoading} onPress={() => router.push('/login')}>
                  <ThemedText style={[styles.loginLink, { color: tintColor }]}>
                    Entrar
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
    marginBottom: 32,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
    zIndex: 1,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
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
  errorText: {
    fontSize: 12,
    color: '#ff3b30',
    marginTop: 4,
    marginLeft: 4,
  },
  signupButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
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
  signupButtonDisabled: {
    opacity: 0.5,
  },
  signupButtonText: {
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});

