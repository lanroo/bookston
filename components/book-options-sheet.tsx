import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Book, BookStatus } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, PanResponder, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
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
  const tintColor = useThemeColor({}, 'tint');
  const [pressedOption, setPressedOption] = useState<string | null>(null);
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

  const statusOptions: { id: BookStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'want-to-read', label: 'Quero Ler', icon: 'bookmark-outline' },
    { id: 'reading', label: 'Lendo', icon: 'book-outline' },
    { id: 'read', label: 'Já Li', icon: 'checkmark-circle-outline' },
    { id: 'rereading', label: 'Relendo', icon: 'refresh-outline' },
  ];

  const options: Array<{
    id: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    color: string;
    iconColor: string;
  }> = [
    ...statusOptions
      .filter((status) => status.id !== book.status)
      .map((status) => ({
        id: `status-${status.id}`,
        label: `Mover para "${status.label}"`,
        icon: status.icon,
        onPress: () => {
          onClose();
          onUpdateStatus(book, status.id);
        },
        color: textColor,
        iconColor: tintColor,
      })),
    {
      id: 'delete',
      label: 'Deletar',
      icon: 'trash-outline',
      onPress: () => {
        onClose();
        onDelete(book);
      },
      color: '#ff3b30',
      iconColor: '#ff3b30',
    },
  ];

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

            <View style={styles.optionsContainer}>
              {options.map((option, index) => (
                <Pressable
                  key={option.id}
                  style={({ pressed }) => [
                    styles.option,
                    index === options.length - 1 && styles.lastOption,
                    pressed && styles.optionPressed,
                  ]}
                  onPress={option.onPress}
                  onPressIn={() => setPressedOption(option.id)}
                  onPressOut={() => setPressedOption(null)}>
                  <View style={[styles.iconContainer, { backgroundColor: option.iconColor + '15' }]}>
                    <Ionicons 
                      name={option.icon} 
                      size={22} 
                      color={option.iconColor} 
                    />
                  </View>
                  <ThemedText 
                    style={[
                      styles.optionLabel,
                      { color: option.color },
                      option.id === 'delete' && styles.deleteLabel,
                    ]}>
                    {option.label}
                  </ThemedText>
                  <Ionicons 
                    name="chevron-forward" 
                    size={18} 
                    color={textColor} 
                    style={[styles.chevron, { opacity: 0.25 }]}
                  />
                </Pressable>
              ))}
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
    paddingBottom: 0,
    overflow: 'hidden',
  },
  handleArea: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
  },
  dragArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 1,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 14,
    borderBottomWidth: 0,
    minHeight: 64,
  },
  optionPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    letterSpacing: -0.2,
  },
  deleteLabel: {
    fontWeight: '600',
  },
  chevron: {
    marginLeft: 8,
  },
  bottomSafeArea: {
    minHeight: 0,
    paddingBottom: 8,
  },
});

