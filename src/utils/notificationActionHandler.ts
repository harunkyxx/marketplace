import { NavigationContainerRef } from '@react-navigation/native';
import RichNotificationService from '../services/richNotificationService';

export class NotificationActionHandler {
  private static navigationRef: NavigationContainerRef<any> | null = null;

  // Set navigation reference
  static setNavigationRef(ref: NavigationContainerRef<any>) {
    this.navigationRef = ref;
  }

  // Handle notification action
  static async handleAction(actionId: string, notificationData: any): Promise<void> {
    if (!this.navigationRef) {
      console.error('Navigation reference not set');
      return;
    }

    try {
      await RichNotificationService.handleNotificationAction(
        actionId,
        notificationData,
        this.navigationRef
      );
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  }

  // Handle notification tap
  static handleNotificationTap(notificationData: any): void {
    if (!this.navigationRef) {
      console.error('Navigation reference not set');
      return;
    }

    try {
      const { type, listingId, senderId, senderName, listingTitle } = notificationData;

      switch (type) {
        case 'richListing':
        case 'newListing':
          if (listingId) {
            this.navigationRef.navigate('ListingDetail', { listingId });
          }
          break;

        case 'richMessage':
        case 'message':
          if (senderId && senderName) {
            this.navigationRef.navigate('Chat', {
              recipientId: senderId,
              recipientName: senderName,
              listingId: listingId,
              listingTitle: listingTitle,
            });
          }
          break;

        case 'richPriceChange':
        case 'priceChange':
          if (listingId) {
            this.navigationRef.navigate('ListingDetail', { listingId });
          }
          break;

        case 'richSystem':
        case 'system':
          this.navigationRef.navigate('Home');
          break;

        case 'welcome':
          this.navigationRef.navigate('Home');
          break;

        case 'richDailyDigest':
        case 'dailyDigest':
          if (notificationData.categories && notificationData.categories.length > 0) {
            this.navigationRef.navigate('Search', {
              category: notificationData.categories[0],
            });
          } else {
            this.navigationRef.navigate('Search');
          }
          break;

        default:
          this.navigationRef.navigate('Home');
          break;
      }
    } catch (error) {
      console.error('Error handling notification tap:', error);
      // Fallback to home screen
      this.navigationRef.navigate('Home');
    }
  }

  // Process notification data for deep linking
  static processNotificationData(data: any): {
    screen: string;
    params: any;
  } {
    const { type, listingId, senderId, senderName, listingTitle, categories } = data;

    switch (type) {
      case 'richListing':
      case 'newListing':
        return {
          screen: 'ListingDetail',
          params: { listingId },
        };

      case 'richMessage':
      case 'message':
        return {
          screen: 'Chat',
          params: {
            recipientId: senderId,
            recipientName: senderName,
            listingId,
            listingTitle,
          },
        };

      case 'richPriceChange':
      case 'priceChange':
        return {
          screen: 'ListingDetail',
          params: { listingId },
        };

      case 'richSystem':
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

      case 'richDailyDigest':
      case 'dailyDigest':
        return {
          screen: 'Search',
          params: {
            category: categories?.[0],
          },
        };

      default:
        return {
          screen: 'Home',
          params: {},
        };
    }
  }

  // Check if notification has actions
  static hasActions(notificationData: any): boolean {
    return notificationData?.actions && notificationData.actions.length > 0;
  }

  // Get available actions for notification
  static getActions(notificationData: any): Array<{
    id: string;
    title: string;
    icon: string;
  }> {
    return notificationData?.actions || [];
  }

  // Validate notification data
  static validateNotificationData(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check required fields based on type
    switch (data.type) {
      case 'richListing':
      case 'newListing':
        return !!(data.listingId && data.listingTitle);

      case 'richMessage':
      case 'message':
        return !!(data.senderId && data.senderName);

      case 'richPriceChange':
      case 'priceChange':
        return !!(data.listingId && data.listingTitle);

      case 'richSystem':
      case 'system':
        return !!(data.title && data.body);

      case 'welcome':
        return !!(data.userId);

      case 'richDailyDigest':
      case 'dailyDigest':
        return !!(data.categories && data.categories.length > 0);

      default:
        return true; // Allow unknown types
    }
  }

  // Log notification interaction for analytics
  static logNotificationInteraction(
    notificationType: string,
    actionId: string,
    notificationData: any
  ): void {
    try {
      const logData = {
        timestamp: new Date().toISOString(),
        type: notificationType,
        action: actionId,
        data: notificationData,
        userId: notificationData.userId || 'unknown',
      };

      console.log('Notification interaction logged:', logData);
      
      // Here you could send to analytics service
      // AnalyticsService.track('notification_interaction', logData);
    } catch (error) {
      console.error('Error logging notification interaction:', error);
    }
  }
}

export default NotificationActionHandler;
