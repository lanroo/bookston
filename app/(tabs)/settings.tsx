import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PushNotificationSettings, SignOutButton } from '@/components/settings';
import { useTabBarPadding } from '@/components/tab-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { ThemeMode } from '@/types';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const { themeMode, setThemeMode } = useTheme();
  const { isEnabled: pushNotificationsEnabled } = usePushNotifications();
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showPushNotificationModal, setShowPushNotificationModal] = useState(false);
  const tabBarPadding = useTabBarPadding();

  const getThemeLabel = (mode: ThemeMode) => {
    switch (mode) {
      case 'light':
        return 'Claro';
      case 'dark':
        return 'Escuro';
      default:
        return 'Claro';
    }
  };

  const handleThemeChange = async (mode: ThemeMode) => {
    await setThemeMode(mode);
    setShowThemeModal(false);
  };

  const settingsSections = [
    {
      title: 'Aparência',
      items: [
        {
          icon: 'moon-outline',
          label: 'Tema',
          value: getThemeLabel(themeMode),
          onPress: () => {
            setShowThemeModal(true);
          },
        },
      ],
    },
    {
      title: 'Notificações',
      items: [
        {
          icon: 'notifications-outline',
          label: 'Notificações Push',
          value: pushNotificationsEnabled ? 'Ativado' : 'Desativado',
          onPress: () => {
            setShowPushNotificationModal(true);
          },
        },
        {
          icon: 'mail-outline',
          label: 'Notificações por Email',
          value: 'Ativado',
          onPress: () => {
            console.log('Configurar email');
          },
        },
      ],
    },
    {
      title: 'Dados',
      items: [
        {
          icon: 'cloud-download-outline',
          label: 'Backup Automático',
          value: 'Ativado',
          onPress: () => {
            console.log('Configurar backup');
          },
        },
        {
          icon: 'download-outline',
          label: 'Exportar Dados',
          onPress: () => {
            console.log('Exportar dados');
          },
        },
        {
          icon: 'trash-outline',
          label: 'Limpar Cache',
          onPress: () => {
            console.log('Limpar cache');
          },
        },
      ],
    },
    {
      title: 'Sobre',
      items: [
        {
          icon: 'information-circle-outline',
          label: 'Sobre o App',
          onPress: () => {
            console.log('Sobre o app');
          },
        },
        {
          icon: 'help-circle-outline',
          label: 'Ajuda e Suporte',
          onPress: () => {
            console.log('Ajuda');
          },
        },
        {
          icon: 'document-text-outline',
          label: 'Termos de Uso',
          onPress: () => {
            console.log('Termos de uso');
          },
        },
        {
          icon: 'shield-checkmark-outline',
          label: 'Política de Privacidade',
          onPress: () => {
            console.log('Política de privacidade');
          },
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarPadding }]}
        showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>
            Configurações
          </ThemedText>
        </ThemedView>

        {settingsSections.map((section, sectionIndex) => (
          <ThemedView key={sectionIndex} style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { opacity: 0.6 }]}>{section.title}</ThemedText>
            <ThemedView style={styles.sectionItems}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingsItem,
                    { backgroundColor: backgroundColor, borderColor: textColor + '10' },
                    itemIndex === section.items.length - 1 && styles.lastItem,
                  ]}
                  onPress={item.onPress}>
                  <ThemedView style={styles.settingsItemLeft}>
                    <ThemedView style={[styles.settingsIconContainer, { backgroundColor: tintColor + '15' }]}>
                      <Ionicons name={item.icon as any} size={20} color={tintColor} />
                    </ThemedView>
                    <ThemedText style={styles.settingsItemLabel}>{item.label}</ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.settingsItemRight}>
                    {item.value && (
                      <ThemedText style={[styles.settingsItemValue, { opacity: 0.6 }]}>{item.value}</ThemedText>
                    )}
                    <Ionicons name="chevron-forward" size={20} color={textColor} style={{ opacity: 0.3 }} />
                  </ThemedView>
                </TouchableOpacity>
              ))}
            </ThemedView>
          </ThemedView>
        ))}

        <ThemedView style={styles.signOutSection}>
          <SignOutButton style={styles.signOutButton} />
        </ThemedView>

        <ThemedView style={styles.versionContainer}>
          <ThemedText style={[styles.versionText, { opacity: 0.4 }]}>Versão 1.0.0</ThemedText>
        </ThemedView>
      </ScrollView>
          
      <Modal
        visible={showThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowThemeModal(false)}>
          <ThemedView
            style={[styles.modalContent, { backgroundColor }]}
            onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIconContainer, { backgroundColor: tintColor + '15' }]}>
                  <Ionicons name="color-palette" size={20} color={tintColor} />
                </View>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Escolher Tema
              </ThemedText>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowThemeModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color={textColor} style={{ opacity: 0.6 }} />
              </TouchableOpacity>
            </View>

            <View style={styles.themeOptions}>
              {(['light', 'dark'] as ThemeMode[]).map((mode) => {
                const isSelected = themeMode === mode;
                const isLight = mode === 'light';
                const themeColors = Colors[mode];
                const borderColor = isSelected 
                  ? tintColor 
                  : (isLight ? themeColors.text + '15' : themeColors.text + '20');
                
                return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.themeOption,
                      {
                        backgroundColor: themeColors.background,
                        borderColor,
                        borderWidth: isSelected ? 2 : 1,
                      },
                  ]}
                    onPress={() => handleThemeChange(mode)}
                    activeOpacity={0.7}>
                    <View style={styles.themeOptionLeft}>
                      <View style={[
                        styles.themeIconContainer,
                        {
                          backgroundColor: isSelected 
                            ? tintColor + (isLight ? '15' : '20')
                            : (isLight ? themeColors.text + '08' : themeColors.text + '10'),
                        }
                      ]}>
                    <Ionicons
                          name={isLight ? 'sunny' : 'moon'}
                          size={28}
                          color={isSelected ? tintColor : themeColors.icon}
                    />
                      </View>
                      <View style={styles.themeOptionText}>
                        <ThemedText 
                          style={[
                            styles.themeOptionLabel,
                            { 
                              color: themeColors.text,
                              fontWeight: isSelected ? '700' : '600',
                            }
                          ]}>
                        {getThemeLabel(mode)}
                      </ThemedText>
                        <ThemedText 
                          style={[
                            styles.themeOptionDescription,
                            { 
                              color: themeColors.icon,
                              opacity: 0.9,
                            }
                          ]}>
                          {isLight ? 'Ideal para uso durante o dia' : 'Ideal para uso à noite'}
                      </ThemedText>
                      </View>
                    </View>
                    {isSelected && (
                      <View style={[styles.checkmarkContainer, { backgroundColor: tintColor }]}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      </View>
                  )}
                </TouchableOpacity>
                );
              })}
            </View>
          </ThemedView>
        </TouchableOpacity>
      </Modal>

      <PushNotificationSettings
        visible={showPushNotificationModal}
        onClose={() => setShowPushNotificationModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionItems: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsItemLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsItemValue: {
    fontSize: 14,
  },
  signOutSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  signOutButton: {
    marginBottom: 0,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  versionText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 20,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeOptions: {
    gap: 16,
    padding: 24,
    paddingTop: 8,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    minHeight: 88,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  themeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeOptionText: {
    flex: 1,
    gap: 4,
  },
  themeOptionLabel: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  themeOptionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  checkmarkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

