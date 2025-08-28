import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../context/UserContext';
import { auth, db } from '../config/firebase';
import { AuthService } from '../services/authService';
import NotificationService from '../services/notificationService';
import { doc, getDoc } from 'firebase/firestore';
import { User } from '../types';

const ProfileScreen = ({ navigation }: any) => {
  const { currentUser, refreshUserProfile } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notificationSettings, setNotificationSettings] = useState({
    messages: true,
    favorites: true,
    newListings: true,
    priceChanges: true,
    system: true,
  });

  useEffect(() => {
    // Set loading to false when user data is available
    if (currentUser !== undefined) {
      setIsLoading(false);
      // Load notification settings when user is available
      loadNotificationSettings();
    }
  }, [currentUser]);

  const loadNotificationSettings = async () => {
    try {
      console.log('🔄 Loading notification settings...');
      const settings = await NotificationService.getNotificationPreferences();
      console.log('📱 Loaded notification settings:', settings);
      
      if (settings) {
        setNotificationSettings(settings);
        console.log('✅ Notification settings loaded successfully');
      } else {
        console.log('⚠️ No notification settings found, using defaults');
        setNotificationSettings({
          messages: true,
          favorites: true,
          newListings: true,
          priceChanges: true,
          system: true,
        });
      }
    } catch (error) {
      console.error('❌ Error loading notification settings:', error);
      // Set default settings on error
      setNotificationSettings({
        messages: true,
        favorites: true,
        newListings: true,
        priceChanges: true,
        system: true,
      });
    }
  };

  const handleNotificationToggle = async (key: string, value: boolean) => {
    try {
      console.log('🔄 Toggling notification setting:', key, 'to', value);
      const newSettings = { ...notificationSettings, [key]: value };
      console.log('📱 New notification settings:', newSettings);
      
      setNotificationSettings(newSettings);
      await NotificationService.updateNotificationPreferences(newSettings);
      
      console.log('✅ Notification settings updated successfully');
    } catch (error) {
      console.error('❌ Error updating notification settings:', error);
      // Revert on error
      setNotificationSettings(notificationSettings);
      Alert.alert('Error', 'Failed to update notification settings. Please try again.');
    }
  };



  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUserProfile();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      // Clear saved credentials if user chooses to logout
      await AsyncStorage.removeItem('rememberedEmail');
      await AsyncStorage.removeItem('rememberedPassword');
      await AsyncStorage.removeItem('rememberMe');
      
      await AuthService.logoutUser();
      navigation.navigate('Welcome');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      await AuthService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      Alert.alert('Success', 'Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
    }
  };



  const menuItems = [
    {
      icon: 'create-outline',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      onPress: () => navigation.navigate('EditProfile'),
      showWhenAuthenticated: true,
    },
    {
      icon: 'list-outline',
      title: 'My Listings',
      subtitle: 'View and manage your listings',
      onPress: () => navigation.navigate('MyListings'),
      showWhenAuthenticated: true,
    },
    {
      icon: 'heart-outline',
      title: 'Favorites',
      subtitle: 'Your saved listings',
      onPress: () => navigation.navigate('Favorites'),
      showWhenAuthenticated: true,
    },
    {
      icon: 'chatbubble-outline',
      title: 'Messages',
      subtitle: 'Chat with buyers and sellers',
      onPress: () => navigation.navigate('Conversations'),
      showWhenAuthenticated: true,
    },
    {
      icon: 'information-circle-outline',
      title: 'About',
      subtitle: 'App version and information',
      onPress: () => navigation.navigate('About'),
      showWhenAuthenticated: false,
    },
  ];

  const renderMenuItem = (item: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.menuItem}
      onPress={item.onPress}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIcon}>
          <Ionicons name={item.icon as any} size={24} color="#007AFF" />
        </View>
        <View style={styles.menuText}>
          <Text style={styles.menuTitle}>{item.title}</Text>
          <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* User Info Card */}
        {currentUser ? (
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <TouchableOpacity onPress={() => {
                navigation.navigate('EditProfile');
              }}>
                <Image 
                  source={{ 
                    uri: currentUser.profileImage || 'https://via.placeholder.com/100' 
                  }} 
                  style={styles.avatar} 
                />
              </TouchableOpacity>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {currentUser.firstName} {currentUser.lastName}
                </Text>
                <Text style={styles.userEmail}>{currentUser.email}</Text>
                <View style={styles.userStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="call" size={16} color="#666" />
                    <Text style={styles.statText}>{currentUser.phone}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="location" size={16} color="#666" />
                    <Text style={styles.statText}>{currentUser.location}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="calendar" size={16} color="#666" />
                    <Text style={styles.statText}>
                      Member since {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.avatar} />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>Guest User</Text>
                <Text style={styles.userEmail}>Please login to view profile</Text>
              </View>
            </View>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => 
            item.showWhenAuthenticated ? 
              (currentUser ? renderMenuItem(item, index) : null) : 
              renderMenuItem(item, index)
          )}
        </View>

        {/* Notification Settings */}
        {currentUser && (
          <View style={styles.notificationSection}>
            <Text style={styles.sectionTitle}>Notification Settings</Text>
            
            <View style={styles.notificationOption}>
              <View style={styles.notificationOptionLeft}>
                <Ionicons name="chatbubble-outline" size={20} color="#007AFF" />
                <Text style={styles.notificationOptionText}>Messages</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, notificationSettings.messages && styles.toggleActive]}
                onPress={() => handleNotificationToggle('messages', !notificationSettings.messages)}
              >
                <View style={[styles.toggleThumb, notificationSettings.messages && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

            <View style={styles.notificationOption}>
              <View style={styles.notificationOptionLeft}>
                <Ionicons name="heart-outline" size={20} color="#FF3B30" />
                <Text style={styles.notificationOptionText}>Favorites</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, notificationSettings.favorites && styles.toggleActive]}
                onPress={() => handleNotificationToggle('favorites', !notificationSettings.favorites)}
              >
                <View style={[styles.toggleThumb, notificationSettings.favorites && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

            <View style={styles.notificationOption}>
              <View style={styles.notificationOptionLeft}>
                <Ionicons name="add-circle-outline" size={20} color="#4CAF50" />
                <Text style={styles.notificationOptionText}>New Listings</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, notificationSettings.newListings && styles.toggleActive]}
                onPress={() => handleNotificationToggle('newListings', !notificationSettings.newListings)}
              >
                <View style={[styles.toggleThumb, notificationSettings.newListings && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

            <View style={styles.notificationOption}>
              <View style={styles.notificationOptionLeft}>
                <Ionicons name="trending-up-outline" size={20} color="#FF9800" />
                <Text style={styles.notificationOptionText}>Price Changes</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, notificationSettings.priceChanges && styles.toggleActive]}
                onPress={() => handleNotificationToggle('priceChanges', !notificationSettings.priceChanges)}
              >
                <View style={[styles.toggleThumb, notificationSettings.priceChanges && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

            <View style={styles.notificationOption}>
              <View style={styles.notificationOptionLeft}>
                <Ionicons name="megaphone-outline" size={20} color="#9C27B0" />
                <Text style={styles.notificationOptionText}>System</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, notificationSettings.system && styles.toggleActive]}
                onPress={() => handleNotificationToggle('system', !notificationSettings.system)}
              >
                <View style={[styles.toggleThumb, notificationSettings.system && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

          </View>
        )}

        {/* Logout Button */}
        {currentUser && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              secureTextEntry
              value={passwordData.currentPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
            />
            
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={passwordData.newPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              secureTextEntry
              value={passwordData.confirmPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handlePasswordChange}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  userStats: {
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  menuContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  notificationSection: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  notificationOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  notificationOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  toggle: {
    width: 50,
    height: 30,
    backgroundColor: '#e0e0e0',
    borderRadius: 15,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#007AFF',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    backgroundColor: 'white',
    borderRadius: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },

  logoutButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    margin: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
