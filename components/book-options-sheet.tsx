import { BookStatusButtons } from '@/components/book-status-buttons';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Book, BookStatus } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, PanResponder, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BookOptionsSheetProps {
  visible: boolean;
  book: Book | null;
  onClose: () => void;
  onUpdateStatus: (book: Book, status: BookStatus) => void;
  onDelete: (book: Book) => void;
}

export function BookOptionsSheet({
  visible,
  book,
  onClose,
  onUpdateStatus,
  onDelete,
}: BookOptionsSheetProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const translateY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0.5)).current;
  const isDragging = useRef(false);
  
  const dragPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        isDragging.current = true;
        const currentValue = (translateY as Animated.Value & { _value?: number })._value || 0;
        translateY.setOffset(currentValue);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
          const dragProgress = Math.min(gestureState.dy / 400, 1);
          const newOpacity = 0.5 * (1 - dragProgress * 0.7);
          backdropOpacity.setValue(newOpacity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        isDragging.current = false;
        translateY.flattenOffset();
        const shouldClose = gestureState.dy > 120 || (gestureState.vy > 0.25 && gestureState.dy > 50);
        
        if (shouldClose) {
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: 1000,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(onClose);
        } else {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 65,
              friction: 11,
            }),
            Animated.spring(backdropOpacity, {
              toValue: 0.5,
              useNativeDriver: true,
              tension: 65,
              friction: 11,
            }),
          ]).start();
        }
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        translateY.flattenOffset();
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }),
          Animated.spring(backdropOpacity, {
            toValue: 0.5,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }),
        ]).start();
      },
    })
  ).current;

  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 5;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        isDragging.current = true;
        const currentValue = (translateY as Animated.Value & { _value?: number })._value || 0;
        translateY.setOffset(currentValue);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
          const dragProgress = Math.min(gestureState.dy / 400, 1);
          const newOpacity = 0.5 * (1 - dragProgress * 0.7);
          backdropOpacity.setValue(newOpacity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        isDragging.current = false;
        translateY.flattenOffset();
        const shouldClose = gestureState.dy > 120 || (gestureState.vy > 0.25 && gestureState.dy > 50);
        
        if (shouldClose) {
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: 1000,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(onClose);
        } else {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 65,
              friction: 11,
            }),
            Animated.spring(backdropOpacity, {
              toValue: 0.5,
              useNativeDriver: true,
              tension: 65,
              friction: 11,
            }),
          ]).start();
        }
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        translateY.flattenOffset();
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }),
          Animated.spring(backdropOpacity, {
            toValue: 0.5,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }),
        ]).start();
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      backdropOpacity.setValue(0.5);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.spring(backdropOpacity, {
          toValue: 0.5,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
      ]).start();
    } else {
      translateY.setValue(0);
      backdropOpacity.setValue(0.5);
    }
  }, [visible, translateY, backdropOpacity]);

  if (!book) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
            },
          ]}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={onClose}
          />
        </Animated.View>
        <View style={styles.container}>
          <Animated.View
            style={[
              styles.sheet,
              { backgroundColor },
              {
                transform: [{ translateY }],
              },
            ]}
            {...sheetPanResponder.panHandlers}>
            <View style={styles.handleArea} {...dragPanResponder.panHandlers}>
              <View style={styles.handleContainer}>
                <View style={[styles.handle, { backgroundColor: textColor + '40' }]} />
              </View>
            </View>

            <View style={styles.dragArea} {...sheetPanResponder.panHandlers} />

            <View style={styles.content}>
              <BookStatusButtons
                currentStatus={book.status}
                onStatusChange={(status) => {
                  onClose();
                  onUpdateStatus(book, status);
                }}
                onClose={onClose}
              />

              <View style={styles.deleteSection}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    onClose();
                    onDelete(book);
                  }}
                  activeOpacity={0.6}>
                  <Ionicons name="trash-outline" size={22} color="#ff3b30" style={styles.deleteIcon} />
                  <ThemedText style={styles.deleteLabel}>
                    Deletar Livro
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea} />
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    paddingBottom: 0,
    overflow: 'hidden',
  },
  handleArea: {
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  dragArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 1,
  },
  content: {
    paddingBottom: 8,
  },
  deleteSection: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'transparent',
    minHeight: 50,
  },
  deleteIcon: {
    marginRight: 12,
    width: 24,
  },
  deleteLabel: {
    fontSize: 17,
    fontWeight: '400',
    color: '#ff3b30',
    letterSpacing: -0.4,
  },
  bottomSafeArea: {
    minHeight: 0,
    paddingBottom: 8,
  },
});

