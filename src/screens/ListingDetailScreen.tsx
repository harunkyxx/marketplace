import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Listing } from '../types';
import { useUser } from '../context/UserContext';

const { width } = Dimensions.get('window');

const ListingDetailScreen = ({ route, navigation }: any) => {
  const { listing }: { listing: Listing } = route.params;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const { refreshUserProfile } = useUser();

  useEffect(() => {
    checkFavoriteStatus();
    fetchSellerProfile();
  }, [listing.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      checkFavoriteStatus(),
      fetchSellerProfile()
    ]);
    setRefreshing(false);
  };

  const fetchSellerProfile = async () => {
    try {
      const sellerId = listing.userId || listing.sellerId;
      if (sellerId) {
        console.log('Fetching seller profile for sellerId:', sellerId);
        const sellerDoc = await getDoc(doc(db, 'users', sellerId));
        if (sellerDoc.exists()) {
          const sellerData = sellerDoc.data();
          console.log('Seller profile data:', sellerData);
          
          // Fetch seller's listings
          try {
            const listingsQuery = query(
              collection(db, 'listings'),
              where('userId', '==', sellerId),
              where('status', '==', 'active')
            );
            const listingsSnapshot = await getDocs(listingsQuery);
            const listings = listingsSnapshot.docs.map(docItem => ({
              id: docItem.id,
              ...docItem.data()
            }));
            
            // Add listings to seller profile
            sellerData.listings = listings;
            console.log('Seller listings loaded:', listings.length);
          } catch (listingsError) {
            console.error('Error fetching seller listings:', listingsError);
            sellerData.listings = [];
          }
          
          setSellerProfile(sellerData);
        } else {
          console.log('Seller document does not exist');
        }
      } else {
        console.log('No sellerId in listing:', listing);
      }
    } catch (error) {
      console.error('Error fetching seller profile:', error);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const favorites = userData.favorites || [];
        setIsFavorite(favorites.includes(listing.id));
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleMessageSeller = () => {
    if (!auth.currentUser) {
      Alert.alert('Login Required', 'Please login to message the seller');
      return;
    }
    
    // Navigate to chat screen
    const sellerId = listing.userId || listing.sellerId;
    navigation.navigate('Chat', {
      recipientId: sellerId,
      recipientName: sellerProfile ? `${sellerProfile.firstName} ${sellerProfile.lastName}` : 'Seller',
      listingId: listing.id,
      listing: listing,
    });
  };

  const handleCallSeller = () => {
    if (sellerProfile?.phone) {
      Alert.alert(
        'Call Seller',
        `Call ${sellerProfile.firstName} ${sellerProfile.lastName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Call',
            onPress: () => Linking.openURL(`tel:${sellerProfile.phone}`),
          },
        ]
      );
    } else {
      Alert.alert('No Phone Number', 'Seller has not provided a phone number');
    }
  };

  const handleShareListing = async () => {
    try {
      console.log('Starting share process for listing:', listing.id);
      
      // Check if Share API is available
      if (!Share || typeof Share.share !== 'function') {
        console.error('Share API not available');
        Alert.alert('Error', 'Share functionality not available on this device');
        return;
      }

      // Test with a simple share first
      try {
        const testResult = await Share.share({
          message: 'Test share from AussieMarket',
          title: 'Test Share',
        });
        console.log('Test share result:', testResult);
      } catch (testError) {
        console.error('Test share failed:', testError);
      }

      const shareText = `Check out this item: ${listing.title}\n\nPrice: $${listing.price} ${listing.currency || 'AUD'}\nLocation: ${listing.location || 'Australia'}\n\nView on AussieMarket!`;
      
      console.log('Share text prepared:', shareText);
      
      const shareOptions = {
        message: shareText,
        title: listing.title,
        url: `https://aussie-marketplace.web.app/listing/${listing.id}`,
      };
      
      console.log('Share options:', shareOptions);
      
      const result = await Share.share(shareOptions);
      console.log('Share result:', result);

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
          Alert.alert('Success', 'Listing shared successfully!');
        } else {
          console.log('Shared successfully');
          Alert.alert('Success', 'Listing shared successfully!');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error: any) {
      console.error('Error sharing listing:', error);
      console.error('Error details:', {
        message: error?.message || 'Unknown error',
        code: error?.code || 'No code',
        stack: error?.stack || 'No stack'
      });
      Alert.alert('Error', `Failed to share listing: ${error?.message || 'Unknown error'}`);
    }
  };

  const toggleFavorite = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to add favorites.');
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      
      if (isFavorite) {
        await updateDoc(userRef, {
          favorites: arrayRemove(listing.id)
        });
        setIsFavorite(false);
        // Refresh global user profile
        await refreshUserProfile();
        Alert.alert('Removed from Favorites', 'Item removed from your favorites');
      } else {
        await updateDoc(userRef, {
          favorites: arrayUnion(listing.id)
        });
        setIsFavorite(true);
        // Refresh global user profile
        await refreshUserProfile();
        Alert.alert('Added to Favorites', 'Item added to your favorites');
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      Alert.alert('Error', 'Failed to update favorites. Please try again.');
    }
  };

  const renderImageIndicator = () => (
    <View style={styles.imageIndicator}>
      {listing.images?.map((_, index) => (
        <View
          key={index}
          style={[
            styles.indicatorDot,
            index === currentImageIndex && styles.indicatorDotActive,
          ]}
        />
      ))}
    </View>
  );

  const renderImageGallery = () => (
    <View style={styles.imageContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentImageIndex(newIndex);
        }}
      >
        {listing.images?.map((image, index) => (
          <Image
            key={index}
            source={{ uri: image }}
            style={styles.listingImage}
            resizeMode="cover"
          />
        )) || (
          <Image
            source={{ uri: 'https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=No+Image' }}
            style={styles.listingImage}
            resizeMode="cover"
          />
        )}
      </ScrollView>
      {listing.images && listing.images.length > 1 && renderImageIndicator()}
    </View>
  );

  const renderSellerInfo = () => (
    <View style={styles.sellerCard}>
      <View style={styles.sellerHeader}>
        <View style={styles.sellerAvatarContainer}>
          {sellerProfile?.profileImage ? (
            <Image source={{ uri: sellerProfile.profileImage }} style={styles.sellerAvatar} />
          ) : (
            <View style={styles.sellerAvatarPlaceholder}>
              <Ionicons name="person" size={30} color="#666" />
            </View>
          )}
        </View>
        <View style={styles.sellerDetails}>
          <Text style={styles.sellerName}>
            {sellerProfile ? `${sellerProfile.firstName} ${sellerProfile.lastName}` : 'Unknown Seller'}
          </Text>
          <Text style={styles.sellerLocation}>
            {sellerProfile?.location || listing.location}
          </Text>
          <Text style={styles.memberSince}>
            Member since {sellerProfile?.createdAt?.toDate?.()?.toLocaleDateString() || sellerProfile?.createdAt?.toLocaleDateString?.() || 'Recently'}
          </Text>
        </View>
      </View>
      
      <View style={styles.sellerStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{sellerProfile?.listings?.length || 0}</Text>
          <Text style={styles.statLabel}>Listings</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{sellerProfile?.isVerified ? '✓' : '—'}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
      </View>
    </View>
  );

  const renderSellerListings = () => {
    if (!sellerProfile?.listings || sellerProfile.listings.length === 0) {
      return null;
    }

    const otherListings = sellerProfile.listings.filter((item: any) => item.id !== listing.id);
    
    if (otherListings.length === 0) {
      return null;
    }

    return (
      <View style={styles.sellerListingsSection}>
        <Text style={styles.sectionTitle}>More from this Seller</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {otherListings.slice(0, 5).map((item: any) => (
            <TouchableOpacity
              key={item.id}
              style={styles.sellerListingCard}
              onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
            >
              <Image
                source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150x100/4CAF50/FFFFFF?text=No+Image' }}
                style={styles.sellerListingImage}
                resizeMode="cover"
              />
              <View style={styles.sellerListingInfo}>
                <Text style={styles.sellerListingTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.sellerListingPrice}>
                  ${item.price}
                </Text>
                <View style={styles.sellerListingMeta}>
                  <Ionicons name="eye" size={12} color="#666" />
                  <Text style={styles.sellerListingViews}>{item.views || 0}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };



  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={toggleFavorite}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? '#FF3B30' : '#666'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleShareListing}>
            <Ionicons name="share-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Image Gallery */}
        {renderImageGallery()}

        {/* Content */}
        <View style={styles.content}>
          {/* Price and Title */}
          <View style={styles.priceSection}>
            <Text style={styles.price}>
              ${listing.price?.toLocaleString() || '0'} {listing.currency || 'AUD'}
            </Text>
            <Text style={styles.title}>{listing.title}</Text>
          </View>

          {/* Meta Information */}
          <View style={styles.metaSection}>
            <View style={styles.metaItem}>
              <Ionicons name="location" size={16} color="#666" />
              <Text style={styles.metaText}>{listing.location}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time" size={16} color="#666" />
              <Text style={styles.metaText}>
                Listed {listing.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
              </Text>
            </View>
          </View>

        
          {/* Condition and Category */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Condition:</Text>
              <Text style={styles.infoValue}>{listing.condition || 'Not specified'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Category:</Text>
              <Text style={styles.infoValue}>{listing.category || 'Not specified'}</Text>
            </View>
            {listing.subcategory && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Subcategory:</Text>
                <Text style={styles.infoValue}>{listing.subcategory}</Text>
              </View>
            )}
          </View>

          {/* Tags */}
          {listing.tags && listing.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsList}>
                {listing.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description || 'No description available'}</Text>
          </View>

          {/* Seller Information */}
          {renderSellerInfo()}
          
          {/* Seller's Other Listings */}
          {renderSellerListings()}
        </View>
      </ScrollView>

      {/* Bottom Contact Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.messageButton} onPress={handleMessageSeller}>
          <Ionicons name="chatbubble-outline" size={20} color="white" />
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} onPress={handleShareListing}>
          <Ionicons name="share-outline" size={20} color="white" />
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.callButton} onPress={handleCallSeller}>
          <Ionicons name="call-outline" size={20} color="white" />
          <Text style={styles.callButtonText}>Call</Text>
        </TouchableOpacity>
      </View>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 10,
  },
  imageContainer: {
    position: 'relative',
  },
  listingImage: {
    width: width,
    height: 300,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  indicatorDotActive: {
    backgroundColor: 'white',
  },
  content: {
    padding: 20,
  },
  priceSection: {
    marginBottom: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    lineHeight: 26,
  },
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  tagsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  statsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  insightsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  sellerListingsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sellerListingCard: {
    width: 150,
    backgroundColor: 'white',
    borderRadius: 8,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  sellerListingImage: {
    width: 150,
    height: 100,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  sellerListingInfo: {
    padding: 12,
  },
  sellerListingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    lineHeight: 18,
  },
  sellerListingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 6,
  },
  sellerListingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerListingViews: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  descriptionSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  sellerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sellerAvatarContainer: {
    marginRight: 15,
  },
  sellerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  sellerAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sellerLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    color: '#999',
  },
  sellerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 20,
  },
  statItem: {
    alignItems: 'center',
  },

  bottomBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#FF9500',
    borderRadius: 25,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  messageButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  callButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  callButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default ListingDetailScreen;
