// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { loadTokenAndUser } from './api'; // adjust path if needed

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { token } = await loadTokenAndUser();
        if (!mounted) return;
        setLoggedIn(Boolean(token));
      } catch (err) {
        if (!mounted) return;
        setLoggedIn(false);
      } finally {
        if (!mounted) return;
        setChecking(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // while we check secure storage, show a centered spinner to avoid flashing tabs/login
  if (checking) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }}>
          <ActivityIndicator size="large" />
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </View>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {loggedIn ? (
          // user is logged in -> go straight to tabs
          <Stack.Screen name="(tabs)" />
        ) : (
          // not logged in -> show index (your index.tsx which renders login)
          <Stack.Screen name="index" />
        )}

        {/* keep modal available */}
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>

      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
