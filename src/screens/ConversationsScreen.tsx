import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../config/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { MessagingService, Conversation, Message } from '../services/messagingService';

interface ConversationItem {
  id: string;
  otherParticipant: {
    id: string;
    name: string;
    avatar?: string;
  };
  lastMessage?: Message;
  lastMessageTime?: Date;
  listingId?: string;
  listingTitle?: string;
  unreadCount: number;
  updatedAt: Date;
  displayAvatar?: string;
}

export default function ConversationsScreen() {
  const navigation = useNavigation();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load conversations with real-time updates
  const loadConversations = useCallback(async (): Promise<(() => void) | undefined> => {
    if (!auth.currentUser) {
      setConversations([]);
      setIsLoading(false);
      return undefined;
    }

    try {
      setIsLoading(true);
      
      // Query conversations where current user is a participant
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', auth.currentUser.uid)
        // Note: orderBy removed temporarily due to missing index
        // orderBy('updatedAt', 'desc')
      );

      // Set up real-time listener
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        console.log('🔥 ConversationsScreen: Found', snapshot.docs.length, 'conversation documents');
        const conversationsData: ConversationItem[] = [];
        
        for (const docSnapshot of snapshot.docs) {
          try {
            const conversationData = docSnapshot.data();
            console.log('📝 Processing conversation:', docSnapshot.id, {
              participants: conversationData.participants,
              listingId: conversationData.listingId,
              updatedAt: conversationData.updatedAt,
              lastMessage: conversationData.lastMessage
            });
            
            // Get the other participant's ID
            const otherParticipantId = conversationData.participants.find(
              (id: string) => id !== auth.currentUser?.uid
            );
            
            if (otherParticipantId) {
              // Get other participant's user data
              let otherParticipantName = 'Unknown User';
              let otherParticipantAvatar: string | undefined;
              
              try {
                const userDoc = await getDoc(doc(db, 'users', otherParticipantId));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  otherParticipantName = userData.name || 'Unknown User';
                  otherParticipantAvatar = userData.avatar;
                }
              } catch (error) {
                console.log('Could not fetch user data for:', otherParticipantId);
              }
              
              // Always show the other participant's avatar
              const displayAvatar = otherParticipantAvatar;

              // Get listing data if it exists
              let listingTitle: string | undefined;
              if (conversationData.listingId) {
                try {
                  const listingDoc = await getDoc(doc(db, 'listings', conversationData.listingId));
                  if (listingDoc.exists()) {
                    const listingData = listingDoc.data();
                    listingTitle = listingData.title;
                  }
                } catch (error) {
                  console.log('Could not fetch listing data for:', conversationData.listingId);
                }
              }

              // Calculate unread count
              let unreadCount = 0;
              if (conversationData.messages && Array.isArray(conversationData.messages)) {
                unreadCount = conversationData.messages.filter(
                  (msg: any) => {
                    return msg && 
                           msg.user && 
                           msg.user._id && 
                           msg.user._id !== auth.currentUser?.uid &&
                           msg.createdAt && 
                           msg.createdAt.toDate && 
                           (new Date().getTime() - msg.createdAt.toDate().getTime()) < (30 * 24 * 60 * 60 * 1000);
                  }
                ).length;
              }
              
              // Also check if there's a lastMessage that's unread
              if (conversationData.lastMessage && 
                  conversationData.lastMessage.user && 
                  conversationData.lastMessage.user._id !== auth.currentUser?.uid) {
                unreadCount = Math.max(unreadCount, 1);
              }

              conversationsData.push({
                id: docSnapshot.id,
                otherParticipant: {
                  id: otherParticipantId,
                  name: otherParticipantName,
                  avatar: otherParticipantAvatar,
                },
                lastMessage: conversationData.lastMessage,
                lastMessageTime: conversationData.lastMessageTime?.toDate(),
                listingId: conversationData.listingId,
                listingTitle,
                unreadCount,
                updatedAt: conversationData.updatedAt?.toDate() || new Date(),
                displayAvatar,
              });
            }
          } catch (error) {
            console.error('Error processing conversation:', error);
          }
        }

        // Remove duplicate conversations
        const uniqueConversations = new Map<string, ConversationItem>();
        
        conversationsData.forEach((conv) => {
          const participantKey = `${[auth.currentUser?.uid, conv.otherParticipant.id].sort().join('_')}_${conv.listingId || 'direct'}`;
          
          if (!uniqueConversations.has(participantKey)) {
            uniqueConversations.set(participantKey, conv);
            console.log('✅ Added unique conversation:', participantKey, '->', conv.id);
          } else {
            const existing = uniqueConversations.get(participantKey)!;
            if (conv.updatedAt > existing.updatedAt) {
              uniqueConversations.set(participantKey, conv);
              console.log('🔄 Replaced with newer conversation:', participantKey, '->', conv.id);
            } else {
              console.log('⏭️ Skipped older conversation:', participantKey, '->', conv.id);
            }
          }
        });
        
        const finalConversations = Array.from(uniqueConversations.values());
        finalConversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        
        setConversations(finalConversations);
        console.log('🎯 Final result: Displaying', finalConversations.length, 'unique conversations');
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load conversations. Please try again.');
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load conversations when screen focuses
  useFocusEffect(
    useCallback(() => {
      const unsubscribePromise = loadConversations();
      return () => {
        if (unsubscribePromise) {
          unsubscribePromise.then(unsub => {
            if (unsub) unsub();
          });
        }
      };
    }, [loadConversations])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, [loadConversations]);

  const navigateToChat = useCallback((conversation: ConversationItem) => {
    (navigation as any).navigate('Chat', {
      conversationId: conversation.id,
      recipientId: conversation.otherParticipant.id,
      recipientName: conversation.otherParticipant.name,
      listingId: conversation.listingId,
      listingTitle: conversation.listingTitle,
    });
  }, [navigation]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from Firestore
              const conversationRef = doc(db, 'conversations', conversationId);
              await deleteDoc(conversationRef);
              
              // Remove from local state
              setConversations(prev => prev.filter(conv => conv.id !== conversationId));
              
              Alert.alert('Success', 'Conversation deleted successfully.');
            } catch (error) {
              console.error('Error deleting conversation:', error);
              Alert.alert('Error', 'Failed to delete conversation. Please try again.');
            }
          }
        }
      ]
    );
  }, []);

  const formatTimestamp = (timestamp?: Date) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const diffInHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  const renderConversationItem = ({ item }: { item: ConversationItem }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => navigateToChat(item)}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {item.displayAvatar ? (
          <Image 
            source={{ uri: item.displayAvatar }} 
            style={styles.avatar}
          />
        ) : (
          <View style={styles.defaultAvatar}>
            <Ionicons name="person" size={28} color="#fff" />
          </View>
        )}
        {item.unreadCount > 0 && (
          <View style={[
            styles.unreadBadge,
            item.unreadCount > 99 && styles.unreadBadgeLarge,
            item.unreadCount > 9 && styles.unreadBadgeMedium
          ]}>
            <Text style={[
              styles.unreadText,
              item.unreadCount > 99 && styles.unreadTextLarge
            ]}>
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </Text>
          </View>
        )}
      </View>

      {/* Conversation Content */}
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.participantName} numberOfLines={1}>
            {item.otherParticipant.name}
          </Text>
          <Text style={styles.timestamp}>
            {formatTimestamp(item.lastMessageTime)}
          </Text>
        </View>
        
        {item.listingTitle && (
          <Text style={styles.listingTitle} numberOfLines={1}>
            📦 {item.listingTitle}
          </Text>
        )}
        
        {item.lastMessage ? (
          <Text style={styles.lastMessage} numberOfLines={2}>
            {item.lastMessage.user._id === auth.currentUser?.uid ? 'You: ' : ''}
            {item.lastMessage.text}
          </Text>
        ) : (
          <Text style={styles.noMessage}>No messages yet</Text>
        )}
      </View>

      {/* Delete Button */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteConversation(item.id)}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>

      {/* Arrow */}
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={80} color="#ddd" />
      <Text style={styles.emptyTitle}>No Conversations Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start messaging sellers to begin conversations about listings.
      </Text>
      
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => (navigation as any).navigate('Home')}
      >
        <Ionicons name="search-outline" size={20} color="white" />
        <Text style={styles.browseButtonText}>Browse Listings</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {conversations.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#495057',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  browseButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 20,
  },
  conversationItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
  },
  defaultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  unreadTextLarge: {
    fontSize: 10,
    fontWeight: '700',
  },
  unreadBadgeMedium: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
  },
  unreadBadgeLarge: {
    minWidth: 28,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  conversationContent: {
    flex: 1,
    marginRight: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  listingTitle: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  noMessage: {
    fontSize: 14,
    color: '#adb5bd',
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
});
