import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeContext } from "../context/ThemeContext";

interface ToastProps {
  visible: boolean;
  message: string;
  type: "success" | "error" | "info";
  onHide: () => void;
  duration?: number;
}

const CustomToast: React.FC<ToastProps> = ({
  visible,
  message,
  type,
  onHide,
  duration = 4000,
}) => {
  const translateY = useRef(new Animated.Value(-200)).current;
  const insets = useSafeAreaInsets();
  const context = useContext(ThemeContext);
  const colors = context?.colors || {
    background: "#ffffff",
    card: "#ffffff",
    text: "#1a1a1a",
    border: "#e5e7eb",
    primary: "#3b82f6",
    secondary: "#6b7280",
  };

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: insets.top > 0 ? insets.top : 20,
        useNativeDriver: true,
        tension: 120,
        friction: 14,
      }).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, insets.top]);

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onHide();
    });
  };

  const getToastConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: "checkmark-circle" as const,
          color: "#2E7D32",
          bgColor: colors.background,
          textColor: colors.text,
        };
      case "error":
        return {
          icon: "alert-circle" as const,
          color: "#C62828",
          bgColor: "#a83c3215",
          textColor: colors.text,
        };
      default:
        return {
          icon: "information-circle" as const,
          color: "#0277BD",
          bgColor: colors.background,
          textColor: colors.text,
        };
    }
  };

  const config = getToastConfig();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        style={[
          styles.toastBody,
          {
            borderLeftColor: config.color,
            backgroundColor: config.bgColor,
          },
        ]}
      >
        <Ionicons
          name={config.icon}
          size={24}
          color={config.color}
          style={styles.icon}
        />
        <Text style={[styles.message, { color: config.textColor }]}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  toastBody: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderLeftWidth: 5,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 12,
    padding: 6,
  },
});

export default CustomToast;
