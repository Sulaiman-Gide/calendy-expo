import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { useFonts } from "expo-font";
import * as Linking from "expo-linking";
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
      console.log("Handling deep link:", event.url);
      // Handle the deep link URL as needed
      // The deepLinking.ts will handle most of this, but we log it here for debugging
    };

    // Listen for deep links when the app is running
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Check if the app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("App opened with URL:", url);
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
      try {
        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting session:", sessionError);
          return;
        }

        const currentSegment = segments[0];
        console.log("Current segment:", currentSegment);
        console.log("Session exists:", !!session);

        // If no session, only allow auth or onboarding screens
        if (!session) {
          if (
            currentSegment !== "(auth)" &&
            currentSegment !== "(onboarding)"
          ) {
            console.log("No session, redirecting to sign-in");
            router.replace("/(auth)/sign-in");
          }
          return;
        }

        // If we have a session, check onboarding status
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("onboarded")
          .eq("id", session.user.id)
          .single();

        if (profileError) {
          console.log("Error getting profile:", profileError);
          return;
        }

        console.log("Profile onboarded status:", profile?.onboarded);

        if (currentSegment === "(onboarding)" && profile?.onboarded) {
          console.log("Already onboarded, redirecting to tabs");
          router.replace("/(tabs)");
          return;
        }

        if (!profile?.onboarded && currentSegment !== "(onboarding)") {
          console.log("Not onboarded, redirecting to onboarding");
          router.replace("/(onboarding)/onboarding");
          return;
        }

        // If user is onboarded and not on tabs, redirect to tabs
        if (profile?.onboarded && currentSegment !== "(tabs)") {
          console.log("Onboarded, redirecting to tabs");
          router.replace("/(tabs)");
          return;
        }
      } catch (error) {
        console.error("Error in auth check:", error);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      await checkAuthAndOnboarding();
    });

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
        headerShown: false,
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
        name="(onboarding)"
        options={{
          headerShown: false,
          animation: "fade",
          animationDuration: 200,
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
