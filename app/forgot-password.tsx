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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const { resetPassword } = useAuth();
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  
  const buttonTextColor = colorScheme === 'dark' ? '#000' : '#fff';

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendResetEmail = async () => {
    if (!email.trim() || !isValidEmail(email)) {
      setError('Digite um e-mail válido');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        setError(error.message || 'Erro ao enviar e-mail. Tente novamente.');
        Alert.alert('Erro', error.message || 'Erro ao enviar e-mail. Tente novamente.');
      } else {
        setEmailSent(true);
        Alert.alert(
          'E-mail enviado!',
          'Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.'
        );
      }
    } catch (err: any) {
      setError('Erro inesperado. Tente novamente.');
      Alert.alert('Erro', 'Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/login');
  };

  if (emailSent) {
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
                  <Ionicons name="mail" size={48} color={tintColor} />
                </ThemedView>
                <ThemedText type="title" style={styles.title}>
                  Email enviado!
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  Enviamos um link de recuperação para{'\n'}
                  <ThemedText style={[styles.emailText, { color: tintColor }]}>{email}</ThemedText>
                </ThemedText>
                <ThemedText style={styles.instructionText}>
                  Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                </ThemedText>
              </ThemedView>

              <ThemedView style={styles.form}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: tintColor }]}
                  onPress={handleBackToLogin}
                  activeOpacity={0.8}>
                  <ThemedText style={[styles.buttonText, { color: buttonTextColor }]}>
                    Voltar para o login
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                  disabled={isLoading}>
                  <ThemedText style={[styles.resendText, { color: tintColor }]}>
                    Reenviar email
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

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
                <Ionicons name="lock-closed" size={48} color={tintColor} />
              </ThemedView>
              <ThemedText type="title" style={styles.title}>
                Esqueceu sua senha?
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Digite seu e-mail e enviaremos um link para redefinir sua senha
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
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </ThemedView>
                {email && !isValidEmail(email) && (
                  <ThemedText style={styles.errorText}>Digite um e-mail válido</ThemedText>
                )}
                {error && isValidEmail(email) && (
                  <ThemedText style={styles.errorText}>{error}</ThemedText>
                )}
              </ThemedView>

              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: tintColor },
                  (!email.trim() || !isValidEmail(email) || isLoading) && styles.buttonDisabled,
                ]}
                onPress={handleSendResetEmail}
                disabled={!email.trim() || !isValidEmail(email) || isLoading}
                activeOpacity={0.8}>
                {isLoading ? (
                  <ActivityIndicator color={buttonTextColor} />
                ) : (
                  <ThemedText style={[styles.buttonText, { color: buttonTextColor }]}>
                    Enviar link de recuperação
                  </ThemedText>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backToLoginButton}
                onPress={handleBackToLogin}
                disabled={isLoading}>
                <ThemedText style={[styles.backToLoginText, { color: tintColor }]}>
                  Voltar para o login
                </ThemedText>
              </TouchableOpacity>
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
    paddingHorizontal: 16,
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  emailText: {
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 32,
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
  errorText: {
    fontSize: 12,
    color: '#ff3b30',
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  backToLoginButton: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resendButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

