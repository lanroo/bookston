import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { PointsService } from '@/services/points.service';
import type { UserPoints } from '@/types';
import { logger } from '@/utils/logger';

interface PointsDisplayProps {
  userId?: string;
  compact?: boolean;
  showLevel?: boolean;
  refreshKey?: number | string;
}

export function PointsDisplay({ userId, compact = false, showLevel = true, refreshKey }: PointsDisplayProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const [points, setPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    const loadPoints = async () => {
      try {
        const data = await PointsService.getUserPoints(targetUserId);
        setPoints(data);
      } catch (error) {
        logger.error('Error loading points', error);
      } finally {
        setLoading(false);
      }
    };

    loadPoints();
  }, [targetUserId, refreshKey]);

  const displayPoints = points || {
    userId: targetUserId || '',
    totalPoints: 0,
    pointsFromPosts: 0,
    pointsFromLikes: 0,
    pointsFromComments: 0,
    level: 1,
    updatedAt: new Date().toISOString(),
  };

  if (loading && !points) {
    if (compact) {
      return (
        <View style={styles.compactContainer}>
          <Ionicons name="trophy" size={16} color={tintColor} style={{ opacity: 0.5 }} />
          <ThemedText style={[styles.compactPoints, { color: textColor, opacity: 0.5 }]}>
            ...
          </ThemedText>
        </View>
      );
    }
  }

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Ionicons name="trophy" size={16} color={tintColor} style={{ opacity: loading ? 0.5 : 1 }} />
        <ThemedText style={[styles.compactPoints, { color: textColor, opacity: loading ? 0.5 : 1 }]}>
          {displayPoints.totalPoints} pts
        </ThemedText>
        {showLevel && !loading && (
          <>
            <ThemedText style={[styles.compactSeparator, { color: textColor, opacity: 0.3 }]}>
              •
            </ThemedText>
            <ThemedText style={[styles.compactLevel, { color: tintColor }]}>
              Nv. {displayPoints.level}
            </ThemedText>
          </>
        )}
      </View>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor, borderColor: textColor + '10' }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: tintColor + '20' }]}>
          <Ionicons name="trophy" size={24} color={tintColor} />
        </View>
        <View style={styles.pointsInfo}>
          <ThemedText style={[styles.totalPoints, { color: textColor, opacity: loading ? 0.5 : 1 }]}>
            {displayPoints.totalPoints.toLocaleString()} pontos
          </ThemedText>
          {showLevel && (
            <ThemedText style={[styles.level, { color: tintColor }]}>
              Nível {displayPoints.level}
            </ThemedText>
          )}
        </View>
      </View>
      <View style={styles.breakdown}>
        <View style={styles.breakdownItem}>
          <Ionicons name="create-outline" size={16} color={textColor} style={{ opacity: 0.6 }} />
          <ThemedText style={[styles.breakdownLabel, { color: textColor, opacity: 0.7 }]}>
            Resenhas
          </ThemedText>
          <ThemedText style={[styles.breakdownValue, { color: textColor }]}>
            {displayPoints.pointsFromPosts}
          </ThemedText>
        </View>
        <View style={styles.breakdownItem}>
          <Ionicons name="heart-outline" size={16} color={textColor} style={{ opacity: 0.6 }} />
          <ThemedText style={[styles.breakdownLabel, { color: textColor, opacity: 0.7 }]}>
            Curtidas
          </ThemedText>
          <ThemedText style={[styles.breakdownValue, { color: textColor }]}>
            {displayPoints.pointsFromLikes}
          </ThemedText>
        </View>
        <View style={styles.breakdownItem}>
          <Ionicons name="chatbubble-outline" size={16} color={textColor} style={{ opacity: 0.6 }} />
          <ThemedText style={[styles.breakdownLabel, { color: textColor, opacity: 0.7 }]}>
            Comentários
          </ThemedText>
          <ThemedText style={[styles.breakdownValue, { color: textColor }]}>
            {displayPoints.pointsFromComments}
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsInfo: {
    flex: 1,
  },
  totalPoints: {
    fontSize: 20,
    fontWeight: '700',
  },
  level: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  breakdown: {
    gap: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 14,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactPoints: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  compactSeparator: {
    fontSize: 12,
    opacity: 0.4,
  },
  compactLevel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});

