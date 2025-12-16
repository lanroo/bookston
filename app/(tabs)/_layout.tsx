import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { TAB_SCREENS, useTabBarStyles } from '@/components/tab-bar';

export default function TabLayout() {
  const tabBarStyles = useTabBarStyles();

  return (
    <Tabs
      screenOptions={{
        ...tabBarStyles,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      {TAB_SCREENS.map((screen) => (
        <Tabs.Screen
          key={screen.name}
          name={screen.name}
          options={{
            title: screen.title,
            tabBarIcon: ({ color, size }) => screen.icon({ color, size }),
          }}
        />
      ))}
      {/* Hide notifications from tab bar */}
      <Tabs.Screen
        name="notifications"
        options={{
          href: null, // This hides it from the tab bar
        }}
      />
    </Tabs>
  );
}
