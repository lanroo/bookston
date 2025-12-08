import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { NotesService } from '@/services/notes.service';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const { user, signOut } = useAuth();

  const [notes, setNotes] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userName = user?.user_metadata?.name || 'Usuário';
  const userEmail = user?.email || '';

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
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSignOut = async () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: 'person-outline',
      label: 'Editar Perfil',
      onPress: () => {
        console.log('Editar perfil');
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
          <ThemedText style={[styles.userEmail, { opacity: 0.6 }]}>{userEmail}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.statsContainer}>
          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statValue}>{notes.length}</ThemedText>
            <ThemedText style={[styles.statLabel, { opacity: 0.6 }]}>Notas</ThemedText>
          </ThemedView>
          <ThemedView style={[styles.statDivider, { backgroundColor: textColor + '20' }]} />
          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statValue}>0</ThemedText>
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

        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: backgroundColor, borderColor: '#ff3b30' + '30' }]}
          onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#ff3b30" />
          <ThemedText style={[styles.signOutText, { color: '#ff3b30' }]}>Sair da Conta</ThemedText>
        </TouchableOpacity>

        <ThemedView style={styles.versionContainer}>
          <ThemedText style={[styles.versionText, { opacity: 0.4 }]}>Versão 1.0.0</ThemedText>
        </ThemedView>
      </ScrollView>
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
    marginBottom: 32,
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
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
    marginBottom: 24,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
  },
});

