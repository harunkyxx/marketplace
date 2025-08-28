import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../config/firebase';
import { AuthService } from '../services/authService';
import { User } from '../types';

interface UserContextType {
  currentUser: User | null;
  refreshUserProfile: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const refreshUserProfile = async () => {
    try {
      console.log('Refreshing user profile...');
      const userProfile = await AuthService.getCurrentUserProfile();
      console.log('User profile refreshed:', userProfile ? 'Success' : 'No profile found');
      setCurrentUser(userProfile);
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      // Don't clear current user on error, just log it
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    try {
      await AuthService.updateUserProfile(updates);
      // Refresh the profile data after update
      await refreshUserProfile();
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await refreshUserProfile();
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    refreshUserProfile,
    updateUserProfile,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
