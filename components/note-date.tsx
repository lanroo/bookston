import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Note } from '@/types';

interface NoteDateProps {
  note: Note;
  showModified?: boolean;
}

export function NoteDate({ note, showModified = false }: NoteDateProps) {
  const textColor = useThemeColor({}, 'text');

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
    return { dateStr, timeStr };
  };

  const hasBeenModified = 
    note.createdAt && 
    note.updatedAt && 
    new Date(note.createdAt).getTime() !== new Date(note.updatedAt).getTime();

  if (!note.createdAt) {
    return null;
  }

  const { dateStr: createdDate, timeStr: createdTime } = formatDateTime(note.createdAt);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.dateRow}>
        <Ionicons 
          name="time-outline" 
          size={12} 
          color={textColor} 
          style={styles.icon} 
        />
        <ThemedText style={[styles.dateText, { color: textColor, opacity: 0.7 }]}>
          {createdDate} às {createdTime}
        </ThemedText>
      </ThemedView>
      
      {showModified && hasBeenModified && note.updatedAt && (
        <ThemedView style={[styles.dateRow, styles.modifiedRow]}>
          <Ionicons 
            name="create-outline" 
            size={12} 
            color={textColor} 
            style={styles.icon} 
          />
          <ThemedText style={[styles.dateText, { color: textColor, opacity: 0.7 }]}>
            Modificado: {formatDateTime(note.updatedAt).dateStr} às {formatDateTime(note.updatedAt).timeStr}
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modifiedRow: {
    marginTop: 4,
  },
  icon: {
    opacity: 0.5,
    marginRight: 4,
  },
  dateText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
});

