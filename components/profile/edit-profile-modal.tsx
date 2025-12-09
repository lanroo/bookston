import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ProfileService } from '@/services/profile.service';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface EditProfileModalProps {
  visible: boolean;
  currentName: string;
  currentUsername?: string;
  onClose: () => void;
  onSave: (name: string, username: string) => void;
}

export function EditProfileModal({
  visible,
  currentName,
  currentUsername,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const [name, setName] = useState(currentName);
  const [username, setUsername] = useState(currentUsername || '');
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(currentName);
      setUsername(currentUsername || '');
      setUsernameError(null);
    }
  }, [visible, currentName, currentUsername]);

  const handleSave = async () => {
    // Validate name
    if (!name.trim()) {
      Alert.alert('Erro', 'O nome é obrigatório.');
      return;
    }

    // Validate username if provided
    if (username.trim()) {
      const validation = ProfileService.validateUsername(username.trim());
      if (!validation.valid) {
        setUsernameError(validation.error || 'Username inválido');
        return;
      }

      // Check availability
      const isAvailable = await ProfileService.isUsernameAvailable(username.trim());
      if (!isAvailable) {
        setUsernameError('Este username não está disponível');
        return;
      }
    }

    setLoading(true);
    try {
      await ProfileService.updateProfile({
        name: name.trim(),
        username: username.trim() || undefined,
      });
      onSave(name.trim(), username.trim());
      onClose();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível atualizar o perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = (text: string) => {
    // Remove @ if user types it
    const cleanText = text.replace('@', '');
    setUsername(cleanText);
    setUsernameError(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          <ThemedView style={[styles.modal, { backgroundColor }]}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
              <ThemedText type="title" style={styles.headerTitle}>
                Editar Perfil
              </ThemedText>
              <TouchableOpacity
                onPress={handleSave}
                disabled={loading}
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
                {loading ? (
                  <ActivityIndicator size="small" color={tintColor} />
                ) : (
                  <ThemedText style={[styles.saveButtonText, { color: tintColor }]}>
                    Salvar
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <View style={styles.fieldContainer}>
                <ThemedText style={[styles.label, { color: textColor }]}>Nome</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                      color: textColor,
                      borderColor,
                    },
                  ]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Seu nome"
                  placeholderTextColor={textColor + '60'}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.fieldContainer}>
                <ThemedText style={[styles.label, { color: textColor }]}>Username</ThemedText>
                <View style={styles.usernameContainer}>
                  <ThemedText style={[styles.atSymbol, { color: textColor, opacity: 0.5 }]}>
                    @
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      styles.usernameInput,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                        color: textColor,
                        borderColor: usernameError ? '#ff3b30' : borderColor,
                      },
                    ]}
                    value={username}
                    onChangeText={handleUsernameChange}
                    placeholder="seuusername"
                    placeholderTextColor={textColor + '60'}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {usernameError && (
                  <ThemedText style={styles.errorText}>{usernameError}</ThemedText>
                )}
                <ThemedText style={[styles.hint, { color: textColor, opacity: 0.5 }]}>
                  Pode conter letras, números e underscore. Mínimo 3 caracteres.
                </ThemedText>
              </View>
            </View>
          </ThemedView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 20,
    gap: 24,
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  atSymbol: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
    paddingTop: 2,
  },
  usernameInput: {
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    color: '#ff3b30',
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
});

