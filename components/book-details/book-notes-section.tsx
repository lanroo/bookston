import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

interface BookNotesSectionProps {
  notes: string;
  editingNotes: boolean;
  savingNotes: boolean;
  notesValue: string;
  onNotesValueChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  backgroundColor: string;
  textColor: string;
  tintColor: string;
  isDark: boolean;
}

export function BookNotesSection({
  notes,
  editingNotes,
  savingNotes,
  notesValue,
  onNotesValueChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  backgroundColor,
  textColor,
  tintColor,
  isDark,
}: BookNotesSectionProps) {
  return (
    <ThemedView style={styles.section}>
      <ThemedView style={styles.sectionHeader}>
        <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
          Suas Notas
        </ThemedText>
        {!editingNotes && (
          <TouchableOpacity onPress={onStartEdit} style={styles.editButtonSmall}>
            <Ionicons name="create-outline" size={16} color={tintColor} />
          </TouchableOpacity>
        )}
      </ThemedView>

      {editingNotes ? (
        <ThemedView>
          <TextInput
            style={[
              styles.notesInputCompact,
              {
                color: textColor,
                backgroundColor: backgroundColor,
                borderColor: textColor + '20',
              },
            ]}
            value={notesValue}
            onChangeText={onNotesValueChange}
            placeholder="Adicione suas notas..."
            placeholderTextColor={textColor + '60'}
            multiline
            textAlignVertical="top"
            autoFocus
          />
          <ThemedView style={styles.editActionsCompact}>
            <TouchableOpacity onPress={onCancelEdit} style={styles.cancelButtonCompact}>
              <ThemedText style={[styles.cancelButtonText, { color: textColor + '80' }]}>
                Cancelar
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSave}
              disabled={savingNotes}
              style={[styles.saveButtonCompact, { backgroundColor: tintColor }]}>
              {savingNotes ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={[styles.saveButtonText, { color: '#fff' }]}>
                  Salvar
                </ThemedText>
              )}
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      ) : (
        <TouchableOpacity
          onPress={onStartEdit}
          activeOpacity={0.7}
          style={[styles.notesContainer, { backgroundColor: isDark ? tintColor + '10' : tintColor + '08' }]}>
          <ThemedText style={[styles.notesTextCompact, { color: textColor + '90' }]} numberOfLines={3}>
            {notes || 'Toque para adicionar notas sobre este livro...'}
          </ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  editButtonSmall: {
    padding: 6,
  },
  notesInputCompact: {
    minHeight: 80,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    fontSize: 14,
    lineHeight: 20,
  },
  editActionsCompact: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  cancelButtonCompact: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonCompact: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesContainer: {
    padding: 12,
    borderRadius: 10,
    minHeight: 60,
    justifyContent: 'center',
  },
  notesTextCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
});

