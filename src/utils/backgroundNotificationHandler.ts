import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Handle background notifications
export const backgroundNotificationHandler = async (notification: Notifications.Notification) => {
  console.log('Background notification received:', notification);
  
  const { title, body, data } = notification.request.content;
  
  // Process different notification types
  switch (data?.type) {
    case 'message':
      // Handle new message notification
      console.log('New message notification in background');
      // You could update badge count, store notification data, etc.
      break;
      
    case 'newListing':
      // Handle new listing notification
      console.log('New listing notification in background');
      // You could update local cache, show badge, etc.
      break;
      
    case 'priceChange':
      // Handle price change notification
      console.log('Price change notification in background');
      // You could update local listing data, show badge, etc.
      break;
      
    case 'system':
      // Handle system notification
      console.log('System notification in background');
      break;
      
    case 'welcome':
      // Handle welcome notification
      console.log('Welcome notification in background');
      break;
      
    case 'dailyDigest':
      // Handle daily digest notification
      console.log('Daily digest notification in background');
      break;
      
    default:
      console.log('Unknown notification type in background');
  }
  
  // Return the notification response
  return {
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  };
};

// Configure background notification behavior
export const configureBackgroundNotifications = () => {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      // Handle foreground notifications
      if (Platform.OS === 'ios') {
        // iOS specific handling
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      } else {
        // Android specific handling
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      }
    },
  });
};

// Process notification data for navigation
export const processNotificationData = (data: any) => {
  switch (data?.type) {
    case 'message':
      return {
        screen: 'Chat',
        params: {
          recipientId: data.senderId,
          recipientName: data.senderName,
          listingId: data.listingId,
        },
      };
      
    case 'newListing':
      return {
        screen: 'ListingDetail',
        params: {
          listingId: data.listingId,
        },
      };
      
    case 'priceChange':
      return {
        screen: 'ListingDetail',
        params: {
          listingId: data.listingId,
        },
      };
      
    case 'system':
      return {
        screen: 'Home',
        params: {},
      };
      
    case 'welcome':
      return {
        screen: 'Home',
        params: {},
      };
      
    case 'dailyDigest':
      return {
        screen: 'Search',
        params: {
          category: data.categories?.[0],
        },
      };
      
    default:
      return {
        screen: 'Home',
        params: {},
      };
  }
};

// Update badge count
export const updateBadgeCount = async (count: number) => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error updating badge count:', error);
  }
};

// Clear badge count
export const clearBadgeCount = async () => {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error('Error clearing badge count:', error);
  }
};

// Get current badge count
export const getBadgeCount = async (): Promise<number> => {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
};

// Schedule local notification for later
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  trigger: any,
  data?: any
): Promise<string> => {
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        badge: 1,
      },
      trigger,
    });
  } catch (error) {
    console.error('Error scheduling local notification:', error);
    throw error;
  }
};

// Cancel scheduled notification
export const cancelScheduledNotification = async (notificationId: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling scheduled notification:', error);
  }
};

// Cancel all scheduled notifications
export const cancelAllScheduledNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all scheduled notifications:', error);
  }
};

// Get all scheduled notifications
export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

export default {
  backgroundNotificationHandler,
  configureBackgroundNotifications,
  processNotificationData,
  updateBadgeCount,
  clearBadgeCount,
  getBadgeCount,
  scheduleLocalNotification,
  cancelScheduledNotification,
  cancelAllScheduledNotifications,
  getScheduledNotifications,
};
