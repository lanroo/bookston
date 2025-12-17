import { SplashScreen } from '@/components/splash-screen';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect, useRouter } from 'expo-router';
import { useEffect } from 'react';

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
    return <SplashScreen appName="My Book App" />;
  }

  return <Redirect href="/login" />;
}

