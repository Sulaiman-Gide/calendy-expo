import { HapticTab } from "@/components/HapticTab";
import { Colors } from "@/constants/Colors";
import { ThemeProvider } from "@/context/ThemeContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { supabase } from "@/lib/supabase";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Image, Platform, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/(auth)/sign-in");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.replace("/(auth)/sign-in");
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <ThemeProvider>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: Colors[colorScheme ?? "light"].background,
        }}
      >
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        />
        <View
          style={{
            flex: 1,
            paddingHorizontal: 16,
            position: "relative",
          }}
        >
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
              tabBarInactiveTintColor:
                Colors[colorScheme ?? "light"].tabIconDefault,
              tabBarButton: HapticTab,
              tabBarStyle: {
                borderTopWidth: 0,
                backgroundColor: Colors[colorScheme ?? "light"].background,
                position: "absolute",
                left: 20,
                right: 20,
                bottom: 20,
                elevation: 3,
                borderWidth: 1,
                borderColor: Colors[colorScheme ?? "light"].border,
                height: Platform.OS === "ios" ? 80 : 70,
                borderRadius: 15,
                paddingHorizontal: 10,
                shadowColor: "#00000050",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              },
              tabBarLabelStyle: {
                fontSize: 13,
                fontWeight: "600",
              },
              tabBarItemStyle: {
                paddingVertical: 8,
              },
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: "Calendar",
                tabBarIcon: ({ color, focused }) => (
                  <View
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 4,
                    }}
                  >
                    <Image
                      source={
                        colorScheme === "dark"
                          ? require("@/assets/images/home-light.png")
                          : require("@/assets/images/home-black.png")
                      }
                      style={{
                        width: 22,
                        height: 22,
                        tintColor: color,
                        opacity: focused ? 1 : 0.6,
                        marginBottom: 10,
                      }}
                      resizeMode="contain"
                    />
                  </View>
                ),
              }}
            />
            <Tabs.Screen
              name="upcoming"
              options={{
                title: "Upcoming",
                tabBarIcon: ({ color, focused }) => (
                  <View
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 4,
                    }}
                  >
                    <Image
                      source={
                        colorScheme === "dark"
                          ? require("@/assets/images/upcomming-light.png")
                          : require("@/assets/images/upcomming-black.png")
                      }
                      style={{
                        width: 22,
                        height: 22,
                        tintColor: color,
                        opacity: focused ? 1 : 0.6,
                        marginBottom: 10,
                      }}
                      resizeMode="contain"
                    />
                  </View>
                ),
              }}
            />
            <Tabs.Screen
              name="profile/index"
              options={{
                title: 'Profile',
                tabBarIcon: ({ color, focused }) => (
                  <View style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 4,
                  }}>
                    <Image
                      source={colorScheme === 'dark' 
                        ? require('@/assets/images/profile-light.png')
                        : require('@/assets/images/profile-black.png')
                      }
                      style={{
                        width: 24,
                        height: 24,
                        tintColor: color,
                        opacity: focused ? 1 : 0.6,
                        marginBottom: 9,
                      }}
                      resizeMode="contain"
                    />
                  </View>
                ),
              }}
            />
            <Tabs.Screen
              name="profile/edit"
              options={{
                href: null,
                title: 'Edit Profile',
              }}
            />
            <Tabs.Screen
              name="profile/settings"
              options={{
                href: null,
                title: 'Settings',
              }}
            />
          </Tabs>
        </View>
      </SafeAreaView>
    </ThemeProvider>
  );
}
