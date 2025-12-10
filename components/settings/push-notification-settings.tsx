import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert, Modal, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { NOTIFICATION_COLORS, NOTIFICATION_OPACITY } from '@/constants/notifications';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useThemeColor } from '@/hooks/use-theme-color';
import { logger } from '@/utils/logger';

interface PushNotificationSettingsProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Push Notification Settings Modal
 * 
 * Componentized modal for managing push notification settings.
 * Allows users to enable/disable push notifications and view status.
 */
export function PushNotificationSettings({ visible, onClose }: PushNotificationSettingsProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const { isEnabled, isLoading, permissionStatus, expoPushToken, enable, disable } = usePushNotifications();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async (value: boolean) => {
    if (isToggling || isLoading) return;

    try {
      setIsToggling(true);

      if (value) {
        const success = await enable();
        if (!success) {
          Alert.alert(
            'Permissão Negada',
            'Para receber notificações push, é necessário permitir notificações nas configurações do dispositivo.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { 
                text: 'Abrir Configurações', 
                onPress: () => {
    
                }
              },
            ]
          );
        }
      } else {
        await disable();
      }
    } catch (error) {
      logger.error('Error toggling notifications', error);
      Alert.alert('Erro', 'Não foi possível alterar as configurações de notificação.');
    } finally {
      setIsToggling(false);
    }
  };

  const statusText = useMemo(() => {
    if (isLoading || isToggling) {
      return 'Carregando...';
    }

    if (permissionStatus === 'denied') {
      return 'Permissão negada';
    }

    if (permissionStatus === 'undetermined') {
      return 'Não configurado';
    }

    if (isEnabled) {
      // If enabled but no push token, it means only local notifications are available
      return expoPushToken ? 'Ativado' : 'Ativado (apenas locais)';
    }

    return 'Desativado';
  }, [isLoading, isToggling, permissionStatus, isEnabled, expoPushToken]);

  const statusColor = useMemo(() => {
    if (permissionStatus === 'denied') {
      return NOTIFICATION_COLORS.ERROR;
    }

    if (isEnabled) {
      return tintColor;
    }

    return textColor + NOTIFICATION_OPACITY.DISABLED;
  }, [permissionStatus, isEnabled, tintColor, textColor]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}>
        <ThemedView
          style={[styles.modalContent, { backgroundColor, borderRadius: 24 }]}
          onStartShouldSetResponder={() => true}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <View style={[styles.modalIconContainer, { backgroundColor: tintColor + '15' }]}>
                <Ionicons name="notifications" size={20} color={tintColor} />
              </View>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Notificações Push
              </ThemedText>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={textColor} style={{ opacity: 0.6 }} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingLabel}>Receber Notificações</ThemedText>
                <ThemedText style={[styles.settingDescription, { opacity: 0.6 }]}>
                  {permissionStatus === 'denied'
                    ? 'Ative as notificações nas configurações do dispositivo'
                    : 'Receba notificações sobre atividades importantes'}
                </ThemedText>
              </View>
              <Switch
                value={isEnabled && permissionStatus === 'granted'}
                onValueChange={handleToggle}
                disabled={isLoading || isToggling || permissionStatus === 'denied'}
                trackColor={{ 
                  false: textColor + NOTIFICATION_OPACITY.TRACK, 
                  true: tintColor + NOTIFICATION_OPACITY.TRACK_ACTIVE 
                }}
                thumbColor={isEnabled && permissionStatus === 'granted' ? tintColor : NOTIFICATION_COLORS.SWITCH_THUMB_DISABLED}
                ios_backgroundColor={textColor + NOTIFICATION_OPACITY.TRACK}
              />
            </View>

            <View style={styles.statusContainer}>
              <View style={styles.statusRow}>
                <ThemedText style={[styles.statusLabel, { opacity: 0.6 }]}>Status:</ThemedText>
                <ThemedText style={[styles.statusValue, { color: statusColor }]}>
                  {statusText}
                </ThemedText>
              </View>
            </View>

            {permissionStatus === 'denied' && (
              <View style={[
                styles.warningContainer, 
                { 
                  backgroundColor: NOTIFICATION_COLORS.ERROR + NOTIFICATION_OPACITY.BACKGROUND, 
                  borderColor: NOTIFICATION_COLORS.ERROR + NOTIFICATION_OPACITY.BORDER 
                }
              ]}>
                <Ionicons name="warning" size={20} color={NOTIFICATION_COLORS.ERROR} />
                <ThemedText style={[styles.warningText, { color: NOTIFICATION_COLORS.ERROR }]}>
                  As notificações estão desativadas nas configurações do dispositivo. Ative-as para receber notificações.
                </ThemedText>
              </View>
            )}
          </View>
        </ThemedView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  content: {
    padding: 24,
    paddingTop: 8,
    gap: 24,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  settingInfo: {
    flex: 1,
    gap: 4,
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});

