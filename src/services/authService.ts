import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User as UserType } from '../types';
import { CloudFunctionsService } from './cloudFunctionsService';

export class AuthService {
  // User registration
  static async registerUser(email: string, password: string, userData: Partial<UserType>): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile in Firestore
      const userProfile = {
        uid: user.uid,
        email: user.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        location: userData.location || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        isVerified: false,
        profileImage: userData.profileImage || null,
        listings: [],
        favorites: [],
        conversations: [],
        notificationSettings: {
          messages: true,
          favorites: true,
          newListings: true,
          priceChanges: true,
          system: true,
        }
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);

      // Update display name
      if (userData.firstName && userData.lastName) {
        await updateProfile(user, {
          displayName: `${userData.firstName} ${userData.lastName}`
        });
      }

      // Send welcome notification
      try {
        await CloudFunctionsService.sendWelcomeNotification(user.uid);
        console.log('Welcome notification sent successfully');
      } catch (error) {
        console.error('Error sending welcome notification:', error);
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  // User login
  static async loginUser(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  // User logout
  static async logoutUser(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  }

  // Get current user profile
  static async getCurrentUserProfile(): Promise<UserType | null> {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('No current user found');
        return null;
      }

      console.log('Fetching user profile for:', user.uid);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserType;
        console.log('User profile found:', { 
          uid: userData.uid, 
          firstName: userData.firstName, 
          lastName: userData.lastName 
        });
        return userData;
      } else {
        console.log('User document does not exist for:', user.uid);
        return null;
      }
    } catch (error) {
      console.error('Error in getCurrentUserProfile:', error);
      throw error;
    }
  }

  // Update user profile
  static async updateUserProfile(updates: Partial<UserType>): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      console.log('Updating user profile for:', user.uid);
      console.log('Updates:', updates);

      await setDoc(doc(db, 'users', user.uid), {
        ...updates,
        updatedAt: new Date()
      }, { merge: true });

      console.log('User profile updated successfully');

      // Force refresh of current user profile
      await this.getCurrentUserProfile();
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Change user password
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('No user logged in');

      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
    } catch (error) {
      throw error;
    }
  }
}
