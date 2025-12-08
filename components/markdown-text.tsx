import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import { StyleSheet } from 'react-native';

interface MarkdownTextProps {
  content: string;
  numberOfLines?: number;
  style?: any;
}

export function MarkdownText({ content, numberOfLines, style }: MarkdownTextProps) {
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const renderMarkdown = (text: string) => {
    if (!text) return null;

    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      if (line.startsWith('# ')) {
        elements.push(
          <ThemedText
            key={index}
            style={[styles.heading, { color: textColor }]}
            numberOfLines={numberOfLines}>
            {line.replace(/^# /, '')}
          </ThemedText>
        );
        return;
      }

      if (line.startsWith('> ')) {
        elements.push(
          <ThemedView
            key={index}
            style={[styles.quote, { borderLeftColor: tintColor + '40', backgroundColor: tintColor + '08' }]}>
            <ThemedText style={[styles.quoteText, { color: textColor, opacity: 0.8 }]}>
              {line.replace(/^> /, '')}
            </ThemedText>
          </ThemedView>
        );
        return;
      }

      if (line.startsWith('- ')) {
        elements.push(
          <ThemedView key={index} style={styles.listItem}>
            <ThemedText style={[styles.bullet, { color: tintColor }]}>•</ThemedText>
            <ThemedText style={[styles.listText, { color: textColor }]} numberOfLines={numberOfLines}>
              {line.replace(/^- /, '')}
            </ThemedText>
          </ThemedView>
        );
        return;
      }

      const numberedMatch = line.match(/^(\d+)\.\s(.+)$/);
      if (numberedMatch) {
        elements.push(
          <ThemedView key={index} style={styles.listItem}>
            <ThemedText style={[styles.number, { color: tintColor }]}>{numberedMatch[1]}.</ThemedText>
            <ThemedText style={[styles.listText, { color: textColor }]} numberOfLines={numberOfLines}>
              {numberedMatch[2]}
            </ThemedText>
          </ThemedView>
        );
        return;
      }

      let cleanLine = line
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

      if (cleanLine.trim()) {
        elements.push(
          <ThemedText key={index} style={style} numberOfLines={numberOfLines}>
            {cleanLine}
          </ThemedText>
        );
      } else if (!line.trim()) {
        elements.push(<ThemedText key={index}>{'\n'}</ThemedText>);
      }
    });

    return elements;
  };

  return <ThemedView style={styles.container}>{renderMarkdown(content)}</ThemedView>;
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
    overflow: 'hidden',
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  quote: {
    paddingLeft: 12,
    paddingVertical: 8,
    borderLeftWidth: 3,
    marginVertical: 4,
    borderRadius: 4,
  },
  quoteText: {
    fontSize: 15,
    fontStyle: 'italic',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
    gap: 8,
  },
  bullet: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  number: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
    minWidth: 20,
  },
  listText: {
    flex: 1,
    fontSize: 15,
  },
  code: {
    fontSize: 14,
    fontFamily: 'monospace',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inlineCode: {
    fontSize: 15,
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  link: {
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});

