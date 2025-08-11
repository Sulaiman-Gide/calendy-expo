import { Link, router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import CustomToast from "../../components/CustomToast";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

const ThemedTextInput = ({ style, placeholder, ...props }: any) => {
  const { colors } = useTheme();
  return (
    <TextInput
      style={[
        styles.input,
        {
          color: colors.text,
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
      placeholder={placeholder}
      placeholderTextColor={colors.text + "80"}
      {...props}
    />
  );
};

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "info"
  );
  const { colors } = useTheme();

  const showToastMessage = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const hideToast = () => {
    setShowToast(false);
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      showToastMessage("Please enter both email and password", "error");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if email is confirmed
      if (data.user && !data.user.email_confirmed_at) {
        // Sign out the user if email is not confirmed
        await supabase.auth.signOut();
        showToastMessage(
          "Please confirm your email before signing in. Check your inbox for the confirmation link.",
          "error"
        );
        setLoading(false);
        return;
      }

      // Successful login
      showToastMessage("Successfully signed in!", "success");

      // Redirect to main app after a short delay
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1500);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      showToastMessage(errorMessage, "error");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }

    try {
      setLoading(true);
      setError("");
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      showToastMessage("Successfully signed in!", "success");

      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1000);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown error occurred during sign in";
      showToastMessage(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CustomToast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        onHide={hideToast}
        duration={toastType === "success" ? 2000 : 4000}
      />
      <Text style={[styles.title, { color: colors.text }]}>
        Welcome to Calendy
      </Text>
      <Text style={[styles.subtitle, { color: colors.text + "CC" }]}>
        Sign in to continue
      </Text>

      {error ? (
        <Text style={[styles.error, { color: colors.primary }]}>{error}</Text>
      ) : null}

      <View style={styles.form}>
        <ThemedTextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <ThemedTextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            loading && styles.buttonDisabled,
          ]}
          onPress={handleSignIn}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Signing in..." : "Sign In"}
          </Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.text + "CC" }]}>
            Don't have an account?{" "}
          </Text>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable>
              <Text style={[styles.link, { color: colors.primary }]}>
                Sign up
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: "center",
  },
  form: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    width: "100%",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  link: {
    fontWeight: "600",
    fontSize: 14,
  },
  error: {
    marginBottom: 16,
    textAlign: "center",
    fontSize: 14,
  },
});
