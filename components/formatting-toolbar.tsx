import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type FormatType =
  | 'bold'
  | 'italic'
  | 'code'
  | 'link'
  | 'bullet'
  | 'number'
  | 'quote'
  | 'heading'
  | 'increaseFont'
  | 'decreaseFont';

interface FormattingToolbarProps {
  onFormat: (type: FormatType, value?: string) => void;
  onFontSizeChange: (increase: boolean) => void;
  fontSize: number;
  minFontSize: number;
  maxFontSize: number;
}

export function FormattingToolbar({
  onFormat,
  onFontSizeChange,
  fontSize,
  minFontSize,
  maxFontSize,
}: FormattingToolbarProps) {
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const [showMenu, setShowMenu] = useState(false);
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);

  const handleFormat = (type: FormatType) => {
    if (type === 'link') {
      setShowLinkModal(true);
    } else {
      onFormat(type);
      setShowMenu(false);
    }
  };

  const handleInsertLink = () => {
    if (!linkText.trim()) {
      Alert.alert('Erro', 'Por favor, insira o texto do link.');
      return;
    }
    if (!linkUrl.trim()) {
      Alert.alert('Erro', 'Por favor, insira a URL do link.');
      return;
    }
    onFormat('link', `${linkText}|${linkUrl}`);
    setShowLinkModal(false);
    setLinkText('');
    setLinkUrl('');
    setShowMenu(false);
  };

  const formatButtons = [
    { type: 'bold' as FormatType, icon: 'remove', label: 'Negrito' },
    { type: 'italic' as FormatType, icon: 'text-outline', label: 'Itálico' },
    { type: 'code' as FormatType, icon: 'code', label: 'Código' },
    { type: 'heading' as FormatType, icon: 'pricetag', label: 'Título' },
    { type: 'quote' as FormatType, icon: 'chatbubble-outline', label: 'Citação' },
    { type: 'bullet' as FormatType, icon: 'list', label: 'Lista' },
    { type: 'number' as FormatType, icon: 'list-outline', label: 'Numerada' },
    { type: 'link' as FormatType, icon: 'link', label: 'Link' },
  ];

  return (
    <>
      <ThemedView
        style={[
          styles.toolbar,
          {
            backgroundColor: backgroundColor,
            borderTopColor: textColor + '10',
            borderBottomColor: textColor + '10',
          },
        ]}>
        {!showFontSizeMenu ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toolbarContent}>  
            <TouchableOpacity
              style={[styles.toolbarButton, { borderColor: textColor + '20' }]}
              onPress={() => setShowFontSizeMenu(true)}
              activeOpacity={0.7}>
              <ThemedText style={[styles.fontSizeButtonText, { color: textColor }]}>Aa</ThemedText>
            </TouchableOpacity>

            <View style={[styles.separator, { backgroundColor: textColor + '20' }]} />

            <TouchableOpacity
              style={[styles.toolbarButton, { borderColor: textColor + '20' }]}
              onPressIn={() => onFormat('code')}
              activeOpacity={0.7}>
              <Ionicons name="code" size={20} color={textColor} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolbarButton, { borderColor: textColor + '20' }]}
              onPressIn={() => onFormat('heading')}
              activeOpacity={0.7}>
              <Ionicons name="pricetag" size={20} color={textColor} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolbarButton, { borderColor: textColor + '20' }]}
              onPressIn={() => onFormat('quote')}
              activeOpacity={0.7}>
              <Ionicons name="chatbubble-outline" size={20} color={textColor} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolbarButton, { borderColor: textColor + '20' }]}
              onPressIn={() => onFormat('bullet')}
              activeOpacity={0.7}>
              <Ionicons name="list" size={20} color={textColor} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolbarButton, { borderColor: textColor + '20' }]}
              onPressIn={() => onFormat('number')}
              activeOpacity={0.7}>
              <Ionicons name="list-outline" size={20} color={textColor} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolbarButton, { borderColor: textColor + '20' }]}
              onPress={() => setShowMenu(true)}
              activeOpacity={0.7}>
              <Ionicons name="ellipsis-horizontal" size={20} color={textColor} />
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ThemedView style={styles.fontSizeMenuContainer}>
            <TouchableOpacity
              style={[styles.toolbarButton, { borderColor: textColor + '20' }]}
              onPress={() => setShowFontSizeMenu(false)}
              activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={20} color={textColor} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolbarButton,
                fontSize <= minFontSize && styles.toolbarButtonDisabled,
                { borderColor: textColor + '20' },
              ]}
              onPress={() => onFontSizeChange(false)}
              disabled={fontSize <= minFontSize}>
              <Ionicons
                name="remove-circle-outline"
                size={20}
                color={fontSize <= minFontSize ? textColor + '40' : textColor}
              />
            </TouchableOpacity>

            <ThemedView style={[styles.fontSizeDisplay, { borderColor: textColor + '20' }]}>
              <ThemedText style={[styles.fontSizeText, { color: tintColor }]}>{fontSize}</ThemedText>
            </ThemedView>

            <TouchableOpacity
              style={[
                styles.toolbarButton,
                fontSize >= maxFontSize && styles.toolbarButtonDisabled,
                { borderColor: textColor + '20' },
              ]}
              onPress={() => onFontSizeChange(true)}
              disabled={fontSize >= maxFontSize}>
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={fontSize >= maxFontSize ? textColor + '40' : textColor}
              />
            </TouchableOpacity>
          </ThemedView>
        )}
      </ThemedView>

      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}>
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}>
          <ThemedView
            style={[styles.menuContent, { backgroundColor: backgroundColor, borderColor: textColor + '20' }]}
            onStartShouldSetResponder={() => true}>
            <ThemedText type="subtitle" style={styles.menuTitle}>
              Formatação
            </ThemedText>
            <ScrollView style={styles.menuScroll}>
              {formatButtons.map((button) => (
                <TouchableOpacity
                  key={button.type}
                  style={[styles.menuItem, { borderColor: textColor + '10' }]}
                  onPress={() => handleFormat(button.type)}>
                  <Ionicons name={button.icon as keyof typeof Ionicons.glyphMap} size={22} color={tintColor} />
                  <ThemedText style={styles.menuItemText}>{button.label}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.menuCloseButton, { backgroundColor: tintColor + '15' }]}
              onPress={() => setShowMenu(false)}>
              <ThemedText style={[styles.menuCloseText, { color: tintColor }]}>Fechar</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </TouchableOpacity>
      </Modal>
              
      <Modal
        visible={showLinkModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLinkModal(false)}>
        <ThemedView style={[styles.linkModalOverlay, { backgroundColor: backgroundColor + 'F0' }]}>
          <ThemedView
            style={[styles.linkModalContent, { backgroundColor: backgroundColor, borderColor: textColor + '20' }]}>
            <ThemedText type="subtitle" style={styles.linkModalTitle}>
              Adicionar Link
            </ThemedText>

            <ThemedText style={[styles.linkModalLabel, { opacity: 0.7 }]}>Texto do Link</ThemedText>
            <TextInput
              style={[
                styles.linkInput,
                {
                  color: textColor,
                  backgroundColor: backgroundColor,
                  borderColor: textColor + '20',
                },
              ]}
              placeholder="Ex: Google"
              placeholderTextColor={textColor + '60'}
              value={linkText}
              onChangeText={setLinkText}
            />

            <ThemedText style={[styles.linkModalLabel, { opacity: 0.7, marginTop: 16 }]}>URL</ThemedText>
            <TextInput
              style={[
                styles.linkInput,
                {
                  color: textColor,
                  backgroundColor: backgroundColor,
                  borderColor: textColor + '20',
                },
              ]}
              placeholder="Ex: https://google.com"
              placeholderTextColor={textColor + '60'}
              value={linkUrl}
              onChangeText={setLinkUrl}
              keyboardType="url"
              autoCapitalize="none"
            />

            <ThemedView style={styles.linkModalButtons}>
              <TouchableOpacity
                style={[styles.linkModalButton, { borderColor: textColor + '30' }]}
                onPress={() => {
                  setShowLinkModal(false);
                  setLinkText('');
                  setLinkUrl('');
                }}>
                <ThemedText style={styles.linkModalButtonText}>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.linkModalButton, { backgroundColor: tintColor }]}
                onPress={handleInsertLink}>
                <ThemedText
                  style={[styles.linkModalButtonText, { color: colorScheme === 'dark' ? '#000' : '#fff' }]}>
                  Adicionar
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  toolbarContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
  },
  toolbarButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarButtonDisabled: {
    opacity: 0.4,
  },
  fontSizeDisplay: {
    minWidth: 40,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  fontSizeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    width: 1,
    height: 24,
    marginHorizontal: 4,
  },
  fontSizeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  fontSizeMenuContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  menuContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    maxHeight: '80%',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  menuScroll: {
    maxHeight: 400,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuCloseButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  menuCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
  linkModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  linkModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
  },
  linkModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  linkModalLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  linkInput: {
    fontSize: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  linkModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  linkModalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  linkModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

