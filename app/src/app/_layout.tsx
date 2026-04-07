import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Tabs, usePathname } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const hideTabBar = pathname === '/welcome';
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Tabs
        initialRouteName="welcome"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#1F4E94',
          tabBarInactiveTintColor: '#667085',
          tabBarStyle: {
            display: hideTabBar ? 'none' : 'flex',
            backgroundColor: '#FFFFFF',
            borderTopColor: '#DCE5EE',
            height: 62,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '700',
          },
        }}>
        <Tabs.Screen name="welcome" options={{ href: null }} />
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="track" options={{ title: 'Track' }} />
        <Tabs.Screen name="label-scan" options={{ title: 'Label' }} />
        <Tabs.Screen name="recipe" options={{ title: 'Recipe' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </ThemeProvider>
  );
}
