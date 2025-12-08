import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/contexts/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { ThemeMode } from '@/types';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const { themeMode, setThemeMode } = useTheme();
  const [showThemeModal, setShowThemeModal] = useState(false);

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
        {
          icon: 'text-outline',
          label: 'Tamanho da Fonte',
          value: 'Padrão',
          onPress: () => {
            console.log('Configurar fonte');
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
          value: 'Ativado',
          onPress: () => {
            console.log('Configurar notificações');
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
        contentContainerStyle={styles.scrollContent}
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
            style={[styles.modalContent, { backgroundColor: backgroundColor, borderColor: textColor + '20' }]}
            onStartShouldSetResponder={() => true}>
            <ThemedView style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Escolher Tema
              </ThemedText>
              <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </ThemedView>

            <ThemedView style={styles.themeOptions}>
              {(['light', 'dark'] as ThemeMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.themeOption,
                    { backgroundColor: backgroundColor, borderColor: textColor + '20' },
                    themeMode === mode && { borderColor: tintColor, borderWidth: 2 },
                  ]}
                  onPress={() => handleThemeChange(mode)}>
                  <ThemedView style={styles.themeOptionContent}>
                    <Ionicons
                      name={mode === 'light' ? 'sunny' : 'moon'}
                      size={24}
                      color={themeMode === mode ? tintColor : textColor}
                    />
                    <ThemedView style={styles.themeOptionText}>
                      <ThemedText style={[styles.themeOptionLabel, themeMode === mode && { color: tintColor, fontWeight: '600' }]}>
                        {getThemeLabel(mode)}
                      </ThemedText>
                      <ThemedText style={[styles.themeOptionDescription, { opacity: 0.6 }]}>
                        {mode === 'light' ? 'Tema claro' : 'Tema escuro'}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                  {themeMode === mode && (
                    <Ionicons name="checkmark-circle" size={24} color={tintColor} />
                  )}
                </TouchableOpacity>
              ))}
            </ThemedView>
          </ThemedView>
        </TouchableOpacity>
      </Modal>
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
    paddingBottom: 40,
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
  versionContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  versionText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  themeOptions: {
    gap: 12,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  themeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  themeOptionText: {
    flex: 1,
  },
  themeOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  themeOptionDescription: {
    fontSize: 14,
  },
});

