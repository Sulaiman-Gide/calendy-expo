import { useFonts } from 'expo-font';
import { Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';

function RootLayoutNav() {
  const segments = useSegments();
  const { colors } = useTheme();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const inAuthGroup = segments[0] === '(auth)';
      
      if (!session && !inAuthGroup) {
        // Redirect to the sign-in page if not authenticated
        // and not already in the auth group
        // router.replace('/(auth)/sign-in');
      } else if (session && inAuthGroup) {
        // Redirect to the home page if authenticated
        // and in the auth group
        // router.replace('/(tabs)');
      }
    });

    return () => subscription.unsubscribe();
  }, [segments]);

  return (
    <Stack screenOptions={{
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTintColor: colors.text,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

function StatusBarWrapper() {
  const { colors } = useTheme();
  return <StatusBar style={colors.text === '#f5f5f5' ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootLayoutNav />
      <StatusBarWrapper />
    </ThemeProvider>
  );
}
