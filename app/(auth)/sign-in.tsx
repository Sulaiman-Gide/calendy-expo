import { MaterialIcons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useMemo, useState } from "react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "info"
  );

  // Password validation rules
  const passwordValidation = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [password]);

  const isPasswordValid = useMemo(() => {
    return Object.values(passwordValidation).every(Boolean);
  }, [passwordValidation]);
  const router = useRouter();
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

    if (!isPasswordValid) {
      showToastMessage(
        "Please ensure your password meets all requirements",
        "error"
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Trying to login");
      // Sign in with email and password
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log("Trying to login error");
        showToastMessage(error.message || "Failed to sign in", "error");
        return;
      }

      showToastMessage("Successfully signed in!", "success");
      setLoading(false);

      router.replace("/(tabs)");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      showToastMessage(errorMessage, "error");
      setError(errorMessage);
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
        <View style={styles.passwordContainer}>
          <ThemedTextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={{ flex: 1 }}
          />
          <Pressable
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <MaterialIcons
              name={showPassword ? "visibility-off" : "visibility"}
              size={24}
              color={colors.text + "80"}
            />
          </Pressable>
        </View>

        <View style={styles.validationContainer}>
          <Text
            style={[
              styles.validationText,
              { color: colors.text + "CC", marginBottom: 8 },
            ]}
          >
            Password must contain:
          </Text>

          <ValidationItem
            isValid={passwordValidation.minLength}
            text="At least 8 characters"
            colors={colors}
          />
          <ValidationItem
            isValid={passwordValidation.hasUpperCase}
            text="At least one uppercase letter"
            colors={colors}
          />
          <ValidationItem
            isValid={passwordValidation.hasLowerCase}
            text="At least one lowercase letter"
            colors={colors}
          />
          <ValidationItem
            isValid={passwordValidation.hasNumber}
            text="At least one number"
            colors={colors}
          />
          <ValidationItem
            isValid={passwordValidation.hasSpecialChar}
            text="At least one special character"
            colors={colors}
          />
        </View>

        <Pressable
          style={[
            styles.button,
            {
              backgroundColor:
                isPasswordValid && !loading ? colors.primary : colors.border,
              opacity: !isPasswordValid || loading ? 0.6 : 1,
            },
          ]}
          onPress={handleSignIn}
          disabled={!isPasswordValid || loading}
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

// Validation Item Component
const ValidationItem = ({
  isValid,
  text,
  colors,
}: {
  isValid: boolean;
  text: string;
  colors: any;
}) => (
  <View style={styles.validationItem}>
    <MaterialIcons
      name={isValid ? "check-circle" : "radio-button-unchecked"}
      size={16}
      color={isValid ? "#4CAF50" : colors.text + "80"}
    />
    <Text
      style={[
        styles.validationText,
        {
          color: isValid ? "#4CAF50" : colors.text + "80",
          textDecorationLine: isValid ? "none" : "line-through",
        },
      ]}
    >
      {text}
    </Text>
  </View>
);

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
    gap: 12,
    width: "98%",
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    padding: 8,
  },
  validationContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  validationItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  validationText: {
    marginLeft: 8,
    fontSize: 13,
  },
});
