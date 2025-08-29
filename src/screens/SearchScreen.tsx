import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  FlatList,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { mockCategories, mockLocations } from '../utils/mockData';
import { Listing, Category, Location, SearchFilters } from '../types';

const SearchScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesQuery = searchQuery === '' || 
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === '' || 
        listing.category === selectedCategory;
      
      const matchesLocation = selectedLocation === '' || 
        listing.location.includes(selectedLocation);
      
      const matchesPrice = (minPrice === '' || listing.price >= Number(minPrice)) &&
        (maxPrice === '' || listing.price <= Number(maxPrice));

      return matchesQuery && matchesCategory && matchesLocation && matchesPrice;
    });
  }, [listings, searchQuery, selectedCategory, selectedLocation, minPrice, maxPrice]);

  const renderListingItem = ({ item }: { item: Listing }) => (
    <TouchableOpacity
      style={styles.listingItem}
      onPress={() => navigation.navigate('ListingDetail', { listing: item })}
    >
      <View style={styles.listingImageContainer}>
        {item.images && item.images.length > 0 ? (
          <Image
            source={{ uri: item.images[0] }}
            style={styles.listingImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons name="image-outline" size={32} color="#ccc" />
            <Text style={styles.noImageText}>No Image</Text>
          </View>
        )}
      </View>
      <View style={styles.listingContent}>
        <Text style={styles.listingTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.listingPrice}>
          ${item.price?.toLocaleString() || '0'} {item.currency || 'AUD'}
        </Text>
        <View style={styles.listingMeta}>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={14} color="#666" />
            <Text style={styles.locationText}>{item.location || 'Location not specified'}</Text>
          </View>
          <Text style={styles.listingDate}>
            {item.createdAt?.toLocaleDateString?.() || 'Recently'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFilterOption = (label: string, value: string, onPress: () => void) => (
    <TouchableOpacity
      style={[styles.filterOption, value !== '' && styles.filterOptionActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterOptionText, value !== '' && styles.filterOptionTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  useEffect(() => {
    fetchListings();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  };

  const fetchListings = async () => {
    try {
      setIsLoading(true);
      const listingsRef = collection(db, 'listings');
      // Temporarily remove orderBy to avoid index requirement
      const q = query(
        listingsRef,
        where('status', '==', 'active')
      );
      
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
      
      // Sort manually in memory (handle null/undefined dates)
      listingsData.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      setListings(listingsData);
      console.log('Fetched all listings:', listingsData.length);
    } catch (error) {
      console.error('Error fetching listings:', error);
      Alert.alert('Error', 'Failed to load listings.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedLocation('');
    setMinPrice('');
    setMaxPrice('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for anything..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>Filters</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {/* Category Filter */}
          <Text style={styles.filterLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
            {renderFilterOption('All', '', () => setSelectedCategory(''))}
            {mockCategories.map((category) => (
              <View key={category.name}>
                {renderFilterOption(
                  category.name,
                  category.name,
                  () => setSelectedCategory(category.name)
                )}
              </View>
            ))}
          </ScrollView>

          {/* Location Filter */}
          <Text style={styles.filterLabel}>Location</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
            {renderFilterOption('All', '', () => setSelectedLocation(''))}
            {mockLocations.map((location) => (
              <View key={location.name}>
                {renderFilterOption(
                  location.name,
                  location.name,
                  () => setSelectedLocation(location.name)
                )}
              </View>
            ))}
          </ScrollView>

          {/* Price Filter */}
          <Text style={styles.filterLabel}>Price Range</Text>
          <View style={styles.priceContainer}>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Min"
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
            <Text style={styles.priceSeparator}>to</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max"
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
          </View>
          
          {/* Quick Price Buttons */}
          <View style={styles.quickPriceContainer}>
            <TouchableOpacity 
              style={[styles.quickPriceButton, minPrice === '0' && maxPrice === '100' && styles.quickPriceButtonActive]}
              onPress={() => { setMinPrice('0'); setMaxPrice('100'); }}
            >
              <Text style={[styles.quickPriceText, minPrice === '0' && maxPrice === '100' && styles.quickPriceTextActive]}>
                Under $100
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickPriceButton, minPrice === '100' && maxPrice === '500' && styles.quickPriceButtonActive]}
              onPress={() => { setMinPrice('100'); setMaxPrice('500'); }}
            >
              <Text style={[styles.quickPriceText, minPrice === '100' && maxPrice === '500' && styles.quickPriceTextActive]}>
                $100 - $500
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickPriceButton, minPrice === '500' && maxPrice === '1000' && styles.quickPriceButtonActive]}
              onPress={() => { setMinPrice('500'); setMaxPrice('1000'); }}
            >
              <Text style={[styles.quickPriceText, minPrice === '500' && maxPrice === '1000' && styles.quickPriceTextActive]}>
                $500 - $1K
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickPriceButton, minPrice === '1000' && maxPrice === '' && styles.quickPriceButtonActive]}
              onPress={() => { setMinPrice('1000'); setMaxPrice(''); }}
            >
              <Text style={[styles.quickPriceText, minPrice === '1000' && maxPrice === '' && styles.quickPriceTextActive]}>
                Over $1K
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Clear Filters Button */}
          {(selectedCategory !== '' || selectedLocation !== '' || minPrice !== '' || maxPrice !== '') && (
            <TouchableOpacity 
              style={styles.clearFiltersButton}
              onPress={() => {
                setSelectedCategory('');
                setSelectedLocation('');
                setMinPrice('');
                setMaxPrice('');
              }}
            >
              <Ionicons name="refresh-outline" size={16} color="#007AFF" />
              <Text style={styles.clearFiltersText}>Clear All Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Results */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          {filteredListings.length} results found
        </Text>
      </View>

      <FlatList
        data={filteredListings}
        renderItem={renderListingItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.resultsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  filtersContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
    marginTop: 15,
  },
  filterOptions: {
    marginBottom: 10,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
  },
  filterOptionTextActive: {
    color: 'white',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  priceInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  currencySymbol: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
    fontWeight: '500',
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  priceSeparator: {
    marginHorizontal: 15,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  quickPriceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  quickPriceButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
    minWidth: '48%',
  },
  quickPriceButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  quickPriceText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  quickPriceTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f0f8ff',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginTop: 10,
  },

  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  resultsList: {
    padding: 20,
  },
  listingItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listingImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  listingImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  listingContent: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  listingPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  listingMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  listingDate: {
    fontSize: 12,
    color: '#999',
  },
});

export default SearchScreen;
