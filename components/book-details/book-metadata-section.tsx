import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface GoogleBookDetails {
  volumeInfo: {
    publishedDate?: string;
    pageCount?: number;
    publisher?: string;
    language?: string;
    categories?: string[];
  };
}

interface BookMetadataSectionProps {
  bookDetails: GoogleBookDetails | null;
  textColor: string;
}

export function BookMetadataSection({ bookDetails, textColor }: BookMetadataSectionProps) {
  if (!bookDetails?.volumeInfo) return null;

  const { publishedDate, pageCount, publisher, language, categories } = bookDetails.volumeInfo;

  return (
    <ThemedView style={styles.section}>
      <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
        Informações
      </ThemedText>
      <ThemedView style={styles.metadataGrid}>
        {publishedDate && (
          <ThemedView style={[styles.metadataCard, { borderLeftColor: '#FFB6C1' }]}>
            <ThemedView style={[styles.metadataIconContainer, { backgroundColor: '#FFB6C1' + '20' }]}>
              <Ionicons name="calendar" size={18} color="#FFB6C1" />
            </ThemedView>
            <View style={styles.metadataTextContainer}>
              <ThemedText style={[styles.metadataLabel, { color: textColor + '60' }]}>
                Publicado
              </ThemedText>
              <ThemedText style={[styles.metadataValue, { color: textColor }]}>
                {new Date(publishedDate).getFullYear()}
              </ThemedText>
            </View>
          </ThemedView>
        )}

        {pageCount && (
          <ThemedView style={[styles.metadataCard, { borderLeftColor: '#B19CD9' }]}>
            <ThemedView style={[styles.metadataIconContainer, { backgroundColor: '#B19CD9' + '20' }]}>
              <Ionicons name="document-text" size={18} color="#B19CD9" />
            </ThemedView>
            <View style={styles.metadataTextContainer}>
              <ThemedText style={[styles.metadataLabel, { color: textColor + '60' }]}>
                Páginas
              </ThemedText>
              <ThemedText style={[styles.metadataValue, { color: textColor }]}>
                {pageCount}
              </ThemedText>
            </View>
          </ThemedView>
        )}

        {publisher && (
          <ThemedView style={[styles.metadataCard, { borderLeftColor: '#A8D5E2' }]}>
            <ThemedView style={[styles.metadataIconContainer, { backgroundColor: '#A8D5E2' + '20' }]}>
              <Ionicons name="business" size={18} color="#A8D5E2" />
            </ThemedView>
            <View style={styles.metadataTextContainer}>
              <ThemedText style={[styles.metadataLabel, { color: textColor + '60' }]}>
                Editora
              </ThemedText>
              <ThemedText style={[styles.metadataValue, { color: textColor }]} numberOfLines={1}>
                {publisher}
              </ThemedText>
            </View>
          </ThemedView>
        )}

        {language && (
          <ThemedView style={[styles.metadataCard, { borderLeftColor: '#9B7BB8' }]}>
            <ThemedView style={[styles.metadataIconContainer, { backgroundColor: '#9B7BB8' + '20' }]}>
              <Ionicons name="language" size={18} color="#9B7BB8" />
            </ThemedView>
            <View style={styles.metadataTextContainer}>
              <ThemedText style={[styles.metadataLabel, { color: textColor + '60' }]}>
                Idioma
              </ThemedText>
              <ThemedText style={[styles.metadataValue, { color: textColor }]}>
                {language.toUpperCase()}
              </ThemedText>
            </View>
          </ThemedView>
        )}
      </ThemedView>

      {categories && categories.length > 0 && (
        <ThemedView style={styles.categoriesSection}>
          <ThemedText style={[styles.categoriesTitle, { color: textColor }]}>
            Categorias
          </ThemedText>
          <ThemedView style={styles.categoriesContainer}>
            {categories.slice(0, 6).map((category, index) => {
              const colors = [
                { bg: '#C8A2C8', text: '#fff' },
                { bg: '#B19CD9', text: '#fff' },
                { bg: '#B19CD9', text: '#fff' },
                { bg: '#F38181', text: '#fff' },
                { bg: '#AA96DA', text: '#fff' },
                { bg: '#FCBAD3', text: '#2C3E50' },
              ];
              const color = colors[index % colors.length];
              return (
                <ThemedView
                  key={index}
                  style={[styles.categoryTag, { backgroundColor: color.bg }]}>
                  <ThemedText style={[styles.categoryText, { color: color.text }]}>
                    {category}
                  </ThemedText>
                </ThemedView>
              );
            })}
          </ThemedView>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  metadataCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderLeftWidth: 4,
    width: '48%',
    minHeight: 64,
  },
  metadataIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  metadataTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  metadataLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  categoriesSection: {
    marginTop: 4,
  },
  categoriesTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

