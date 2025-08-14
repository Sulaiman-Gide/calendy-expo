import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import CustomToast from "../../components/CustomToast";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

interface ThemedTextInputProps {
  style?: StyleProp<ViewStyle>;
  placeholder?: string;
  secureTextEntry?: boolean;
  rightIcon?: string;
  onRightIconPress?: () => void;
  [key: string]: any;
}

const ThemedTextInput = ({
  style,
  placeholder,
  secureTextEntry = false,
  rightIcon,
  onRightIconPress,
  ...props
}: ThemedTextInputProps) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.inputContainer, style as ViewStyle]}>
      <TextInput
        style={{
          ...(styles.input as object),
          color: colors.text,
          backgroundColor: colors.card,
          borderColor: colors.border,
          paddingRight: rightIcon ? 40 : 12,
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          width: "100%",
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.text + "80"}
        secureTextEntry={secureTextEntry}
        {...props}
      />
      {rightIcon && (
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={onRightIconPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={rightIcon as any}
            size={20}
            color={colors.text + "80"}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !fullName) {
      showToastMessage("Please fill in all fields", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToastMessage("Passwords do not match", "error");
      return;
    }
    if (password.length < 6) {
      showToastMessage("Password must be at least 6 characters", "error");
      return;
    }

    try {
      setLoading(true);

      // Sign up the user with email and password
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${process.env.EXPO_PUBLIC_APP_URL || "exp://"}`,
          },
        }
      );

      // Check for signup error
      if (signUpError) {
        throw signUpError;
      }

      // If we get here, signup was successful
      if (authData?.user) {
        // Create user profile
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: authData.user.id,
          full_name: fullName,
          email: email,
          onboarded: false,
          updated_at: new Date().toISOString(),
        });

        if (profileError) {
          console.log("Profile creation error:", profileError);
        }

        showToastMessage(
          "Check your email for the confirmation link!",
          "success"
        );

        // Redirect to sign-in after a delay
        setTimeout(() => {
          router.replace("/(auth)/sign-in");
        }, 3000);
      } else {
        throw new Error("User creation failed - no user data returned");
      }
    } catch (error) {
      console.error("Signup error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message.includes("User already registered")
            ? "This email is already registered. Please sign in."
            : error.message
          : "An unknown error occurred during sign up";

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
        duration={toastType === "success" ? 3000 : 4000}
      />

      <Text style={[styles.title, { color: colors.text }]}>
        Create an account
      </Text>
      <Text style={[styles.subtitle, { color: colors.text + "CC" }]}>
        Join Calendy to manage your events
      </Text>

      <View style={styles.form}>
        <ThemedTextInput
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />
        <ThemedTextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <ThemedTextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          rightIcon={showPassword ? "eye-off" : "eye"}
          onRightIconPress={() => setShowPassword(!showPassword)}
        />
        <ThemedTextInput
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          rightIcon={showConfirmPassword ? "eye-off" : "eye"}
          onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
          style={{ marginBottom: 16 }}
        />

        <Pressable
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.8 : 1,
            },
            loading && styles.buttonDisabled,
          ]}
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: "#fff" }]}>
            {loading ? "Creating Account..." : "Create Account"}
          </Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.text + "CC" }]}>
            Already have an account?{" "}
            <Link href="/(auth)/sign-in" asChild>
              <Text style={[styles.link, { color: colors.primary }]}>
                Sign In
              </Text>
            </Link>
          </Text>
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
    fontSize: 32,
    fontWeight: "bold" as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    color: "#666",
  },
  form: {
    gap: 12,
    width: "98%",
    alignSelf: "center",
  },
  inputContainer: {
    position: "relative",
    width: "100%",
  },
  input: {
    // Moved inline for type safety
  },
  iconContainer: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    width: 40,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    width: "100%",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    marginTop: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
  },
  link: {
    color: "#3b82f6",
    textDecorationLine: "underline",
    fontSize: 14,
  },
  error: {
    marginBottom: 16,
    textAlign: "center",
    fontSize: 14,
  },
});
