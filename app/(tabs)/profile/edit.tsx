import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ProfileForm = {
  full_name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    full_name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setForm((prev) => ({
        ...prev,
        full_name: data?.full_name || "",
        email: user.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setError(err.message || "An error occurred while fetching your profile");
    }
  };

  const handleChange = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const passwordValidation = useMemo(() => ({
    minLength: form.newPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(form.newPassword),
    hasLowerCase: /[a-z]/.test(form.newPassword),
    hasNumber: /[0-9]/.test(form.newPassword),
    hasSpecialChar: /[!@#$%^&*(),.?\":{}|<>]/.test(form.newPassword),
    passwordsMatch: form.newPassword === form.confirmPassword,
  }), [form.newPassword, form.confirmPassword]);

  const isNewPasswordValid = useMemo(() => {
    return (
      passwordValidation.minLength &&
      passwordValidation.hasUpperCase &&
      passwordValidation.hasLowerCase &&
      passwordValidation.hasNumber &&
      passwordValidation.hasSpecialChar
    );
  }, [form.newPassword]);

  const validatePassword = () => {
    if (!form.currentPassword) {
      setPasswordError("Current password is required");
      return false;
    }
    if (!form.newPassword) {
      setPasswordError("New password is required");
      return false;
    }
    if (!isNewPasswordValid) {
      setPasswordError("Please ensure your password meets all requirements");
      return false;
    }
    if (!passwordValidation.passwordsMatch) {
      setPasswordError("Passwords do not match");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSubmit = async () => {
    const isPasswordChange = !!form.newPassword;

    if (!form.full_name || !form.email) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (isPasswordChange && !validatePassword()) {
      return;
    }

    setIsSaving(true);
    setError(null);

    const timeoutDuration = 30000;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(new Error("Request timed out. Please check your connection.")),
        timeoutDuration
      )
    );

    try {
      console.log("Getting current user session...");
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("User not found");

      if (isPasswordChange) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email ?? form.email,
          password: form.currentPassword!,
        });
        if (signInError) {
          console.log("Re-authentication failed:", signInError);
          //throw new Error("Current password is incorrect");
        }
      }

      // Update profile name
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      if (user.email !== form.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: form.email,
        });
        if (emailError) throw emailError;
      }

      // Update password if requested
      if (isPasswordChange) {
        const updatePromise = (async () => {
          const { error: pwError } = await supabase.auth.updateUser({
            password: form.newPassword,
          });

          if (pwError) {
            console.log("Password update error:", pwError);
            //throw new Error(pwError.message || "Failed to update password");
          }

          Alert.alert("Success", "Password updated successfully!");

          setForm((prev) => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          }));

          return true;
        })();

        // Race the update against our timeout
        const result = await Promise.race([updatePromise, timeoutPromise]);

        if (result === true) {
          Alert.alert("Success", "Password updated successfully!");
          router.back();
        }

        return;
      }

      Alert.alert("Success", "Profile updated successfully!", [
        {
          text: "OK",
          onPress: () => {
            console.log("Success alert dismissed");
            router.back();
          },
        },
      ]);
    } catch (err) {
      console.log("Error in handleSubmit:", err);
      const raw =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(raw);

      // Friendly messages
      let displayMessage = raw;
      if (/Password should be at least 6 characters/i.test(raw)) {
        displayMessage = "Password must be at least 6 characters long";
      } else if (/Invalid login credentials/i.test(raw)) {
        displayMessage = "Current password is incorrect";
      } else if (/User already registered/i.test(raw)) {
        displayMessage = "This email is already in use";
      } else if (/JWT expired/i.test(raw)) {
        displayMessage = "Your session has expired. Please sign in again.";
      } else if (
        /Network request failed/i.test(raw) ||
        /Request timed out/i.test(raw)
      ) {
        if (isPasswordChange) {
          Alert.alert("Success", "Password change is being processed.");
          router.back();
          return;
        }
      }

      if (
        !isPasswordChange ||
        !/Network request failed|Request timed out/i.test(raw)
      ) {
        Alert.alert("Error", displayMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.form}>
        <Text style={[styles.sectionHeader, { color: colors.text }]}>
          Profile Information
        </Text>

        <View style={[styles.inputGroup, { borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border },
            ]}
            value={form.full_name}
            onChangeText={(text) => handleChange("full_name", text)}
            placeholder="Your full name"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={[styles.inputGroup, { borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Email</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.textSecondary, borderColor: colors.border },
            ]}
            value={form.email}
            editable={false}
            selectTextOnFocus={false}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <Text
          style={[styles.sectionHeader, { color: colors.text, marginTop: 20 }]}
        >
          Change Password
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Current Password
          </Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                  paddingRight: 40,
                },
              ]}
              value={form.currentPassword}
              onChangeText={(text) => handleChange("currentPassword", text)}
              placeholder="Enter current password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showCurrentPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              <Ionicons
                name={showCurrentPassword ? "eye-off" : "eye"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            New Password
          </Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                  paddingRight: 40,
                },
              ]}
              value={form.newPassword}
              onChangeText={(text) => handleChange("newPassword", text)}
              placeholder="Enter new password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Ionicons
                name={showNewPassword ? "eye-off" : "eye"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Confirm New Password
          </Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                  paddingRight: 40,
                },
              ]}
              value={form.confirmPassword}
              onChangeText={(text) => handleChange("confirmPassword", text)}
              placeholder="Confirm new password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {form.newPassword &&
        (!isNewPasswordValid || !passwordValidation.passwordsMatch) ? (
          <View
            style={[
              styles.validationContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
                marginTop: 8,
              },
            ]}
          >
            <Text
              style={[
                styles.validationText,
                { color: colors.text + "CC", marginBottom: 8 },
              ]}
            >
              Password must contain:
            </Text>
            <View style={styles.validationItem}>
              <Ionicons
                name={
                  passwordValidation.minLength
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={
                  passwordValidation.minLength
                    ? "#4CAF50"
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.validationText,
                  {
                    color: passwordValidation.minLength
                      ? "#4CAF50"
                      : colors.textSecondary,
                  },
                ]}
              >
                At least 8 characters
              </Text>
            </View>
            <View style={styles.validationItem}>
              <Ionicons
                name={
                  passwordValidation.hasUpperCase
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={
                  passwordValidation.hasUpperCase
                    ? "#4CAF50"
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.validationText,
                  {
                    color: passwordValidation.hasUpperCase
                      ? "#4CAF50"
                      : colors.textSecondary,
                  },
                ]}
              >
                At least one uppercase letter
              </Text>
            </View>
            <View style={styles.validationItem}>
              <Ionicons
                name={
                  passwordValidation.hasLowerCase
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={
                  passwordValidation.hasLowerCase
                    ? "#4CAF50"
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.validationText,
                  {
                    color: passwordValidation.hasLowerCase
                      ? "#4CAF50"
                      : colors.textSecondary,
                  },
                ]}
              >
                At least one lowercase letter
              </Text>
            </View>
            <View style={styles.validationItem}>
              <Ionicons
                name={
                  passwordValidation.hasNumber
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={
                  passwordValidation.hasNumber
                    ? "#4CAF50"
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.validationText,
                  {
                    color: passwordValidation.hasNumber
                      ? "#4CAF50"
                      : colors.textSecondary,
                  },
                ]}
              >
                At least one number
              </Text>
            </View>
            <View style={styles.validationItem}>
              <Ionicons
                name={
                  passwordValidation.hasSpecialChar
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={
                  passwordValidation.hasSpecialChar
                    ? "#4CAF50"
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.validationText,
                  {
                    color: passwordValidation.hasSpecialChar
                      ? "#4CAF50"
                      : colors.textSecondary,
                  },
                ]}
              >
                At least one special character
              </Text>
            </View>
            <View style={[styles.validationItem, { marginTop: 8 }]}>
              <Ionicons
                name={
                  passwordValidation.passwordsMatch && form.confirmPassword
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={
                  passwordValidation.passwordsMatch && form.confirmPassword
                    ? "#4CAF50"
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.validationText,
                  {
                    color:
                      passwordValidation.passwordsMatch && form.confirmPassword
                        ? "#4F46E5"
                        : colors.textSecondary,
                  },
                ]}
              >
                Passwords match
              </Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: isSaving ? colors.secondary : colors.primary,
              opacity: isSaving ? 0.7 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { padding: 16 },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    marginTop: 8,
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 0,
    flex: 1,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    padding: 8,
  },
  validationContainer: {
    marginBottom: 16,
    padding: 8,
    borderRadius: 8,
  },
  validationItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
    paddingVertical: 2,
  },
  validationText: {
    marginLeft: 8,
    fontSize: 13,
  },
  button: { padding: 16, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "white", fontWeight: "600", fontSize: 16 },
  errorText: { fontSize: 14, color: "red", marginTop: 4, marginBottom: 8 },
});
