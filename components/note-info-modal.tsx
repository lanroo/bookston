import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Note } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NoteInfoModalProps {
  visible: boolean;
  note: Note | null;
  onClose: () => void;
}

export function NoteInfoModal({ visible, note, onClose }: NoteInfoModalProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  if (!note) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return { dateStr, timeStr, fullDate: date };
  };

  const createdInfo = note.createdAt ? formatDateTime(note.createdAt) : null;
  const updatedInfo = note.updatedAt ? formatDateTime(note.updatedAt) : null;
  const hasBeenModified = 
    note.createdAt && 
    note.updatedAt && 
    new Date(note.createdAt).getTime() !== new Date(note.updatedAt).getTime();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <ThemedView style={[styles.modal, { backgroundColor }]}>
            {/* Header */}
            <ThemedView style={styles.header}>
              <ThemedText type="title" style={styles.title}>
                Informações da Nota
              </ThemedText>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </ThemedView>

            {/* Content */}
            <ThemedView style={styles.content}>
              {/* Created Date */}
              {createdInfo && (
                <ThemedView style={styles.infoSection}>
                  <ThemedView style={styles.infoRow}>
                    <Ionicons 
                      name="time-outline" 
                      size={20} 
                      color={tintColor} 
                      style={styles.icon} 
                    />
                    <ThemedView style={styles.infoContent}>
                      <ThemedText style={[styles.label, { color: textColor, opacity: 0.6 }]}>
                        Criado em
                      </ThemedText>
                      <ThemedText style={[styles.value, { color: textColor }]}>
                        {createdInfo.dateStr} às {createdInfo.timeStr}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              )}

              {updatedInfo && hasBeenModified && (
                <ThemedView style={styles.infoSection}>
                  <ThemedView style={styles.infoRow}>
                    <Ionicons 
                      name="create-outline" 
                      size={20} 
                      color={tintColor} 
                      style={styles.icon} 
                    />
                    <ThemedView style={styles.infoContent}>
                      <ThemedText style={[styles.label, { color: textColor, opacity: 0.6 }]}>
                        Última modificação
                      </ThemedText>
                      <ThemedText style={[styles.value, { color: textColor }]}>
                        {updatedInfo.dateStr} às {updatedInfo.timeStr}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              )}

              {!hasBeenModified && (
                <ThemedView style={styles.infoSection}>
                  <ThemedText style={[styles.noModification, { color: textColor, opacity: 0.5 }]}>
                    Esta nota ainda não foi modificada
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
          </ThemedView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modal: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  noModification: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

