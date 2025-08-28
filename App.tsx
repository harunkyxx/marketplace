import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { UserProvider } from './src/context/UserContext';
import NotificationService from './src/services/notificationService';

// Import screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import HomeScreen from './src/screens/HomeScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import SearchScreen from './src/screens/SearchScreen';
import CreateListingScreen from './src/screens/CreateListingScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ListingDetailScreen from './src/screens/ListingDetailScreen';
import CategoryListingsScreen from './src/screens/CategoryListingsScreen';
import ChatScreen from './src/screens/ChatScreen';
import ConversationsScreen from './src/screens/ConversationsScreen';
import MyListingsScreen from './src/screens/MyListingsScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import AboutScreen from './src/screens/AboutScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Categories') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Create') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Create" component={CreateListingScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    // Set up notification listeners
    const cleanup = NotificationService.setupNotificationListeners();
    
    // Request notification permissions on app start
    NotificationService.requestPermissions();
    
    return cleanup;
  }, []);

  return (
    <PaperProvider>
      <UserProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* Authentication Screens */}
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          
          {/* Main App Screens */}
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen 
            name="ListingDetail" 
            component={ListingDetailScreen}
            options={{ 
              headerShown: true,
              title: 'Listing Details',
              headerStyle: {
                backgroundColor: '#4CAF50',
              },
              headerTintColor: 'white',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
                                <Stack.Screen 
                        name="CategoryListings" 
                        component={CategoryListingsScreen}
                        options={{ 
                          headerShown: true,
                          title: 'Category Listings',
                          headerStyle: {
                            backgroundColor: '#4CAF50',
                          },
                          headerTintColor: 'white',
                          headerTitleStyle: {
                            fontWeight: 'bold',
                          },
                        }}
                      />
                      <Stack.Screen 
                        name="Chat" 
                        component={ChatScreen}
                        options={{ 
                          headerShown: false,
                        }}
                      />
                      <Stack.Screen 
                        name="Conversations" 
                        component={ConversationsScreen}
                        options={{ 
                          headerShown: true,
                          title: 'Messages',
                          headerStyle: {
                            backgroundColor: '#4CAF50',
                          },
                          headerTintColor: 'white',
                          headerTitleStyle: {
                            fontWeight: 'bold',
                          },
                        }}
                      />
                      <Stack.Screen 
                        name="MyListings" 
                        component={MyListingsScreen}
                        options={{ 
                          headerShown: false,
                        }}
                      />
                      <Stack.Screen 
                        name="Favorites" 
                        component={FavoritesScreen}
                        options={{ 
                          headerShown: false,
                        }}
                      />
                      <Stack.Screen 
                        name="EditProfile" 
                        component={EditProfileScreen}
                        options={{ 
                          headerShown: false,
                        }}
                      />
                      <Stack.Screen 
                        name="About" 
                        component={AboutScreen}
                        options={{ 
                          headerShown: false,
                        }}
                      />
                    </Stack.Navigator>
      </NavigationContainer>
      </UserProvider>
    </PaperProvider>
  );
}
