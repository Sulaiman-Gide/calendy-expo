import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";

export default function AboutScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          About Calendy
        </Text>
        <Text style={[styles.subtitle, { color: colors.secondary }]}>
          Your Personal Event Management App
        </Text>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          App Information
        </Text>
        <Text style={[styles.text, { color: colors.text }]}>
          Calendy helps you manage your events and appointments with ease. Stay
          organized and never miss an important date again.
        </Text>

        <View style={styles.infoItem}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Version 1.0.0
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Developer
        </Text>
        <View style={styles.developerInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>MN</Text>
          </View>
          <View>
            <Text style={[styles.developerName, { color: colors.text }]}>
              Sulaiman Ibrahim Gide
            </Text>
            <Text style={[styles.developerRole, { color: colors.secondary }]}>
              Mobolie App Developer
            </Text>
          </View>
        </View>
        <Text style={[styles.text, { color: colors.text, marginTop: 16 }]}>
          Passionate about creating beautiful and functional mobile applications
          that make people's lives easier.
        </Text>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Contact & Support
        </Text>

        <TouchableOpacity
          style={styles.contactItem}
          onPress={() => openLink("mailto:sulaiman@gmail.com")}
        >
          <Ionicons name="mail-outline" size={20} color={colors.primary} />
          <Text style={[styles.contactText, { color: colors.text }]}>
            sulaiman@gmail.com
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactItem}
          onPress={() => openLink("https://github.com/sulaiman-gide")}
        >
          <Ionicons name="logo-github" size={20} color={colors.primary} />
          <Text style={[styles.contactText, { color: colors.text }]}>
            GitHub
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactItem}
          onPress={() => openLink("https://linkedin.com/in/sulaiman-gide")}
        >
          <Ionicons name="logo-linkedin" size={20} color={colors.primary} />
          <Text style={[styles.contactText, { color: colors.text }]}>
            LinkedIn
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Legal
        </Text>
        <TouchableOpacity style={styles.legalItem}>
          <Text style={[styles.legalText, { color: colors.text }]}>
            Privacy Policy
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.secondary} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <TouchableOpacity style={styles.legalItem}>
          <Text style={[styles.legalText, { color: colors.text }]}>
            Terms of Service
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.copyright, { color: colors.secondary }]}>
          © {new Date().getFullYear()} Calendy. All rights reserved.
        </Text>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  card: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 15,
  },
  developerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  developerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  developerRole: {
    fontSize: 14,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  contactText: {
    marginLeft: 16,
    fontSize: 15,
  },
  legalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  legalText: {
    fontSize: 15,
  },
  divider: {
    height: 1,
    width: "100%",
  },
  footer: {
    padding: 24,
    alignItems: "center",
  },
  copyright: {
    fontSize: 13,
    textAlign: "center",
  },
});
