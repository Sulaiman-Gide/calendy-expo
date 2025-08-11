import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { useFonts } from "expo-font";
import * as Linking from 'expo-linking';
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  
  // Handle deep links in development
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      console.log('Handling deep link:', event.url);
      // Handle the deep link URL as needed
      // The deepLinking.ts will handle most of this, but we log it here for debugging
    };

    // Listen for deep links when the app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if the app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('App opened with URL:', url);
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const checkAuthAndOnboarding = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentSegment = segments[0];
      
      if (!session) {
        // If no session and not in auth or onboarding, go to sign-in
        if (currentSegment !== '(auth)' && currentSegment !== '(onboarding)') {
          router.replace("/(auth)/sign-in");
        }
        return;
      }
      
      // If we have a session, check onboarding status
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", session.user.id)
        .single();
      
      // Only redirect if we're not already on the correct screen
      if (profile?.onboarded && currentSegment !== '(tabs)') {
        console.log("Navigating to tabs");
        router.replace("/(tabs)");
      } else if (!profile?.onboarded && currentSegment !== '(onboarding)') {
        console.log("Navigating to onboarding");
        router.replace("/(onboarding)/onboarding");
      }
    };
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        await checkAuthAndOnboarding();
      }
    );
    
    // Initial check
    checkAuthAndOnboarding();
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [segments]);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: "bold",
          color: colors.text,
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          statusBarStyle: isDark ? "light" : "dark",
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="(auth)"
        options={{
          headerShown: false,
          statusBarStyle: isDark ? "light" : "dark",
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          headerShown: false,
          statusBarStyle: isDark ? "light" : "dark",
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="+not-found"
        options={{
          title: "Not Found",
          statusBarStyle: isDark ? "light" : "dark",
        }}
      />
    </Stack>
  );
}

function StatusBarWrapper() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return <StatusBar />;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
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
