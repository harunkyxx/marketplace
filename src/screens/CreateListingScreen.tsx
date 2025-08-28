import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, storage } from '../config/firebase';
import { mockCategories, mockLocations } from '../utils/mockData';
import { Category, Location } from '../types';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';


const CreateListingScreen = ({ navigation }: any) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [condition, setCondition] = useState<string>('');
  const [tags, setTags] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh - in real app, this would reset form or fetch new data
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const uploadImage = async (uri: string) => {
    if (!auth.currentUser) return;

    setIsUploading(true);
    try {
      console.log('Starting image upload for URI:', uri);
      
      // Handle different URI types
      let imageUri = uri;
      if (uri.startsWith('file://')) {
        // Local file URI
        imageUri = uri;
      } else if (uri.startsWith('data:')) {
        // Data URI
        imageUri = uri;
      }
      
      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('Blob created, size:', blob.size);
      
      // Create unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const filename = `listing_${timestamp}_${randomId}.jpg`;
      
      const imageRef = ref(storage, `listings/${auth.currentUser.uid}/${filename}`);
      console.log('Uploading to path:', `listings/${auth.currentUser.uid}/${filename}`);
      
      await uploadBytes(imageRef, blob);
      console.log('Upload completed successfully');
      
      const downloadURL = await getDownloadURL(imageRef);
      console.log('Download URL obtained:', downloadURL);
      
      setImages(prev => [...prev, downloadURL]);
      Alert.alert('Success', 'Image uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      console.error('Error details:', {
        message: error?.message || 'Unknown error',
        code: error?.code || 'No code',
        stack: error?.stack || 'No stack'
      });
      
      let errorMessage = 'Failed to upload image. Please try again.';
      if (error?.code === 'storage/unauthorized') {
        errorMessage = 'Storage access denied. Please check permissions.';
      } else if (error?.code === 'storage/quota-exceeded') {
        errorMessage = 'Storage quota exceeded. Please try again later.';
      } else if (error?.code === 'storage/unknown') {
        errorMessage = 'Unknown storage error. Please check your connection.';
      }
      
      Alert.alert('Upload Error', errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const conditions = [
    { value: 'new', label: 'New' },
    {value: 'like-new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
  ];

  const handleSubmit = async () => {
    if (!title || !description || !price || !selectedCategory || !selectedLocation || !condition) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a listing.');
      return;
    }

    try {
      const listingData = {
        title,
        description,
        price: Number(price),
        category: selectedCategory?.name || '',
        subcategory: selectedSubcategory,
        location: selectedLocation?.name || '',
        condition,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        userId: user.uid,
        user: {
          uid: user.uid,
          firstName: user.displayName?.split(' ')[0] || 'Unknown',
          lastName: user.displayName?.split(' ')[1] || 'Seller',
          email: user.email || '',
          phone: '',
          location: selectedLocation?.name || '',
          profileImage: null,
          isVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          listings: [],
          favorites: [],
          conversations: []
        },
        status: 'active',
        views: 0,
        favorites: 0,
        images: images,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'listings'), listingData);
      

      
      Alert.alert(
        'Success!',
        'Your listing has been created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating listing:', error);
      Alert.alert('Error', 'Failed to create listing. Please try again.');
    }
  };

  const renderCategoryItem = (category: Category) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryItem,
        selectedCategory?.id === category.id && styles.categoryItemSelected,
      ]}
      onPress={() => {
        setSelectedCategory(category);
        setSelectedSubcategory('');
      }}
    >
      <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
        <Ionicons name={category.icon as any} size={24} color="white" />
      </View>
      <Text style={[
        styles.categoryName,
        selectedCategory?.id === category.id && styles.categoryNameSelected,
      ]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  const renderSubcategoryItem = (subcategory: any) => (
    <TouchableOpacity
      key={subcategory.id}
      style={[
        styles.subcategoryItem,
        selectedSubcategory === subcategory.id && styles.subcategoryItemSelected,
      ]}
      onPress={() => setSelectedSubcategory(subcategory.id)}
    >
      <Text style={[
        styles.subcategoryName,
        selectedSubcategory === subcategory.id && styles.subcategoryNameSelected,
      ]}>
        {subcategory.name}
      </Text>
    </TouchableOpacity>
  );

  const renderLocationItem = (location: Location) => (
    <TouchableOpacity
      key={location.id}
      style={[
        styles.locationItem,
        selectedLocation?.id === location.id && styles.locationItemSelected,
      ]}
      onPress={() => setSelectedLocation(location)}
    >
      <Text style={[
        styles.locationName,
        selectedLocation?.id === location.id && styles.locationNameSelected,
      ]}>
        {location.name}, {location.state}
      </Text>
    </TouchableOpacity>
  );

  const renderConditionItem = (conditionItem: any) => (
    <TouchableOpacity
      key={conditionItem.value}
      style={[
        styles.conditionItem,
        condition === conditionItem.value && styles.conditionItemSelected,
      ]}
      onPress={() => setCondition(conditionItem.value)}
    >
      <Text style={[
        styles.conditionText,
        condition === conditionItem.value && styles.conditionTextSelected,
      ]}>
        {conditionItem.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Listing</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter listing title"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your item in detail"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />

          <Text style={styles.label}>Price (AUD) *</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <Text style={styles.label}>Select Category *</Text>
          <View style={styles.categoriesGrid}>
            {mockCategories.map(renderCategoryItem)}
          </View>

          {selectedCategory && (
            <>
              <Text style={styles.label}>Select Subcategory</Text>
              <View style={styles.subcategoriesContainer}>
                {selectedCategory.subcategories.map(renderSubcategoryItem)}
              </View>
            </>
          )}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.label}>Select Location *</Text>
          <View style={styles.locationsContainer}>
            {mockLocations.map(renderLocationItem)}
          </View>
        </View>

        {/* Condition */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Condition</Text>
          <Text style={styles.label}>Select Condition *</Text>
          <View style={styles.conditionsContainer}>
            {conditions.map(renderConditionItem)}
          </View>
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <Text style={styles.label}>Add Photos *</Text>
          <Text style={styles.helperText}>
            Add at least one photo to help buyers see your item clearly
          </Text>
          
          {/* Image Buttons */}
          <View style={styles.imageButtonsContainer}>
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Ionicons name="images-outline" size={24} color="#4CAF50" />
              <Text style={styles.imageButtonText}>Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={24} color="#007AFF" />
              <Text style={styles.imageButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>

          {/* Uploading Indicator */}
          {isUploading && (
            <View style={styles.uploadingContainer}>
              <Text style={styles.uploadingText}>Uploading image...</Text>
            </View>
          )}

          {/* Images Preview */}
          {images.length > 0 && (
            <View style={styles.imagesPreviewContainer}>
              <Text style={styles.label}>Uploaded Photos ({images.length})</Text>
              <View style={styles.imagesGrid}>
                {images.map((image, index) => (
                  <View key={index} style={styles.imagePreviewItem}>
                    <Image source={{ uri: image }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <Text style={styles.label}>Tags (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter tags separated by commas"
            value={tags}
            onChangeText={setTags}
          />
          <Text style={styles.helperText}>
            Tags help buyers find your listing. Example: modern, family, backyard
          </Text>
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Create Listing</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 15,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: -10,
    marginBottom: 15,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  categoryItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: '#2196F3',
    fontWeight: '600',
  },
  subcategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  subcategoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  subcategoryItemSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  subcategoryName: {
    fontSize: 14,
    color: '#333',
  },
  subcategoryNameSelected: {
    color: 'white',
  },
  locationsContainer: {
    marginBottom: 15,
  },
  locationItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  locationItemSelected: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
  },
  locationName: {
    fontSize: 16,
    color: '#333',
  },
  locationNameSelected: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  conditionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  conditionItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  conditionItemSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  conditionText: {
    fontSize: 14,
    color: '#333',
  },
  conditionTextSelected: {
    color: 'white',
  },
  submitSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  // Image styles
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  imageButton: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 120,
  },
  imageButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  uploadingContainer: {
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginBottom: 15,
  },
  uploadingText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  imagesPreviewContainer: {
    marginBottom: 15,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imagePreviewItem: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 12,
  },
});

export default CreateListingScreen;
