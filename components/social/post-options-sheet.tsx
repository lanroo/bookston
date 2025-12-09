import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Post } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PostOptionsSheetProps {
  visible: boolean;
  post: Post | null;
  onClose: () => void;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
}

export function PostOptionsSheet({
  visible,
  post,
  onClose,
  onEdit,
  onDelete,
}: PostOptionsSheetProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const separatorColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
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

  if (!post) return null;

  const options = [
    {
      id: 'edit',
      label: 'Editar Resenha',
      icon: 'create-outline' as const,
      onPress: () => {
        onClose();
        onEdit(post);
      },
      color: textColor,
      iconColor: tintColor,
    },
    {
      id: 'delete',
      label: 'Excluir Resenha',
      icon: 'trash-outline' as const,
      onPress: () => {
        onClose();
        onDelete(post);
      },
      color: '#ff3b30',
      iconColor: '#ff3b30',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
            },
          ]}
        />
        <Pressable style={styles.backdropPressable} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor,
              transform: [{ translateY }],
            },
          ]}
          {...sheetPanResponder.panHandlers}>
          <View style={styles.dragArea} {...dragPanResponder.panHandlers} />

          <View style={styles.optionsContainer}>
            {options.map((option, index) => (
              <View key={option.id}>
                <Pressable
                  style={({ pressed }) => [
                    styles.option,
                    pressed && (option.id === 'delete' ? styles.deleteOptionPressed : styles.optionPressed),
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
                    style={[styles.chevron, { opacity: 0.3 }]}
                  />
                </Pressable>
                {index < options.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: separatorColor }]} />
                )}
              </View>
            ))}
          </View>

          <View style={styles.bottomSpacing} />

          <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea} />
        </Animated.View>
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
    backgroundColor: '#000',
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  dragArea: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 4,
    gap: 16,
    borderRadius: 12,
  },
  optionPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  deleteOptionPressed: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56,
    marginVertical: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  deleteLabel: {
    color: '#ff3b30',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 8,
  },
  chevron: {
    marginLeft: 'auto',
  },
  bottomSafeArea: {
    height: 0,
  },
});

