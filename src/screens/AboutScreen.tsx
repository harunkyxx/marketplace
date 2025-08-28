import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AboutScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About AussieMarket</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* App Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="storefront" size={60} color="#007AFF" />
          </View>
          <Text style={styles.appName}>AussieMarket</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        {/* App Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Welcome to AussieMarket</Text>
          <Text style={styles.description}>
            AussieMarket is your local marketplace for buying and selling items in Australia. 
            Connect with your community, discover great deals, and find exactly what you're looking for.
          </Text>
        </View>

        {/* How to Use Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Use</Text>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="search" size={24} color="#007AFF" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Browse Listings</Text>
              <Text style={styles.featureDescription}>
                Explore items for sale in your area. Use filters to find exactly what you need.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="add-circle" size={24} color="#4CAF50" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Create Listings</Text>
              <Text style={styles.featureDescription}>
                Sell your items by creating detailed listings with photos and descriptions.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="chatbubble" size={24} color="#FF9800" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Message Users</Text>
              <Text style={styles.featureDescription}>
                Chat directly with buyers and sellers to negotiate prices and arrange meetings.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="heart" size={24} color="#FF3B30" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Save Favorites</Text>
              <Text style={styles.featureDescription}>
                Save interesting items to your favorites list for easy access later.
              </Text>
            </View>
          </View>
        </View>

        {/* Safety Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Tips</Text>
          
          <View style={styles.tipItem}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.tipText}>
              Meet in public places when buying or selling items
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.tipText}>
              Verify item condition before completing transactions
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.tipText}>
              Use secure payment methods and avoid sharing personal information
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.tipText}>
              Report suspicious activity to our support team
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <Ionicons name="location" size={32} color="#007AFF" />
              <Text style={styles.featureCardTitle}>Local Focus</Text>
              <Text style={styles.featureCardDescription}>
                Connect with people in your area
              </Text>
            </View>
            
            <View style={styles.featureCard}>
              <Ionicons name="camera" size={32} color="#007AFF" />
              <Text style={styles.featureCardTitle}>Photo Listings</Text>
              <Text style={styles.featureCardDescription}>
                High-quality images for better visibility
              </Text>
            </View>
            
            <View style={styles.featureCard}>
              <Ionicons name="notifications" size={32} color="#007AFF" />
              <Text style={styles.featureCardTitle}>Real-time Updates</Text>
              <Text style={styles.featureCardDescription}>
                Instant notifications for messages and updates
              </Text>
            </View>
            
            <View style={styles.featureCard}>
              <Ionicons name="search" size={32} color="#007AFF" />
              <Text style={styles.featureCardTitle}>Smart Search</Text>
              <Text style={styles.featureCardDescription}>
                Find items quickly with advanced filters
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact & Support</Text>
          
          <View style={styles.contactItem}>
            <Ionicons name="mail" size={20} color="#007AFF" />
            <Text style={styles.contactText}>support@aussiemarket.com.au</Text>
          </View>
          
          <View style={styles.contactItem}>
            <Ionicons name="globe" size={20} color="#007AFF" />
            <Text style={styles.contactText}>www.aussiemarket.com.au</Text>
          </View>
          
          <View style={styles.contactItem}>
            <Ionicons name="call" size={20} color="#007AFF" />
            <Text style={styles.contactText}>1300 AUSTRALIA</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ in Australia
          </Text>
          <Text style={styles.footerSubtext}>
            © 2024 AussieMarket. All rights reserved.
          </Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  featureCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  featureCardDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#999',
  },
});

export default AboutScreen;
