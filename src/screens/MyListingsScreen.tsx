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
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Listing } from '../types';

const MyListingsScreen = ({ navigation }: any) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMyListings();
  }, []);

  // Listen for navigation focus to refresh data
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMyListings();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchMyListings = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const listingsRef = collection(db, 'listings');
      const q = query(listingsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const listingsData: Listing[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        listingsData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Listing);
      });
      
      setListings(listingsData);
      console.log('Fetched my listings:', listingsData.length);
    } catch (error) {
      console.error('Error fetching listings:', error);
      Alert.alert('Error', 'Failed to load your listings.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyListings();
    setRefreshing(false);
  };

  const handleDeleteListing = async (listingId: string) => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'listings', listingId));
              Alert.alert('Success', 'Listing deleted successfully!');
              fetchMyListings(); // Refresh the list
            } catch (error) {
              Alert.alert('Error', 'Failed to delete listing.');
            }
          },
        },
      ]
    );
  };

  const handleEditListing = (listing: Listing) => {
    // Navigate to edit listing screen (to be implemented)
    Alert.alert('Edit Listing', 'Edit functionality coming soon!');
  };

  const renderListing = (listing: Listing) => (
    <View key={listing.id} style={styles.listingCard}>
      <Image 
        source={{ uri: listing.images?.[0] || 'https://via.placeholder.com/150' }} 
        style={styles.listingImage} 
      />
      <View style={styles.listingInfo}>
        <Text style={styles.listingTitle} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text style={styles.listingPrice}>
          ${listing.price?.toLocaleString()}
        </Text>
        <Text style={styles.listingCategory}>
          {listing.category} • {listing.condition}
        </Text>
        <Text style={styles.listingLocation}>
          📍 {listing.location}
        </Text>
        <Text style={styles.listingDate}>
          Posted: {listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : 'N/A'}
        </Text>
      </View>
      <View style={styles.listingActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditListing(listing)}
        >
          <Ionicons name="create-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteListing(listing.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading your listings...</Text>
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
        <Text style={styles.title}>My Listings</Text>
      
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {listings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="list-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Listings Yet</Text>
            <Text style={styles.emptySubtitle}>
              Start selling by creating your first listing
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateListing')}
            >
              <Text style={styles.createButtonText}>Create Your First Listing</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listingsContainer}>
            {listings.map(renderListing)}
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
  createButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listingsContainer: {
    padding: 20,
  },
  listingCard: {
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
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  listingPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  listingCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  listingLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  listingDate: {
    fontSize: 12,
    color: '#999',
  },
  listingActions: {
    justifyContent: 'space-between',
    paddingLeft: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#f0f8ff',
  },
  deleteButton: {
    backgroundColor: '#fff5f5',
  },
});

export default MyListingsScreen;
