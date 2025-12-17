import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import React, { useEffect } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, View } from 'react-native';

interface SplashScreenProps {
  appName?: string;
}

export const SplashScreen = React.memo(function SplashScreen({ 
  appName = 'My App' 
}: SplashScreenProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.logoCircle,
              {
                backgroundColor: tintColor + '20',
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <View style={[styles.logoInner, { backgroundColor: tintColor }]}>
            <ThemedText type="title" style={[styles.logoText, { color: '#FFFFFF' }]}>
              📚
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.appNameContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <ThemedText type="title" style={[styles.appName, { color: textColor }]}>
            {appName}
          </ThemedText>
        </Animated.View>

        <Animated.View
          style={[
            styles.loadingContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <ActivityIndicator 
            size="large" 
            color={tintColor} 
            style={styles.spinner}
          />
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <ThemedText style={[styles.footerText, { color: textColor, opacity: 0.5 }]}>
          Carregando...
        </ThemedText>
      </Animated.View>
    </ThemedView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
  },
  logoCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.3,
  },
  logoInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
  },
  appNameContainer: {
    marginTop: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
