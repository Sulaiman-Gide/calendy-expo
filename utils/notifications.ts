import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  } as Notifications.NotificationBehavior),
});

type NotificationTrigger = {
  type: 'date';
  seconds: number;
};

export async function scheduleNotification(title: string, body: string, date: Date) {
  // Request permissions (iOS)
  if (Platform.OS === 'ios') {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notification permission not granted!');
      return;
    }
  }

  // Calculate seconds until the notification should trigger
  const secondsFromNow = Math.floor((date.getTime() - Date.now()) / 1000);
  
  if (secondsFromNow <= 0) {
    console.warn('Cannot schedule notification in the past');
    return;
  }

  // Schedule the notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: body,
      sound: 'default',
    },
    trigger: {
      type: 'timeInterval',
      seconds: secondsFromNow,
      repeats: false,
    },
  } as Notifications.NotificationRequestInput);
}

export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function cancelScheduledNotification(notificationId: string) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// Register FCM token with Supabase
export async function registerFCMToken(userId: string) {
  try {
    if (!Device.isDevice) {
      console.log('Must use physical device for push notifications');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert('Permission required', 'Push notifications are required for event reminders');
      return;
    }

    // Get the FCM token
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    
    // Save the token to the user's profile
    const { error } = await supabase
      .from('profiles')
      .update({ fcm_token: token })
      .eq('id', userId);

    if (error) throw error;

    console.log('FCM token registered successfully');
  } catch (error) {
    console.error('Error registering FCM token:', error);
  }
}

// Handle notifications when the app is in the foreground
export function handleNotificationInteraction() {
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data as { eventId?: string };
    
    if (data?.eventId) {
      // Navigate to the home screen when notification is tapped
      // The home screen can then handle any deep linking if needed
      router.replace('/(tabs)');
    }
  });

  return responseListener;
}

// Initialize notifications
export async function initNotifications(userId: string) {
  try {
    // Register the FCM token
    await registerFCMToken(userId);
    
    // Set up notification handling
    const responseListener = handleNotificationInteraction();
    
    // Clean up listener on unmount
    return () => {
      Notifications.removeNotificationSubscription(responseListener);
    };
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
}
