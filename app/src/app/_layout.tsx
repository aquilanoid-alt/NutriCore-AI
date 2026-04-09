import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Tabs, usePathname } from 'expo-router';
import React from 'react';
import { Text, useColorScheme } from 'react-native';

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
            height: 68,
            paddingBottom: 9,
            paddingTop: 7,
          },
          tabBarItemStyle: {
            minWidth: 0,
            paddingHorizontal: 2,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
          },
        }}>
        <Tabs.Screen name="welcome" options={{ href: null }} />
        <Tabs.Screen
          name="index"
          options={{
            title: 'Beranda',
            tabBarIcon: ({ color }) => <TabEmoji color={color} symbol="⌂" />,
          }}
        />
        <Tabs.Screen
          name="track"
          options={{
            title: 'Track',
            tabBarIcon: ({ color }) => <TabEmoji color={color} symbol="≣" />,
          }}
        />
        <Tabs.Screen
          name="label-scan"
          options={{
            title: 'Label',
            tabBarIcon: ({ color }) => <TabEmoji color={color} symbol="▣" />,
          }}
        />
        <Tabs.Screen
          name="recipe"
          options={{
            title: 'Resep',
            tabBarIcon: ({ color }) => <TabEmoji color={color} symbol="◔" />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color }) => <TabEmoji color={color} symbol="◎" />,
          }}
        />
      </Tabs>
    </ThemeProvider>
  );
}

function TabEmoji({ color, symbol }: { color: string; symbol: string }) {
  return <Text style={{ color, fontSize: 17, fontWeight: '700', marginBottom: 1 }}>{symbol}</Text>;
}
