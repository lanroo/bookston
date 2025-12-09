import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EditProfileModal } from '@/components/profile/edit-profile-modal';
import { SignOutButton } from '@/components/settings';
import { PointsDisplay } from '@/components/social';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { supabase } from '@/lib/supabase';
import { BooksService } from '@/services/books.service';
import { NotesService } from '@/services/notes.service';
import type { Book } from '@/types';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const { user } = useAuth();

  const [notes, setNotes] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [pointsRefreshKey, setPointsRefreshKey] = useState(0);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [userName, setUserName] = useState(user?.user_metadata?.name || 'Usuário');
  const [userUsername, setUserUsername] = useState(user?.user_metadata?.username || '');

  const userEmail = user?.email || '';

  useEffect(() => {
    if (user) {
      setUserName(user.user_metadata?.name || 'Usuário');
      setUserUsername(user.user_metadata?.username || '');
    }
  }, [user]);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      const [notesData, foldersData, booksData] = await Promise.all([
        NotesService.getNotes(),
        NotesService.getFolders(),
        BooksService.getBooks(),
      ]);

      setNotes(notesData);
      setFolders(foldersData);
      setBooks(booksData);
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      setPointsRefreshKey((prev) => prev + 1);
    }, [loadData])
  );


  const handleProfileSave = async (name: string, username: string) => {
    setUserName(name);
    setUserUsername(username);
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
    if (updatedUser) {
      await supabase.auth.refreshSession();
    }
  };

  const menuItems = [
    {
      icon: 'person-outline',
      label: 'Editar Perfil',
      onPress: () => {
        setEditModalVisible(true);
      },
    },
    {
      icon: 'settings-outline',
      label: 'Configurações',
      onPress: () => {
        router.push('/(tabs)/settings');
      },
    },
    {
      icon: 'help-circle-outline',
      label: 'Ajuda',
      onPress: () => {
        console.log('Ajuda');
      },
    },
    {
      icon: 'information-circle-outline',
      label: 'Sobre',
      onPress: () => {
        console.log('Sobre');
      },
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Perfil
          </ThemedText>
          <ThemedView style={{ width: 40 }} />
        </ThemedView>

        <ThemedView style={styles.profileHeader}>
          <ThemedView style={[styles.avatarContainer, { backgroundColor: tintColor + '20' }]}>
            <Ionicons name="person" size={48} color={tintColor} />
          </ThemedView>
          <ThemedText type="title" style={styles.userName}>
            {userName}
          </ThemedText>
          {userUsername ? (
            <ThemedText style={[styles.userUsername, { color: tintColor }]}>
              @{userUsername}
            </ThemedText>
          ) : (
            <ThemedText style={[styles.userEmail, { opacity: 0.6 }]}>{userEmail}</ThemedText>
          )}
        </ThemedView>

        <ThemedView style={styles.pointsSection}>
          <PointsDisplay showLevel refreshKey={pointsRefreshKey} />
        </ThemedView>

        <ThemedView style={styles.statsContainer}>
          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statValue}>{notes.length}</ThemedText>
            <ThemedText style={[styles.statLabel, { opacity: 0.6 }]}>Notas</ThemedText>
          </ThemedView>
          <ThemedView style={[styles.statDivider, { backgroundColor: textColor + '20' }]} />
          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statValue}>{books.length}</ThemedText>
            <ThemedText style={[styles.statLabel, { opacity: 0.6 }]}>Livros</ThemedText>
          </ThemedView>
          <ThemedView style={[styles.statDivider, { backgroundColor: textColor + '20' }]} />
          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statValue}>{folders.length}</ThemedText>
            <ThemedText style={[styles.statLabel, { opacity: 0.6 }]}>Pastas</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: backgroundColor, borderColor: textColor + '10' }]}
              onPress={item.onPress}>
              <ThemedView style={styles.menuItemLeft}>
                <ThemedView style={[styles.menuIconContainer, { backgroundColor: tintColor + '15' }]}>
                  <Ionicons name={item.icon as any} size={20} color={tintColor} />
                </ThemedView>
                <ThemedText style={styles.menuItemLabel}>{item.label}</ThemedText>
              </ThemedView>
              <Ionicons name="chevron-forward" size={20} color={textColor} style={{ opacity: 0.3 }} />
            </TouchableOpacity>
          ))}
        </ThemedView>

        <ThemedView style={styles.signOutSection}>
          <SignOutButton style={styles.signOutButton} />
        </ThemedView>

        <ThemedView style={styles.versionContainer}>
          <ThemedText style={[styles.versionText, { opacity: 0.4 }]}>Versão 1.0.0</ThemedText>
        </ThemedView>
      </ScrollView>

      <EditProfileModal
        visible={editModalVisible}
        currentName={userName}
        currentUsername={userUsername}
        onClose={() => setEditModalVisible(false)}
        onSave={handleProfileSave}
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pointsSection: {
    marginBottom: 24,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    marginBottom: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  menuSection: {
    marginBottom: 24,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  signOutSection: {
    marginBottom: 24,
  },
  signOutButton: {
    marginBottom: 0,
  },
  versionContainer: {
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
  },
});

