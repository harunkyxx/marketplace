import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  // Request notification permissions
  static async requestPermissions(): Promise<boolean> {
    try {
      console.log('🔐 Requesting notification permissions...');
      
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        console.log('📱 Current permission status:', existingStatus);
        
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          console.log('🔐 Requesting new permissions...');
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
          console.log('📱 New permission status:', status);
        }
        
        if (finalStatus !== 'granted') {
          console.log('❌ Failed to get push token for push notification!');
          return false;
        }
        
        console.log('✅ Notification permissions granted');
        return true;
      } else {
        console.log('⚠️ Must use physical device for Push Notifications');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      return false;
    }
  }

  // Get push token
  static async getPushToken(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'aussie-marketplace', // Your Expo project ID
      });

      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  // Save push token to user's profile
  static async savePushToken(): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await this.getPushToken();
      if (!token) return;

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        pushToken: token,
        notificationSettings: {
          messages: true,
          favorites: true,
          newListings: true,
          priceChanges: true,
        },
        updatedAt: new Date(),
      }, { merge: true });

      console.log('Push token saved successfully');
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  // Send local notification
  static async sendLocalNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      console.log('📤 Sending local notification:', { title, body, data });
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Send immediately
      });
      
      console.log('✅ Local notification sent successfully with ID:', notificationId);
    } catch (error) {
      console.error('❌ Error sending local notification:', error);
      throw error;
    }
  }

  // Schedule notification for later
  static async scheduleNotification(
    title: string,
    body: string,
    trigger: any,
    data?: any
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger,
    });
  }

  // Cancel scheduled notification
  static async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  // Cancel all notifications
  static async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Get notification settings
  static async getNotificationSettings(): Promise<Notifications.NotificationPermissionsStatus> {
    return await Notifications.getPermissionsAsync();
  }

  // Check if notifications are enabled
  static async areNotificationsEnabled(): Promise<boolean> {
    const settings = await this.getNotificationSettings();
    return settings.granted;
  }

  // Handle notification received while app is in foreground
  static async handleNotificationReceived(notification: Notifications.Notification): Promise<void> {
    console.log('Notification received:', notification);
    
    // You can handle the notification data here
    const { title, body, data } = notification.request.content;
    
    // Example: Update UI based on notification
    if (data?.type === 'message') {
      // Handle new message notification
      console.log('New message received');
    } else if (data?.type === 'favorite') {
      // Handle favorite update notification
      console.log('Favorite item updated');
    }
  }

  // Handle notification response (when user taps notification)
  static async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    const { data } = response.notification.request.content;
    
    console.log('Notification response:', data);
    
    // Handle navigation based on notification type
    if (data?.type === 'message') {
      // Navigate to chat screen
      console.log('Navigate to chat');
    } else if (data?.type === 'listing') {
      // Navigate to listing detail
      console.log('Navigate to listing');
    }
  }

  // Set up notification listeners
  static setupNotificationListeners(): () => void {
    try {
      console.log('🔔 Setting up notification listeners...');
      
      const notificationReceivedListener = Notifications.addNotificationReceivedListener(
        this.handleNotificationReceived
      );

      const notificationResponseListener = Notifications.addNotificationResponseReceivedListener(
        this.handleNotificationResponse
      );

      console.log('✅ Notification listeners set up successfully');
      
      // Return cleanup function
      return () => {
        console.log('🧹 Cleaning up notification listeners...');
        Notifications.removeNotificationSubscription(notificationReceivedListener);
        Notifications.removeNotificationSubscription(notificationResponseListener);
      };
    } catch (error) {
      console.error('❌ Error setting up notification listeners:', error);
      // Return empty cleanup function on error
      return () => {};
    }
  }

  // Send notification to specific user (for server-side use)
  static async sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      const message = {
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
      };

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Update user's notification preferences
  static async updateNotificationPreferences(preferences: {
    messages?: boolean;
    favorites?: boolean;
    newListings?: boolean;
    priceChanges?: boolean;
    system?: boolean;
  }): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        notificationSettings: preferences,
        updatedAt: new Date(),
      }, { merge: true });

      console.log('Notification preferences updated');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  }

  // Get user's notification preferences
  static async getNotificationPreferences(): Promise<any> {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('No current user found');
        return null;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const settings = userData?.notificationSettings;
        
        if (settings) {
          console.log('Found notification settings:', settings);
          return settings;
        } else {
          console.log('No notification settings found, returning defaults');
          // Return default settings if none exist
          return {
            messages: true,
            favorites: true,
            newListings: true,
            priceChanges: true,
            system: true,
          };
        }
      } else {
        console.log('User document does not exist');
        return {};
      }
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      // Return default settings on error
      return {
        messages: true,
        favorites: true,
        newListings: true,
        priceChanges: true,
        system: true,
      };
    }
  }
}

// Export default instance
export default NotificationService;
