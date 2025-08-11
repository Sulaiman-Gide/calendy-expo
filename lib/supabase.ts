import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

// Create a custom AsyncStorage adapter for Supabase
const AsyncStorageAdapter = {
  getItem: async (key: string) => {
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    await AsyncStorage.removeItem(key);
  },
};

// Get Supabase URL and anon key from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Throw an error if Supabase URL or anon key is not set
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase URL or anon key. Please check your environment variables."
  );
}

// Get the redirect URL based on the platform
const getRedirectUrl = () => {
  if (Platform.OS === "web") {
    return "https://calendy.app/auth/callback";
  }
  return "calendy://auth/callback";
};

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorageAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
    debug: __DEV__,
  },
});

// Function to handle email confirmation
export const handleEmailConfirmation = async (url: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    type: "email",
    token_hash: url.split("token_hash=")[1],
  });

  if (error) throw error;
  return data;
};

// Helper function to get the current user
export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
