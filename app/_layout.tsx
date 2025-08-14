import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { initNotifications } from "@/utils/notifications";
import type { Session } from "@supabase/supabase-js";
import { Subscription } from "@supabase/supabase-js";
import { useFonts } from "expo-font";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import "react-native-reanimated";

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const themeContext = useTheme();
  const colors = themeContext?.colors || {};
  const theme = themeContext?.theme || "light";
  const isDark = theme === "dark";

  // Refs for notification listeners
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const authSubscription = useRef<{
    data: { subscription: Subscription };
  } | null>(null);

  // Handle deep links
  useEffect(() => {
    // Define the deep link handler with proper type
    const handleDeepLink = ({ url }: { url: string }) => {
      console.log("Handling deep link:", url);
      // Handle the deep link URL as needed
      // The deepLinking.ts will handle most of this, but we log it here for debugging
    };

    // Define the URL handler with proper type
    const handleUrl = (event: { url: string }) => {
      console.log("Handling URL:", event.url);
      handleDeepLink({ url: event.url });
    };

    // Store the subscription for cleanup with proper type
    const subscription = Linking.addEventListener(
      "url",
      (event: { url: string }) => {
        handleUrl({ url: event.url });
      }
    );

    // Check if the app was opened with a deep link
    const getInitialUrl = async (): Promise<void> => {
      try {
        const url = await Linking.getInitialURL();
        if (url) {
          console.log("App opened with URL:", url);
          handleDeepLink({ url });
        }
      } catch (error) {
        console.error("Error getting initial URL:", error);
      }
    };

    // Call the function to check for initial URL with proper error handling
    getInitialUrl().catch((error: Error) => {
      console.error("Error in getInitialUrl:", error);
    });

    // Return cleanup function
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // Initialize notifications when user is logged in
  useEffect(() => {
    const subscription = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        if (event === "SIGNED_IN" && session?.user) {
          await initNotifications(session.user.id);
        }
      }
    );

    authSubscription.current = subscription;

    // Set up notification listeners
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
      });

    // Define the notification response handler with proper types
    const handleNotificationResponse = (
      response: Notifications.NotificationResponse
    ) => {
      console.log("Notification response received:", response);
      const data = response.notification.request.content.data as {
        url?: string;
      };
      if (data?.url) {
        // Use the correct router method based on the URL type
        const { url } = data;
        if (url.startsWith("http") || url.startsWith("https")) {
          // Handle external URLs if needed
          router.push({ pathname: "/", params: { url } });
        } else {
          // Handle internal app navigation
          router.push(url as any); // Type assertion as a last resort
        }
      }
    };

    // Add the response listener with the typed handler
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse
      );

    // Clean up all listeners on unmount
    return () => {
      if (authSubscription.current) {
        authSubscription.current.data.subscription.unsubscribe();
      }
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
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
