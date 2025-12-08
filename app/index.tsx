import { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }
  }, [session, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href="/login" />;
}

