import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { auth, db, storage } from '../config/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';

export class RichNotificationService {
  // Configure rich notification behavior
  static configureRichNotifications() {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const { data } = notification.request.content;
        
        // Handle different notification types with rich content
        switch (data?.type) {
          case 'richListing':
            return {
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: true,
              shouldShowBanner: true,
              shouldShowList: true,
              // Enable rich content for listing notifications
            };
            
          case 'richMessage':
            return {
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: true,
              shouldShowBanner: true,
              shouldShowList: true,
              // Enable rich content for message notifications
            };
            
          default:
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
  }

  // Send rich notification with image
  static async sendRichNotification(
    pushToken: string,
    title: string,
    body: string,
    imageUrl?: string,
    data?: any,
    actions?: NotificationAction[]
  ): Promise<void> {
    try {
      const message: any = {
        to: pushToken,
        sound: 'default',
        title,
        body,
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          isRich: true,
        },
      };

      // Add image if provided
      if (imageUrl) {
        message.image = imageUrl;
      }

      // Add actions if provided
      if (actions && actions.length > 0) {
        message.data.actions = actions;
      }

      // Add category for iOS action buttons
      if (Platform.OS === 'ios' && actions && actions.length > 0) {
        message.category = 'rich_notification';
      }

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Rich notification sent successfully');
    } catch (error) {
      console.error('Error sending rich notification:', error);
    }
  }

  // Send rich listing notification with image and actions
  static async sendRichListingNotification(
    pushToken: string,
    listingId: string,
    listingTitle: string,
    listingPrice: number,
    listingImage?: string,
    category?: string
  ): Promise<void> {
    const title = 'New Item Available! 🆕';
    const body = `${listingTitle} - $${listingPrice}`;
    
    const actions: NotificationAction[] = [
      {
        id: 'view',
        title: 'View Item',
        icon: 'eye-outline',
        action: 'view_listing',
      },
      {
        id: 'favorite',
        title: 'Add to Favorites',
        icon: 'heart-outline',
        action: 'add_favorite',
      },
      {
        id: 'share',
        title: 'Share',
        icon: 'share-outline',
        action: 'share_listing',
      },
    ];

    await this.sendRichNotification(
      pushToken,
      title,
      body,
      listingImage,
      {
        type: 'richListing',
        listingId,
        listingTitle,
        listingPrice,
        category,
        actions: actions.map(a => ({ id: a.id, title: a.title })),
      },
      actions
    );
  }

  // Send rich message notification with sender info
  static async sendRichMessageNotification(
    pushToken: string,
    senderId: string,
    messageText: string,
    listingId?: string,
    listingTitle?: string
  ): Promise<void> {
    try {
      // Get sender information
      const senderDoc = await getDoc(doc(db, 'users', senderId));
      let senderName = 'Someone';
      let senderImage: string | undefined;

      if (senderDoc.exists()) {
        const senderData = senderDoc.data();
        senderName = `${senderData.firstName} ${senderData.lastName}`;
        senderImage = senderData.profileImage;
      }

      const title = `Message from ${senderName}`;
      const body = messageText.length > 50 ? `${messageText.substring(0, 50)}...` : messageText;

      const actions: NotificationAction[] = [
        {
          id: 'reply',
          title: 'Reply',
          icon: 'chatbubble-outline',
          action: 'reply_message',
        },
        {
          id: 'view',
          title: 'View Chat',
          icon: 'chatbubbles-outline',
          action: 'view_chat',
        },
      ];

      // Add listing action if message is about a listing
      if (listingId && listingTitle) {
        actions.push({
          id: 'viewListing',
          title: 'View Item',
          icon: 'eye-outline',
          action: 'view_listing',
        });
      }

      await this.sendRichNotification(
        pushToken,
        title,
        body,
        senderImage,
        {
          type: 'richMessage',
          senderId,
          senderName,
          messageText,
          listingId,
          listingTitle,
          actions: actions.map(a => ({ id: a.id, title: a.title })),
        },
        actions
      );
    } catch (error) {
      console.error('Error sending rich message notification:', error);
    }
  }

  // Send rich price change notification
  static async sendRichPriceChangeNotification(
    pushToken: string,
    listingId: string,
    listingTitle: string,
    oldPrice: number,
    newPrice: number,
    listingImage?: string
  ): Promise<void> {
    const title = 'Price Update! 💰';
    const body = `${listingTitle} price changed from $${oldPrice} to $${newPrice}`;
    
    const actions: NotificationAction[] = [
      {
        id: 'view',
        title: 'View Item',
        icon: 'eye-outline',
        action: 'view_listing',
      },
      {
        id: 'compare',
        title: 'Compare Prices',
        icon: 'trending-up-outline',
        action: 'compare_prices',
      },
      {
        id: 'share',
        title: 'Share Deal',
        icon: 'share-outline',
        action: 'share_deal',
      },
    ];

    await this.sendRichNotification(
      pushToken,
      title,
      body,
      listingImage,
      {
        type: 'richPriceChange',
        listingId,
        listingTitle,
        oldPrice,
        newPrice,
        actions: actions.map(a => ({ id: a.id, title: a.title })),
      },
      actions
    );
  }

  // Send rich system announcement
  static async sendRichSystemAnnouncement(
    pushToken: string,
    title: string,
    body: string,
    imageUrl?: string,
    actions?: NotificationAction[]
  ): Promise<void> {
    const defaultActions: NotificationAction[] = [
      {
        id: 'dismiss',
        title: 'Dismiss',
        icon: 'close-outline',
        action: 'dismiss',
      },
      {
        id: 'learnMore',
        title: 'Learn More',
        icon: 'information-circle-outline',
        action: 'learn_more',
      },
    ];

    const finalActions = actions || defaultActions;

    await this.sendRichNotification(
      pushToken,
      title,
      body,
      imageUrl,
      {
        type: 'richSystem',
        actions: finalActions.map(a => ({ id: a.id, title: a.title })),
      },
      finalActions
    );
  }

  // Send rich daily digest with multiple images
  static async sendRichDailyDigest(
    pushToken: string,
    categories: string[],
    featuredListings: Array<{
      id: string;
      title: string;
      price: number;
      image?: string;
    }>
  ): Promise<void> {
    const title = 'Daily Digest 📰';
    const body = `New items in your favorite categories: ${categories.join(', ')}`;
    
    // Use first featured listing image as main image
    const mainImage = featuredListings[0]?.image;
    
    const actions: NotificationAction[] = [
      {
        id: 'browse',
        title: 'Browse All',
        icon: 'grid-outline',
        action: 'browse_listings',
      },
      {
        id: 'favorites',
        title: 'View Favorites',
        icon: 'heart-outline',
        action: 'view_favorites',
      },
      {
        id: 'search',
        title: 'Search',
        icon: 'search-outline',
        action: 'search_listings',
      },
    ];

    await this.sendRichNotification(
      pushToken,
      title,
      body,
      mainImage,
      {
        type: 'richDailyDigest',
        categories,
        featuredListings,
        actions: actions.map(a => ({ id: a.id, title: a.title })),
      },
      actions
    );
  }

  // Handle notification action response
  static async handleNotificationAction(
    actionId: string,
    notificationData: any,
    navigation?: any
  ): Promise<void> {
    console.log('Handling notification action:', actionId, notificationData);

    switch (actionId) {
      case 'view_listing':
        if (notificationData.listingId && navigation) {
          // Navigate to listing detail
          navigation.navigate('ListingDetail', { 
            listingId: notificationData.listingId 
          });
        }
        break;

      case 'add_favorite':
        if (notificationData.listingId) {
          await this.addToFavorites(notificationData.listingId);
        }
        break;

      case 'share_listing':
        if (notificationData.listingId) {
          await this.shareListing(notificationData.listingId);
        }
        break;

      case 'reply_message':
        if (notificationData.senderId && navigation) {
          // Navigate to chat
          navigation.navigate('Chat', {
            recipientId: notificationData.senderId,
            recipientName: notificationData.senderName,
            listingId: notificationData.listingId,
          });
        }
        break;

      case 'view_chat':
        if (notificationData.senderId && navigation) {
          // Navigate to chat
          navigation.navigate('Chat', {
            recipientId: notificationData.senderId,
            recipientName: notificationData.senderName,
            listingId: notificationData.listingId,
          });
        }
        break;

      case 'compare_prices':
        if (notificationData.listingId) {
          await this.comparePrices(notificationData.listingId);
        }
        break;

      case 'share_deal':
        if (notificationData.listingId) {
          await this.shareDeal(notificationData.listingId);
        }
        break;

      case 'browse_listings':
        if (navigation) {
          navigation.navigate('Search');
        }
        break;

      case 'view_favorites':
        if (navigation) {
          navigation.navigate('Favorites');
        }
        break;

      case 'search_listings':
        if (navigation) {
          navigation.navigate('Search');
        }
        break;

      case 'learn_more':
        // Handle learn more action
        console.log('Learn more action triggered');
        break;

      case 'dismiss':
        // Handle dismiss action
        console.log('Notification dismissed');
        break;

      default:
        console.log('Unknown action:', actionId);
    }
  }

  // Add listing to favorites
  private static async addToFavorites(listingId: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        favorites: arrayUnion(listingId),
        updatedAt: new Date(),
      });

      console.log('Listing added to favorites via notification');
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  }

  // Share listing
  private static async shareListing(listingId: string): Promise<void> {
    try {
      // Get listing details
      const listingDoc = await getDoc(doc(db, 'listings', listingId));
      if (listingDoc.exists()) {
        const listingData = listingDoc.data();
        const shareText = `Check out this item: ${listingData.title} - $${listingData.price} ${listingData.currency}`;
        
        // Use React Native Share API or similar
        console.log('Share text:', shareText);
      }
    } catch (error) {
      console.error('Error sharing listing:', error);
    }
  }

  // Compare prices
  private static async comparePrices(listingId: string): Promise<void> {
    try {
      // Get listing details and find similar items for price comparison
      const listingDoc = await getDoc(doc(db, 'listings', listingId));
      if (listingDoc.exists()) {
        const listingData = listingDoc.data();
        console.log('Price comparison for:', listingData.title);
        // Implement price comparison logic
      }
    } catch (error) {
      console.error('Error comparing prices:', error);
    }
  }

  // Share deal
  private static async shareDeal(listingId: string): Promise<void> {
    try {
      // Get listing details
      const listingDoc = await getDoc(doc(db, 'listings', listingId));
      if (listingDoc.exists()) {
        const listingData = listingDoc.data();
        const dealText = `Great deal alert! ${listingData.title} - Now only $${listingData.price} ${listingData.currency}`;
        
        console.log('Deal share text:', dealText);
        // Use React Native Share API or similar
      }
    } catch (error) {
      console.error('Error sharing deal:', error);
    }
  }
}

// Notification action interface
export interface NotificationAction {
  id: string;
  title: string;
  icon: string;
  action: string;
}

export default RichNotificationService;
