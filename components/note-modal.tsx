import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { NotesService } from '@/services/notes.service';
import type { Note } from '@/types';

interface NoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (updatedNote?: Note) => void;
  note?: Note | null;
  folderId?: string | null;
  mode?: 'view' | 'edit';
}

export function NoteModal({ visible, onClose, onSave, note, folderId, mode = 'edit' }: NoteModalProps) {
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [currentMode, setCurrentMode] = useState<'view' | 'edit'>(mode);
  const textInputRef = useRef<TextInput>(null);
  const titleInputRef = useRef<TextInput>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUpdatingFromSaveRef = useRef(false);
  const initialTextRef = useRef<string>('');

  const isEditing = !!note;
  const isViewMode = currentMode === 'view';

  const getCleanText = (mdText: string): string => {
    return mdText
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^#\s/gm, '')
      .replace(/^>\s/gm, '')
      .replace(/^-\s/gm, '')
      .replace(/^\d+\.\s/gm, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  };

  const lines = text.split('\n');
  const hasTitle = lines.length > 1 && lines[0].trim().length > 0;
  const title = hasTitle ? lines[0] : '';
  const content = hasTitle ? lines.slice(1).join('\n') : '';
  
  const hasRealContent = content.trim().length > 0;
  const showTitleSeparated = hasTitle && hasRealContent;
  
  const inputValue = useMemo(() => {
    if (showTitleSeparated) {
      return getCleanText(content);
    } else {
      return getCleanText(text);
    }
  }, [showTitleSeparated, content, text, getCleanText]);

  useEffect(() => {
    if (visible) {
      setCurrentMode(mode);
      
      if (isUpdatingFromSaveRef.current) {
        isUpdatingFromSaveRef.current = false;
        return;
      }
      
      if (note) {
        const combinedText = note.title 
          ? (note.content ? `${note.title}\n${note.content}` : note.title)
          : note.content || '';
        const cleanTitle = getCleanText(note.title || '');
        setText(combinedText);
        setTitleValue(cleanTitle);
        setEditingTitle(false);
        initialTextRef.current = combinedText;
      } else {
        setText('');
        setTitleValue('');
        setEditingTitle(false);
        initialTextRef.current = '';
      }
    }
  }, [note, visible, mode]);

  useEffect(() => {
    if (visible && textInputRef.current && !isViewMode && !note) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
  }, [visible, isViewMode, note]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const autoSave = useCallback(async (textToSave: string) => {
    if (editingTitle) {
      return;
    }
    
    if (!isEditing || !note || loading) {
      return;
    }
    
    const cleanText = getCleanText(textToSave);
    if (!cleanText.trim()) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const lines = cleanText.split('\n');
        let noteTitle = lines[0]?.trim() || 'Sem título';
        let noteContent = lines.slice(1).join('\n').trim();
        
        if (noteTitle && !noteTitle.startsWith('**') && !noteTitle.startsWith('#')) {
          noteTitle = `**${noteTitle}**`;
        }

        const updatedNote = await NotesService.updateNote(note.id, {
          title: noteTitle,
          content: noteContent,
          folderId: folderId !== undefined ? folderId : note.folderId,
        });
        
        const savedText = updatedNote.title 
          ? (updatedNote.content ? `${updatedNote.title}\n${updatedNote.content}` : updatedNote.title)
          : updatedNote.content || '';
        initialTextRef.current = savedText;
        
        onSave(updatedNote);
      } catch (error: any) {
      }
    }, 1000);
  }, [isEditing, note, loading, folderId, onSave, getCleanText, editingTitle]);

  const handleSave = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    const cleanText = getCleanText(text);
    if (!cleanText.trim()) {
      Alert.alert('Erro', 'Por favor, escreva algo na nota.');
      return;
    }

    setLoading(true);
    try {
      const lines = cleanText.split('\n');
      let noteTitle = lines[0]?.trim() || 'Sem título';
      let noteContent = lines.slice(1).join('\n').trim();
      
      if (noteTitle && !noteTitle.startsWith('**') && !noteTitle.startsWith('#')) {
        noteTitle = `**${noteTitle}**`;
      }

      let savedNote: Note;
      if (isEditing && note) {
        savedNote = await NotesService.updateNote(note.id, {
          title: noteTitle,
          content: noteContent,
          folderId: folderId !== undefined ? folderId : note.folderId,
        });
      } else {
        savedNote = await NotesService.createNote({
          title: noteTitle,
          content: noteContent,
          folderId: folderId !== undefined ? folderId : null,
        });
      }

      onSave(savedNote);
      const savedText = savedNote.title 
        ? (savedNote.content ? `${savedNote.title}\n${savedNote.content}` : savedNote.title)
        : savedNote.content || '';
      initialTextRef.current = savedText;
      onClose();
      setText('');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível salvar a nota. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleSave = async () => {
    const cleanValue = titleValue.trim();
    const originalTitle = getCleanText(title);
    
    if (cleanValue !== originalTitle && cleanValue.length > 0 && isEditing && note) {
      try {
        const formattedTitle = `**${cleanValue}**`;
        
        const updatedNote = await NotesService.updateNote(note.id, {
          title: formattedTitle,
          content: content,
        });
        
        const newText = updatedNote.title + (updatedNote.content ? '\n' + updatedNote.content : '');
        
        isUpdatingFromSaveRef.current = true;
        setTitleValue(cleanValue);
        setText(newText);
        setEditingTitle(false);
        initialTextRef.current = newText;
        onSave(updatedNote);
      } catch (error: any) {
        Alert.alert('Erro', 'Não foi possível atualizar o título.');
      }
    } else if (cleanValue !== originalTitle && cleanValue.length > 0) {
      const formattedTitle = `**${cleanValue}**`;
      const newText = formattedTitle + '\n' + content;
      setText(newText);
    } else {
      setEditingTitle(false);
    }
  };

  const handleClose = () => {
    const currentText = text.trim();
    const initialText = initialTextRef.current.trim();
    
    if (!note) {
      if (currentText) {
        Alert.alert(
          'Descartar alterações?',
          'Você tem alterações não salvas. Deseja descartá-las?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Descartar',
              style: 'destructive',
              onPress: () => {
                setText('');
                initialTextRef.current = '';
                onClose();
              },
            },
          ]
        );
      } else {
        onClose();
      }
    } else {
      if (currentText !== initialText) {
        Alert.alert(
          'Descartar alterações?',
          'Você tem alterações não salvas. Deseja descartá-las?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Descartar',
              style: 'destructive',
              onPress: () => {
                setText(initialTextRef.current);
                onClose();
              },
            },
          ]
        );
      } else {
        onClose();
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
        {isViewMode ? (
          <>
            <ThemedView style={styles.header}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
              <ThemedText type="title" style={styles.headerTitle}>
                Visualizar Nota
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setCurrentMode('edit');
                  setTimeout(() => {
                    textInputRef.current?.focus();
                  }, 100);
                }}
                style={styles.editButton}>
                <ThemedText style={[styles.editButtonText, { color: tintColor }]}>
                  Editar
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}>
              <ThemedView style={styles.form}>
                {showTitleSeparated && (
                  <ThemedView style={styles.titleContainer}>
                    <ThemedText
                      style={[
                        styles.titleText,
                        {
                          color: textColor,
                          fontSize: 24,
                          fontWeight: '700',
                          marginBottom: 16,
                        },
                      ]}>
                      {getCleanText(title)}
                    </ThemedText>
                    <ThemedView
                      style={[
                        styles.titleDivider,
                        {
                          backgroundColor: tintColor + '30',
                        },
                      ]}
                    />
                  </ThemedView>
                )}
                <ThemedText
                  style={[
                    styles.viewContent,
                    {
                      color: textColor,
                      fontSize: showTitleSeparated ? 17 : 23,
                      fontWeight: showTitleSeparated ? '400' : '700',
                      lineHeight: showTitleSeparated ? 24 : 32,
                    },
                  ]}>
                  {inputValue || (note?.content ? getCleanText(note.content) : '')}
                </ThemedText>
              </ThemedView>
            </ScrollView>
          </>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
            <ThemedView style={styles.header}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
              <ThemedText type="title" style={styles.headerTitle}>
                {isEditing ? 'Editar Nota' : 'Nova Nota'}
              </ThemedText>
              <TouchableOpacity
                onPress={handleSave}
                disabled={loading}
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
                <ThemedText
                  style={[
                    styles.saveButtonText,
                    { color: tintColor },
                    loading && { opacity: 0.5 },
                  ]}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
              showsVerticalScrollIndicator={false}>
              <ThemedView style={styles.form}>
                {showTitleSeparated && (
                  <ThemedView style={styles.titleContainer}>
                    <ThemedView style={styles.titleRow}>
                      {editingTitle ? (
                        <>
                          <TextInput
                            ref={titleInputRef}
                            style={[
                              styles.titleTextInput,
                              {
                                color: textColor,
                                fontSize: 23,
                                fontWeight: '700',
                              },
                            ]}
                            value={titleValue}
                            onChangeText={(newValue) => {
                              setTitleValue(newValue);
                              const formattedTitle = `**${newValue.trim()}**`;
                              const newText = formattedTitle + (content ? '\n' + content : '');
                              setText(newText);
                            }}
                            onBlur={async () => {
                              await handleTitleSave();
                            }}
                            onSubmitEditing={async () => {
                              await handleTitleSave();
                              titleInputRef.current?.blur();
                            }}
                            placeholder="Título da nota"
                            placeholderTextColor={textColor + '60'}
                            selectTextOnFocus
                          />
                          <TouchableOpacity
                            style={[styles.saveTitleButton, { backgroundColor: tintColor }]}
                            onPress={async () => {
                              await handleTitleSave();
                            }}
                            activeOpacity={0.7}>
                            <Ionicons name="checkmark" size={20} color="#fff" />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <ThemedText
                            style={[
                              styles.titleText,
                              {
                                color: textColor,
                                fontSize: 23,
                                fontWeight: '700',
                                flex: 1,
                              },
                            ]}>
                            {getCleanText(title)}
                          </ThemedText>
                          <TouchableOpacity
                            style={[styles.editTitleButton, { backgroundColor: textColor + '10' }]}
                            onPress={() => {
                              const cleanTitle = getCleanText(title);
                              setTitleValue(cleanTitle);
                              setEditingTitle(true);
                              setTimeout(() => {
                                titleInputRef.current?.focus();
                                const titleLength = cleanTitle.length;
                                titleInputRef.current?.setNativeProps({ 
                                  selection: { start: 0, end: titleLength } 
                                });
                              }, 100);
                            }}
                            activeOpacity={0.7}>
                            <Ionicons name="create-outline" size={16} color={tintColor} />
                          </TouchableOpacity>
                        </>
                      )}
                    </ThemedView>
                    <ThemedView
                      style={[
                        styles.titleDivider,
                        {
                          backgroundColor: tintColor + '30',
                        },
                      ]}
                    />
                  </ThemedView>
                )}
                <TextInput
                  ref={textInputRef}
                  placeholder={showTitleSeparated ? "Escreva sua nota aqui..." : "Título da nota"}
                  placeholderTextColor={textColor + '60'}
                  value={inputValue}
                  onChangeText={(newText) => {
                    if (showTitleSeparated) {
                      const cleanTitle = getCleanText(title);
                      if (newText.startsWith(cleanTitle)) {
                        newText = newText.substring(cleanTitle.length).replace(/^\n+/, '');
                      }
                      const updatedText = cleanTitle + '\n' + newText;
                      setText(updatedText);
                      if (isEditing && note) {
                        autoSave(updatedText);
                      }
                    } else if (hasTitle && !hasRealContent) {
                      const cleanTitle = getCleanText(title);
                      if (newText.length < cleanTitle.length) {
                        setText(newText);
                        if (isEditing && note) {
                          autoSave(newText);
                        }
                      } else if (newText.length > cleanTitle.length) {
                        const newContent = newText.substring(cleanTitle.length).replace(/^\n+/, '');
                        const updatedText = cleanTitle + '\n' + newContent;
                        setText(updatedText);
                        if (isEditing && note) {
                          autoSave(updatedText);
                        }
                      }
                    } else {
                      setText(newText);
                      if (isEditing && note) {
                        autoSave(newText);
                      }
                    }
                  }}
                  onSelectionChange={(e) => {
                    const selection = e.nativeEvent.selection;
                    if (showTitleSeparated) {
                      const titleLength = getCleanText(title).length + 1;
                      selectionRef.current = {
                        start: selection.start + titleLength,
                        end: selection.end + titleLength,
                      };
                    } else {
                      selectionRef.current = selection;
                    }
                  }}
                  style={[
                    styles.unifiedInput,
                    {
                      color: textColor,
                      backgroundColor: backgroundColor,
                      fontSize: showTitleSeparated ? 17 : 23,
                      fontWeight: showTitleSeparated ? '400' : '700',
                      lineHeight: showTitleSeparated ? 24 : 32,
                      marginTop: showTitleSeparated ? 12 : 0,
                    },
                  ]}
                  multiline
                  textAlignVertical="top"
                  autoFocus={!hasTitle}
                  scrollEnabled={false}
                />
              </ThemedView>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: 8,
    minWidth: 60,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  editButton: {
    padding: 8,
    minWidth: 60,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  viewContent: {
    flex: 1,
    padding: 0,
    margin: 0,
    minHeight: 400,
    letterSpacing: -0.2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  titleContainer: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '700',
  },
  titleTextInput: {
    fontSize: 23,
    fontWeight: '700',
    padding: 0,
    margin: 0,
    flex: 1,
  },
  editTitleButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveTitleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  titleDivider: {
    height: 1.5,
    width: '100%',
    borderRadius: 0.75,
    marginTop: 8,
    opacity: 0.3,
  },
  unifiedInput: {
    flex: 1,
    padding: 0,
    margin: 0,
    minHeight: 400,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
});

