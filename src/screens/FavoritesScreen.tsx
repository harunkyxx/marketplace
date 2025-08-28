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
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Listing } from '../types';

const FavoritesScreen = ({ navigation }: any) => {
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFavorites();
  }, []);

  // Listen for navigation focus to refresh data
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchFavorites();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchFavorites = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Get user's favorites from user document
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const favoriteIds = userData.favorites || [];

      if (favoriteIds.length === 0) {
        setFavorites([]);
        setIsLoading(false);
        return;
      }

      // Fetch favorite listings
      if (favoriteIds.length === 0) {
        setFavorites([]);
        setIsLoading(false);
        return;
      }

      const listingsRef = collection(db, 'listings');
      const favoritesQuery = query(listingsRef, where('__name__', 'in', favoriteIds));
      const querySnapshot = await getDocs(favoritesQuery);
      
      const favoritesData: Listing[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        favoritesData.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Listing);
      });
      
      setFavorites(favoritesData);
      console.log('Fetched favorites:', favoritesData.length);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      Alert.alert('Error', 'Failed to load your favorites.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  };

  const handleRemoveFavorite = async (listingId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Remove from user's favorites
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        favorites: arrayRemove(listingId)
      });

      // Update local state
      setFavorites(prev => prev.filter(item => item.id !== listingId));
      Alert.alert('Success', 'Removed from favorites!');
    } catch (error) {
      Alert.alert('Error', 'Failed to remove from favorites.');
    }
  };

  const handleViewListing = (listing: Listing) => {
    navigation.navigate('ListingDetail', { listing });
  };

  const renderFavorite = (listing: Listing) => (
    <TouchableOpacity 
      key={listing.id} 
      style={styles.favoriteCard}
      onPress={() => handleViewListing(listing)}
    >
      <Image 
        source={{ uri: listing.images?.[0] || 'https://via.placeholder.com/150' }} 
        style={styles.favoriteImage} 
      />
      <View style={styles.favoriteInfo}>
        <Text style={styles.favoriteTitle} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text style={styles.favoritePrice}>
          ${listing.price?.toLocaleString()}
        </Text>
        <Text style={styles.favoriteCategory}>
          {listing.category} • {listing.condition}
        </Text>
        <Text style={styles.favoriteLocation}>
          📍 {listing.location}
        </Text>
        <Text style={styles.favoriteSeller}>
          Seller: {listing.sellerName}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => handleRemoveFavorite(listing.id)}
      >
        <Ionicons name="heart-dislike" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading your favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>My Favorites</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptySubtitle}>
              Start browsing listings and add items to your favorites
            </Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.browseButtonText}>Browse Listings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.favoritesContainer}>
            {favorites.map(renderFavorite)}
          </View>
        )}
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  browseButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  favoritesContainer: {
    padding: 20,
  },
  favoriteCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    padding: 15,
  },
  favoriteImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  favoritePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  favoriteCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  favoriteLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  favoriteSeller: {
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
  },
});

export default FavoritesScreen;
