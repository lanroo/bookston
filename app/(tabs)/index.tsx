import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MarkdownText } from '@/components/markdown-text';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { NotesService } from '@/services/notes.service';
import type { Note } from '@/types';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const { user } = useAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      const [notesData, foldersData] = await Promise.all([
        NotesService.getNotes(),
        NotesService.getFolders(),
      ]);

      setNotes(notesData);
      setFolders(foldersData);
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const recentNotes = notes
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  const stats = [
    { label: 'Notas', value: notes.length.toString(), icon: 'document-text', color: tintColor },
    { label: 'Livros', value: '0', icon: 'library', color: tintColor },
    { label: 'Pastas', value: folders.length.toString(), icon: 'folder', color: tintColor },
  ];

  const NeonActionCard = ({ icon, text, onPress }: { icon: string; text: string; onPress?: () => void }) => {
    const neonColor1 = tintColor;
    const neonColor2 = colorScheme === 'dark' 
      ? tintColor + 'CC' 
      : tintColor + 'AA'; 
    const gradientColors: [string, string, string] = [neonColor1, neonColor2, neonColor1];

    return (
      <TouchableOpacity 
        style={styles.neonCardWrapper}
        onPress={onPress}
        activeOpacity={0.8}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.neonBorder,
            {
              shadowColor: tintColor,
              shadowOffset: {
                width: 0,
                height: 0,
              },
              shadowOpacity: colorScheme === 'dark' ? 0.9 : 0.6,
              shadowRadius: 10,
              elevation: 10,
            },
          ]}>
          <View style={[styles.actionCardInner, { backgroundColor: backgroundColor }]}>
            <ThemedView style={[styles.actionCard, { backgroundColor: tintColor + '10' }]}>
              <Ionicons name={icon as any} size={32} color={tintColor} />
              <ThemedText style={[styles.actionText, { color: tintColor }]}>{text}</ThemedText>
            </ThemedView>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.header}>
          <ThemedView>
            <ThemedText style={styles.greeting}>Olá,</ThemedText>
            <ThemedText type="title" style={styles.userName}>
              {userName}
        </ThemedText>
      </ThemedView>
          <TouchableOpacity
            style={[
              styles.avatarContainer,
              {
                backgroundColor: tintColor + '20',
                shadowColor: tintColor,
                shadowOffset: {
                  width: 0,
                  height: 0,
                },
                shadowOpacity: colorScheme === 'dark' ? 0.6 : 0.2,
                shadowRadius: colorScheme === 'dark' ? 12 : 8,
                elevation: colorScheme === 'dark' ? 12 : 8,
              },
            ]}
            onPress={() => router.push('/profile')}>
            <Ionicons name="person" size={32} color={tintColor} />
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <ThemedView
              key={index}
              style={[styles.statCard, { backgroundColor: backgroundColor, borderColor: textColor + '10' }]}>
              <ThemedView style={[styles.statIconContainer, { backgroundColor: stat.color + '15' }]}>
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              </ThemedView>
              <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
              <ThemedText style={styles.statLabel}>{stat.label}</ThemedText>
            </ThemedView>
          ))}
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Ações Rápidas
        </ThemedText>
          <ThemedView style={styles.actionsContainer}>
            <NeonActionCard 
              icon="add-circle" 
              text="Nova Nota" 
              onPress={() => router.push('/(tabs)/notes?create=true')}
            />
            <NeonActionCard 
              icon="book" 
              text="Adicionar Livro" 
              onPress={() => router.push('/(tabs)/books?add=true')}
            />
          </ThemedView>
      </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Atividade Recente
          </ThemedText>
          {recentNotes.length > 0 ? (
            <ThemedView style={styles.recentActivityContainer}>
              {recentNotes.map((note) => {
                const noteTitle = note.title?.replace(/\*\*/g, '').replace(/^#\s/, '') || 'Sem título';
                const lastModified = note.updatedAt || note.createdAt || '';
                
                return (
                  <TouchableOpacity
                    key={note.id}
                    style={[styles.recentNoteCard, { backgroundColor: backgroundColor, borderColor: textColor + '10' }]}
                    onPress={() => router.push('/(tabs)/notes')}
                    activeOpacity={0.7}>
                    <ThemedView style={styles.recentNoteHeader}>
                      <ThemedView style={[styles.recentNoteIconContainer, { backgroundColor: tintColor + '15' }]}>
                        <Ionicons name="document-text" size={18} color={tintColor} />
                      </ThemedView>
                      <ThemedView style={styles.recentNoteContent}>
                        <ThemedText 
                          style={[styles.recentNoteTitle, { color: textColor }]} 
                          numberOfLines={1}>
                          {noteTitle}
                        </ThemedText>
                        {note.content && (
                          <ThemedView style={styles.recentNotePreview}>
                            <MarkdownText content={note.content} numberOfLines={1} />
                          </ThemedView>
                        )}
                      </ThemedView>
                      <ThemedText style={[styles.recentNoteTime, { color: textColor, opacity: 0.5 }]}>
                        {formatRelativeDate(lastModified)}
                      </ThemedText>
                    </ThemedView>
                  </TouchableOpacity>
                );
              })}
            </ThemedView>
          ) : (
            <ThemedView style={[styles.emptyState, { backgroundColor: backgroundColor, borderColor: textColor + '10' }]}>
              <Ionicons name="time-outline" size={48} color={textColor} style={{ opacity: 0.3 }} />
              <ThemedText style={[styles.emptyStateText, { opacity: 0.5 }]}>
                Nenhuma atividade recente
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  neonCardWrapper: {
    flex: 1,
    minHeight: 120,
  },
  neonBorder: {
    borderRadius: 16,
    padding: 2, 
  },
  actionCardInner: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 116, 
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyState: {
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  recentActivityContainer: {
    gap: 12,
  },
  recentNoteCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  recentNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentNoteIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentNoteContent: {
    flex: 1,
    minWidth: 0,
  },
  recentNoteTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  recentNotePreview: {
    opacity: 0.6,
  },
  recentNoteTime: {
    fontSize: 12,
    fontWeight: '500',
  },
});
