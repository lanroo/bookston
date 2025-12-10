import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ProfileService } from '@/services/profile.service';
import { StorageService } from '@/services/storage.service';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
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
  currentAvatarUrl?: string;
  onClose: () => void;
  onSave: (name: string, username: string, avatarUrl?: string | null) => void;
  onAvatarUpdate?: (avatarUrl: string | null) => void;
}

export function EditProfileModal({
  visible,
  currentName,
  currentUsername,
  currentAvatarUrl,
  onClose,
  onSave,
  onAvatarUpdate,
}: EditProfileModalProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const { user } = useAuth();

  const [name, setName] = useState(currentName);
  const [username, setUsername] = useState(currentUsername || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);
  const [tempAvatarUri, setTempAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(currentName);
      setUsername(currentUsername || '');
      setAvatarUrl(currentAvatarUrl || null);
      setTempAvatarUri(null);
      setUsernameError(null);
      setAvatarLoadError(false);
    }
  }, [visible, currentName, currentUsername, currentAvatarUrl]);

  const handleImagePicker = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos.');
        return;
      }

      if (Platform.OS === 'ios') {
        // iOS ActionSheet
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancelar', 'Tirar Foto', 'Escolher da Galeria', 'Remover Foto'],
            cancelButtonIndex: 0,
            destructiveButtonIndex: 3,
          },
          async (buttonIndex) => {
            if (buttonIndex === 1) {
              await pickImage('camera');
            } else if (buttonIndex === 2) {
              await pickImage('library');
            } else if (buttonIndex === 3) {
              setAvatarUrl(null);
              setTempAvatarUri(null);
            }
          }
        );
      } else {
        // Android Alert
        Alert.alert(
          'Foto de Perfil',
          'Escolha uma opção',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Tirar Foto', onPress: () => pickImage('camera') },
            { text: 'Escolher da Galeria', onPress: () => pickImage('library') },
            { text: 'Remover Foto', style: 'destructive', onPress: () => {
              setAvatarUrl(null);
              setTempAvatarUri(null);
            }},
          ]
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir o seletor de imagens.');
    }
  };

  const pickImage = async (source: 'camera' | 'library') => {
    
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: 'images' as any, // Using string instead of deprecated MediaTypeOptions
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      };

      let result: ImagePicker.ImagePickerResult;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão necessária', 'Precisamos de permissão para usar a câmera.');
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setTempAvatarUri(imageUri);
        
        // Upload and update profile automatically
        if (user) {
          setUploadingAvatar(true);
          try {
            const uploadedUrl = await StorageService.uploadAvatar(imageUri, user.id);
            
            await ProfileService.updateProfile({
              avatarUrl: uploadedUrl,
            });
            
            setAvatarUrl(uploadedUrl);
            setTempAvatarUri(null);
            setAvatarLoadError(false);
            
            // Notify parent component
            if (onAvatarUpdate) {
              onAvatarUpdate(uploadedUrl);
            }
          } catch (error: any) {
            const errorMessage = error.message || 'Não foi possível fazer upload da foto. Tente novamente.';
            Alert.alert('Erro', errorMessage);
            setTempAvatarUri(null);
          } finally {
            setUploadingAvatar(false);
          }
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

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
      // Handle avatar removal if user removed it
      let finalAvatarUrl: string | null | undefined = avatarUrl;
      
      if (tempAvatarUri === null && avatarUrl === null && currentAvatarUrl) {
        // User wants to remove avatar
        if (user) {
          try {
            await StorageService.deleteAvatar(user.id);
            finalAvatarUrl = null;
            await ProfileService.updateProfile({
              avatarUrl: null,
            });
            if (onAvatarUpdate) {
              onAvatarUpdate(null);
            }
          } catch (error) {
            // Log but continue
          }
        }
      }

      // Update name and username (avatar is already updated automatically when selected)
      await ProfileService.updateProfile({
        name: name.trim(),
        username: username.trim() || undefined,
      });
      onSave(name.trim(), username.trim(), finalAvatarUrl);
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
      transparent={false}
      onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
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
              style={[
                styles.saveButton,
                { backgroundColor: loading ? tintColor + '50' : tintColor },
                loading && styles.saveButtonDisabled,
              ]}>
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.saveButtonText}>Salvar</ThemedText>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <View style={styles.avatarSection}>
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={handleImagePicker}
                disabled={uploadingAvatar}
                activeOpacity={0.8}>
                {uploadingAvatar ? (
                  <View style={[styles.avatarWrapper, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : tintColor + '20' }]}>
                    <ActivityIndicator size="large" color={tintColor} />
                  </View>
                ) : (tempAvatarUri || avatarUrl) && !avatarLoadError ? (
                  <>
                    <Image
                      source={{ 
                        uri: (tempAvatarUri || avatarUrl || '').includes('?t=') 
                          ? (tempAvatarUri || avatarUrl || '')
                          : `${tempAvatarUri || avatarUrl || ''}?t=${Date.now()}`,
                      }}
                      style={styles.avatarImage}
                      contentFit="cover"
                      transition={200}
                      placeholderContentFit="cover"
                      cachePolicy="memory-disk"
                      recyclingKey={tempAvatarUri || avatarUrl || ''}
                      onError={() => {
                        setAvatarLoadError(true);
                      }}
                      onLoad={() => {
                        setAvatarLoadError(false);
                      }}
                    />
                    <View style={styles.avatarBottomOverlay}>
                      <ThemedText style={styles.avatarEditText}>Alterar</ThemedText>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={[styles.avatarWrapper, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : tintColor + '20' }]}>
                      <Ionicons name="person" size={56} color={isDark ? 'rgba(255, 255, 255, 0.7)' : tintColor} />
                    </View>
                    <View style={styles.avatarBottomOverlay}>
                      <ThemedText style={styles.avatarEditText}>Alterar</ThemedText>
                    </View>
                  </>
                )}
              </TouchableOpacity>
              {(avatarUrl || tempAvatarUri) && (
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => {
                    setAvatarUrl(null);
                    setTempAvatarUri(null);
                  }}>
                  <ThemedText style={styles.removePhotoText}>Remover foto</ThemedText>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.formSection}>
              <View style={styles.fieldContainer}>
                <ThemedText style={[styles.label, { color: textColor }]}>Nome</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      color: textColor,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    },
                  ]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Seu nome completo"
                  placeholderTextColor={textColor + '50'}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.fieldContainer}>
                <ThemedText style={[styles.label, { color: textColor }]}>Username</ThemedText>
                <View style={[
                  styles.usernameWrapper,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                    borderColor: usernameError ? '#ff3b30' : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                  },
                ]}>
                  <ThemedText style={[styles.atSymbol, { color: textColor, opacity: 0.6 }]}>
                    @
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.usernameInput,
                      { color: textColor },
                    ]}
                    value={username}
                    onChangeText={handleUsernameChange}
                    placeholder="seuusername"
                    placeholderTextColor={textColor + '50'}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {usernameError ? (
                  <ThemedText style={styles.errorText}>{usernameError}</ThemedText>
                ) : (
                  <ThemedText style={[styles.hint, { color: textColor, opacity: 0.5 }]}>
                    Letras, números e underscore. Mínimo 3 caracteres.
                  </ThemedText>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
  },
  avatarWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70,
  },
  avatarEditText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  removePhotoButton: {
    paddingVertical: 8,
  },
  removePhotoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ff3b30',
  },
  formSection: {
    gap: 24,
  },
  fieldContainer: {
    gap: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  usernameWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  atSymbol: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  usernameInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  errorText: {
    fontSize: 13,
    color: '#ff3b30',
    marginTop: 2,
  },
  hint: {
    fontSize: 13,
    marginTop: 2,
  },
});

