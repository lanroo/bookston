import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { LoadingScreen } from '@/components/loading-screen';
import { MarkdownText } from '@/components/markdown-text';
import { NoteDate } from '@/components/note-date';
import { NoteInfoModal } from '@/components/note-info-modal';
import { NoteModal } from '@/components/note-modal';
import { NoteOptionsSheet } from '@/components/note-options-sheet';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { NotesService } from '@/services/notes.service';
import type { Folder, Note } from '@/types';
import { notesStyles as styles } from './notes.styles';

export default function NotesScreen() {
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const { user } = useAuth();
  const params = useLocalSearchParams();
  
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [noteInfoModalVisible, setNoteInfoModalVisible] = useState(false);
  const [selectedNoteForInfo, setSelectedNoteForInfo] = useState<Note | null>(null);
  const [optionsSheetVisible, setOptionsSheetVisible] = useState(false);
  const [selectedNoteForOptions, setSelectedNoteForOptions] = useState<Note | null>(null);

  const filteredNotes = selectedFolder
    ? notes.filter((note) => note.folderId === selectedFolder)
    : notes.filter((note) => !note.folderId);

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
      Alert.alert('Erro', 'Não foi possível carregar os dados. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleCreateNote = useCallback(() => {
    setEditingNote(null);
    setNoteModalVisible(true);
  }, []);

  useEffect(() => {
    if (params.create === 'true') {
      handleCreateNote();
      router.setParams({ create: undefined });
    }
  }, [params.create, handleCreateNote]);

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteModalVisible(true);
  };

  const handleCloseModal = () => {
    setNoteModalVisible(false);
    setEditingNote(null);
  };

  const handleNoteSaved = async (updatedNote?: Note) => {
    if (updatedNote) {
      setNotes(prevNotes => {
        const index = prevNotes.findIndex(n => n.id === updatedNote.id);
        if (index >= 0) {
          const newNotes = [...prevNotes];
          newNotes[index] = updatedNote;
          return newNotes;
        } else {
          return [...prevNotes, updatedNote];
        }
      });
      if (editingNote?.id === updatedNote.id) {
        setEditingNote(updatedNote);
      }
    } else {
      await loadData();
      if (editingNote) {
        try {
          const updatedNotes = await NotesService.getNotes();
          const updatedNote = updatedNotes.find(n => n.id === editingNote.id);
          if (updatedNote) {
            setEditingNote(updatedNote);
          }
        } catch (error) {
        }
      }
    }
  };

  const handleDeleteNote = (note: Note) => {
    Alert.alert(
      'Deletar Nota',
      'Tem certeza que deseja deletar esta nota? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              await NotesService.deleteNote(note.id);
              loadData();
            } catch (error: any) {
              Alert.alert('Erro', 'Não foi possível deletar a nota. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  const handleOpenOptions = (note: Note) => {
    setSelectedNoteForOptions(note);
    setOptionsSheetVisible(true);
  };

  const handleCloseOptions = () => {
    setOptionsSheetVisible(false);
    setSelectedNoteForOptions(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ScreenHeader
        title="Notas"
        onAddPress={handleCreateNote}
        rightAction={
          filteredNotes.length > 0 ? (
            <ThemedView style={styles.viewModeContainer}>
              <TouchableOpacity
                style={[
                  styles.viewModeButton,
                  viewMode === 'grid' && { backgroundColor: tintColor + '20' },
                ]}
                onPress={() => setViewMode('grid')}
                activeOpacity={0.7}>
                <Ionicons
                  name="grid"
                  size={20}
                  color={viewMode === 'grid' ? tintColor : textColor}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewModeButton,
                  viewMode === 'list' && { backgroundColor: tintColor + '20' },
                ]}
                onPress={() => setViewMode('list')}
                activeOpacity={0.7}>
                <Ionicons
                  name="list"
                  size={20}
                  color={viewMode === 'list' ? tintColor : textColor}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: tintColor }]}
                onPress={handleCreateNote}
                activeOpacity={0.8}>
                <Ionicons name="add" size={24} color={colorScheme === 'dark' ? '#000' : '#fff'} />
              </TouchableOpacity>
            </ThemedView>
          ) : undefined
        }
      />
      {folders.length > 0 && (
        <ThemedView style={styles.foldersSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.foldersScroll}>
            <TouchableOpacity
              style={[
                styles.folderChip,
                !selectedFolder && { backgroundColor: tintColor },
                selectedFolder && { backgroundColor: backgroundColor, borderColor: textColor + '20' },
              ]}
              onPress={() => setSelectedFolder(null)}>
              <Ionicons
                name="document-text"
                size={18}
                color={!selectedFolder ? (colorScheme === 'dark' ? '#000' : '#fff') : textColor}
              />
              <ThemedText
                style={[
                  styles.folderChipText,
                  !selectedFolder && { color: colorScheme === 'dark' ? '#000' : '#fff', fontWeight: '600' },
                ]}>
                Todas
              </ThemedText>
            </TouchableOpacity>
            {folders.map((folder) => {
              const isSelected = selectedFolder === folder.id;
              return (
                <TouchableOpacity
                  key={folder.id}
                  style={[
                    styles.folderChip,
                    isSelected && { backgroundColor: tintColor },
                    !isSelected && { backgroundColor: backgroundColor, borderColor: textColor + '20' },
                  ]}
                  onPress={() => setSelectedFolder(folder.id)}>
                  <Ionicons
                    name="folder"
                    size={18}
                    color={isSelected ? (colorScheme === 'dark' ? '#000' : '#fff') : textColor}
                  />
                  <ThemedText
                    style={[
                      styles.folderChipText,
                      isSelected && { color: colorScheme === 'dark' ? '#000' : '#fff', fontWeight: '600' },
                    ]}>
                    {folder.name}
                  </ThemedText>
                  {folder.noteCount > 0 && (
                    <ThemedView
                      style={[
                        styles.folderBadge,
                        isSelected
                          ? { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }
                          : { backgroundColor: textColor + '10' },
                      ]}>
                      <ThemedText
                        style={[
                          styles.folderBadgeText,
                          isSelected && { color: colorScheme === 'dark' ? '#fff' : '#000' },
                        ]}>
                        {folder.noteCount}
                      </ThemedText>
                    </ThemedView>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </ThemedView>
      )}

      {loading ? (
        <LoadingScreen message="Carregando notas..." />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tintColor} />
          }>
          {filteredNotes.length === 0 ? (
            <EmptyState
              icon="document-text-outline"
              title="Nenhuma nota ainda"
              description={
                selectedFolder
                  ? 'Crie uma nota nesta pasta'
                  : 'Crie sua primeira nota ou organize-as em pastas'
              }
              primaryAction={{
                icon: 'add',
                label: 'Criar Nota',
                onPress: handleCreateNote,
              }}
              secondaryAction={
                !selectedFolder
                  ? {
                      icon: 'folder',
                      label: 'Criar Pasta',
                      onPress: () => {  
                        console.log('Criar pasta');
                      },
                    }
                  : undefined
              }
            />
          ) : (
          <ThemedView style={viewMode === 'grid' ? styles.notesGrid : styles.notesList}>
            {filteredNotes.map((note) => (
              <TouchableOpacity
                key={note.id}
                activeOpacity={0.7}
                onPress={() => {
                  setEditingNote(note);
                  setNoteModalVisible(true);
                }}
                style={[
                  viewMode === 'grid' ? styles.noteCard : styles.noteCardList,
                  { 
                    backgroundColor: backgroundColor, 
                    borderColor: textColor + '15',
                    shadowColor: colorScheme === 'dark' ? '#000' : '#000',
                    shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.1,
                  }
                ]}>
                <ThemedView style={viewMode === 'grid' ? styles.noteHeader : styles.noteHeaderList} pointerEvents="box-none">
                  <ThemedView style={viewMode === 'grid' ? styles.noteTitleContainer : styles.noteTitleContainerList}>
                    <Ionicons 
                      name="document-text" 
                      size={viewMode === 'grid' ? 18 : 20} 
                      color={tintColor} 
                      style={styles.noteIcon}
                    />
                    <ThemedText 
                      style={[
                        viewMode === 'grid' ? styles.noteTitle : styles.noteTitleList,
                        { color: textColor }
                      ]} 
                      numberOfLines={viewMode === 'grid' ? 2 : 1}>
                      {note.title?.replace(/\*\*/g, '').replace(/^#\s/, '') || 'Sem título'}
                    </ThemedText>
                  </ThemedView>
                  <TouchableOpacity
                    style={[styles.noteMenu, { backgroundColor: textColor + '08' }]}
                    onPress={() => handleOpenOptions(note)}>
                    <Ionicons name="ellipsis-vertical" size={16} color={textColor} />
                  </TouchableOpacity>
                </ThemedView>
                {note.content && (
                  <ThemedView style={viewMode === 'grid' ? styles.noteContent : styles.noteContentList}>
                    <MarkdownText content={note.content} numberOfLines={viewMode === 'grid' ? 3 : 2} />
                  </ThemedView>
                )}
                <ThemedView style={[styles.noteDivider, { backgroundColor: textColor + '10' }]} />
                <ThemedView style={viewMode === 'grid' ? styles.noteFooter : styles.noteFooterList}>
                  <NoteDate note={note} />
                </ThemedView>
              </TouchableOpacity>
            ))}
          </ThemedView>
          )}
        </ScrollView>
      )}

      <NoteModal
        visible={noteModalVisible}
        onClose={handleCloseModal}
        onSave={handleNoteSaved}
        note={editingNote}
        folderId={selectedFolder || undefined}
        mode={editingNote ? 'view' : 'edit'}
      />

      <NoteInfoModal
        visible={noteInfoModalVisible}
        note={selectedNoteForInfo}
        onClose={() => {
          setNoteInfoModalVisible(false);
          setSelectedNoteForInfo(null);
        }}
      />

      <NoteOptionsSheet
        visible={optionsSheetVisible}
        note={selectedNoteForOptions}
        onClose={handleCloseOptions}
        onEdit={handleEditNote}
        onDelete={handleDeleteNote}
        onViewInfo={(note) => {
          setSelectedNoteForInfo(note);
          setNoteInfoModalVisible(true);
        }}
      />
    </SafeAreaView>
  );
}

