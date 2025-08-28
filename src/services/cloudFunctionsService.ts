import { auth, db } from '../config/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export class CloudFunctionsService {
  // Send notification to all users who have enabled specific notification type
  static async sendNotificationToAllUsers(
    notificationType: 'newListings' | 'priceChanges' | 'system',
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      console.log(`Starting to send ${notificationType} notification to all users`);
      
      // Get all users who have enabled this notification type
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where(`notificationSettings.${notificationType}`, '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`Found ${users.length} users with ${notificationType} notifications enabled`);

      // Send notification to each user
      let successCount = 0;
      let errorCount = 0;
      
      for (const user of users) {
        try {
          if (user.pushToken && user.pushToken.trim() !== '') {
            await this.sendPushNotification(user.pushToken, title, body, data);
            successCount++;
          } else {
            console.log(`User ${user.id} has no valid push token`);
          }
        } catch (error) {
          console.error(`Error sending notification to user ${user.id}:`, error);
          errorCount++;
        }
      }
      
      console.log(`Notification sending completed: ${successCount} successful, ${errorCount} failed`);
    } catch (error) {
      console.error('Error sending notification to all users:', error);
      throw error; // Re-throw to handle in calling function
    }
  }

  // Send notification to users interested in specific category
  static async sendNotificationToCategoryUsers(
    category: string,
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      // Get users who have favorited items in this category
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('notificationSettings.newListings', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter users who have favorites in this category
      const interestedUsers = [];
      for (const user of users) {
        if (user.favorites && user.favorites.length > 0) {
          // Check if user has favorites in this category
          const hasCategoryFavorites = await this.checkUserCategoryFavorites(user.id, category);
          if (hasCategoryFavorites) {
            interestedUsers.push(user);
          }
        }
      }

      console.log(`Sending category notification to ${interestedUsers.length} interested users`);

      // Send notification to interested users
      for (const user of interestedUsers) {
        if (user.pushToken) {
          await this.sendPushNotification(user.pushToken, title, body, data);
        }
      }
    } catch (error) {
      console.error('Error sending category notification:', error);
    }
  }

  // Send notification to users who favorited a specific listing
  static async sendNotificationToFavoritedUsers(
    listingId: string,
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      // Get all users who have this listing in their favorites
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('favorites', 'array-contains', listingId)
      );
      
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`Sending favorite notification to ${users.length} users`);

      // Send notification to each user
      for (const user of users) {
        if (user.pushToken && user.notificationSettings?.favorites) {
          await this.sendPushNotification(user.pushToken, title, body, data);
        }
      }
    } catch (error) {
      console.error('Error sending favorite notification:', error);
    }
  }

  // Send notification to specific user
  static async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.pushToken) {
          await this.sendPushNotification(userData.pushToken, title, body, data);
        }
      }
    } catch (error) {
      console.error('Error sending notification to user:', error);
    }
  }

  // Send notification to multiple specific users
  static async sendNotificationToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      for (const userId of userIds) {
        await this.sendNotificationToUser(userId, title, body, data);
      }
    } catch (error) {
      console.error('Error sending notification to users:', error);
    }
  }

  // Check if user has favorites in specific category
  private static async checkUserCategoryFavorites(userId: string, category: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return false;

      const userData = userDoc.data();
      if (!userData.favorites || userData.favorites.length === 0) return false;

      // Check if any of user's favorite listings are in this category
      for (const listingId of userData.favorites) {
        const listingDoc = await getDoc(doc(db, 'listings', listingId));
        if (listingDoc.exists()) {
          const listingData = listingDoc.data();
          if (listingData.category === category) {
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking user category favorites:', error);
      return false;
    }
  }

  // Send push notification using Expo's push service
  private static async sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      // Validate push token
      if (!pushToken || typeof pushToken !== 'string' || pushToken.trim() === '') {
        throw new Error('Invalid push token provided');
      }

      console.log(`Sending push notification to token: ${pushToken.substring(0, 20)}...`);

      const message = {
        to: pushToken,
        sound: 'default',
        title,
        body,
        data: {
          ...data,
          timestamp: new Date().toISOString(),
        },
      };

      console.log('Notification message:', { title, body, dataType: typeof data });

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
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }

      const result = await response.json();
      console.log('Push notification sent successfully, response:', result);
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error; // Re-throw to handle in calling function
    }
  }

  // Send welcome notification to new user
  static async sendWelcomeNotification(userId: string): Promise<void> {
    await this.sendNotificationToUser(
      userId,
      'Welcome to AussieMarket! 🎉',
      'Start exploring amazing deals and create your first listing.',
      {
        type: 'welcome',
        userId,
        action: 'explore',
      }
    );
  }

  // Send new listing notification to interested users
  static async sendNewListingNotification(
    listingId: string,
    listingTitle: string,
    category: string
  ): Promise<void> {
    const title = 'New Item Available! 🆕';
    const body = `${listingTitle} - Check it out now!`;
    
    await this.sendNotificationToCategoryUsers(
      category,
      title,
      body,
      {
        type: 'newListing',
        listingId,
        category,
        action: 'view',
      }
    );
  }

  // Send price change notification to favorited users
  static async sendPriceChangeNotification(
    listingId: string,
    listingTitle: string,
    oldPrice: number,
    newPrice: number
  ): Promise<void> {
    const title = 'Price Update! 💰';
    const body = `${listingTitle} price changed from $${oldPrice} to $${newPrice}`;
    
    await this.sendNotificationToFavoritedUsers(
      listingId,
      title,
      body,
      {
        type: 'priceChange',
        listingId,
        oldPrice,
        newPrice,
        action: 'view',
      }
    );
  }

  // Send system announcement to all users
  static async sendSystemAnnouncement(
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    await this.sendNotificationToAllUsers(
      'system',
      title,
      body,
      {
        type: 'system',
        ...data,
      }
    );
  }

  // Send daily digest to users
  static async sendDailyDigest(userId: string): Promise<void> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      if (!userData.notificationSettings?.newListings) return;

      // Get user's favorite categories and send digest
      const favoriteCategories = await this.getUserFavoriteCategories(userId);
      
      if (favoriteCategories.length > 0) {
        const title = 'Daily Digest 📰';
        const body = `New items in your favorite categories: ${favoriteCategories.join(', ')}`;
        
        await this.sendNotificationToUser(
          userId,
          title,
          body,
          {
            type: 'dailyDigest',
            categories: favoriteCategories,
            action: 'browse',
          }
        );
      }
    } catch (error) {
      console.error('Error sending daily digest:', error);
    }
  }

  // Get user's favorite categories
  private static async getUserFavoriteCategories(userId: string): Promise<string[]> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return [];

      const userData = userDoc.data();
      if (!userData.favorites || userData.favorites.length === 0) return [];

      const categories = new Set<string>();
      
      for (const listingId of userData.favorites) {
        const listingDoc = await getDoc(doc(db, 'listings', listingId));
        if (listingDoc.exists()) {
          const listingData = listingDoc.data();
          if (listingData.category) {
            categories.add(listingData.category);
          }
        }
      }

      return Array.from(categories);
    } catch (error) {
      console.error('Error getting user favorite categories:', error);
      return [];
    }
  }
}


