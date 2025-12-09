import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FeedSection, GenreButtons, type FeedPost as FeedPostType, type Genre } from '@/components/home';
import { useTabBarPadding } from '@/components/tab-bar';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function HomeScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const { user } = useAuth();
  const tabBarPadding = useTabBarPadding();

  const [feedPosts, setFeedPosts] = useState<FeedPostType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGenreId, setSelectedGenreId] = useState<string | undefined>();

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';

  // TODO: Implementar carregamento de posts do feed
  const loadFeedPosts = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Mock data por enquanto - será substituído pela API real
      const mockPosts: FeedPostType[] = [
        {
          id: '1',
          userId: 'user1',
          userName: 'Maria Silva',
          bookTitle: 'O Hobbit',
          bookAuthor: 'J.R.R. Tolkien',
          content: 'Acabei de terminar e estou apaixonada! A jornada de Bilbo é incrível. Recomendo muito para quem gosta de fantasia.',
          rating: 5,
          createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
          likes: 12,
          comments: 3,
          isLiked: false,
        },
        {
          id: '2',
          userId: 'user2',
          userName: 'João Santos',
          bookTitle: '1984',
          bookAuthor: 'George Orwell',
          content: 'Livro perturbador mas necessário. A distopia de Orwell continua muito relevante nos dias de hoje.',
          rating: 5,
          createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
          likes: 8,
          comments: 2,
          isLiked: true,
        },
      ];
      setFeedPosts(mockPosts);
    } catch (error: any) {
      console.error('Error loading feed posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadFeedPosts();
    }, [loadFeedPosts])
  );

  const handleGenrePress = (genre: Genre) => {
    // Toggle selection - se já está selecionado, deseleciona
    setSelectedGenreId(selectedGenreId === genre.id ? undefined : genre.id);
    // TODO: Implementar navegação para filtro por gênero
    console.log('Genre pressed:', genre);
  };

  const handlePostPress = (post: FeedPostType) => {
    // TODO: Implementar navegação para detalhes do post
    console.log('Post pressed:', post);
  };

  const handleLike = (post: FeedPostType) => {
    // TODO: Implementar like/unlike
    setFeedPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  const handleComment = (post: FeedPostType) => {
    // TODO: Implementar navegação para comentários
    console.log('Comment pressed:', post);
  };


  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.greeting}>Olá,</ThemedText>
          <ThemedText type="title" style={styles.userName}>
            {userName}
          </ThemedText>
        </View>
        <TouchableOpacity
          style={[styles.avatarContainer, { backgroundColor: tintColor + '20' }]}
          onPress={() => router.push('/profile')}>
          <Ionicons name="person" size={28} color={tintColor} />
        </TouchableOpacity>
      </View>

      <View style={styles.genresSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Explorar por Gênero
        </ThemedText>
        <GenreButtons selectedGenreId={selectedGenreId} onGenrePress={handleGenrePress} />
      </View>

      <View style={styles.feedSection}>
        <View style={styles.feedHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Feed
          </ThemedText>
          <TouchableOpacity onPress={() => router.push('/(tabs)/books?add=true')}>
            <Ionicons name="add-circle" size={28} color={tintColor} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.feedScroll}
          contentContainerStyle={[styles.feedContent, { paddingBottom: tabBarPadding }]}
          showsVerticalScrollIndicator={false}>
          <FeedSection
            posts={feedPosts}
            onPostPress={handlePostPress}
            onLike={handleLike}
            onComment={handleComment}
            isLoading={isLoading}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genresSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  feedSection: {
    flex: 1,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  feedScroll: {
    flex: 1,
  },
  feedContent: {
    paddingBottom: 20,
  },
});
