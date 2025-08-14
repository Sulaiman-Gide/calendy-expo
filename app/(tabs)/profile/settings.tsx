import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';

type SettingItemProps = {
  icon: string;
  title: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
};

const SettingItem = ({ icon, title, onPress, rightComponent }: SettingItemProps) => {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[styles.settingItem, { borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color={colors.primary} style={styles.settingIcon} />
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {rightComponent || <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />}
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const { colors, theme, setTheme } = useTheme();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(theme === 'dark');

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(status === 'granted');
  };

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
    } else {
      // In a real app, you would implement proper notification disabling logic
      Alert.alert(
        'Disable Notifications',
        'To disable notifications, please go to your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Notifications.requestPermissionsAsync() },
        ]
      );
    }
    checkNotificationStatus();
  };

  const toggleDarkMode = () => {
    const newTheme = darkMode ? 'light' : 'dark';
    setDarkMode(!darkMode);
    setTheme(newTheme);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
        
        <SettingItem
          icon="moon-outline"
          title="Dark Mode"
          rightComponent={
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={darkMode ? 'white' : '#f4f3f4'}
            />
          }
        />

        <SettingItem
          icon="notifications-outline"
          title="Notifications"
          rightComponent={
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={notificationsEnabled ? 'white' : '#f4f3f4'}
            />
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
        
        <SettingItem
          icon="lock-closed-outline"
          title="Change Password"
          onPress={() => router.push('/profile/change-password' as any)}
        />
        
        <SettingItem
          icon="help-circle-outline"
          title="Help & Support"
          onPress={() => router.push('/help' as any)}
        />
        
        <SettingItem
          icon="information-circle-outline"
          title="About"
          onPress={() => router.push('/about' as any)}
        />
      </View>

      <View style={styles.section}>
        <SettingItem
          icon="log-out-outline"
          title="Sign Out"
          onPress={handleSignOut}
        />
        
        <Text style={[styles.versionText, { color: colors.textSecondary }]}>
          Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
    marginBottom: 12,
    paddingHorizontal: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 16,
    width: 24,
  },
  settingTitle: {
    fontSize: 16,
  },
  versionText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 12,
    opacity: 0.7,
  },
});
