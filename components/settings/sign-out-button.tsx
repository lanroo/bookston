import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';

interface SignOutButtonProps {
  style?: object;
}

export function SignOutButton({ style }: SignOutButtonProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor, borderColor: '#ff3b30' + '30' }, style]}
      onPress={handleSignOut}>
      <Ionicons name="log-out-outline" size={20} color="#ff3b30" />
      <ThemedText style={[styles.text, { color: '#ff3b30' }]}>Sair da Conta</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

