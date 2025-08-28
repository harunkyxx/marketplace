import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../config/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  onSnapshot,
  collection,
  addDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { MessagingService, Message } from '../services/messagingService';

interface ChatScreenProps {
  route: {
    params: {
      conversationId?: string;
      recipientId: string;
      recipientName: string;
      listingId?: string;
      listingTitle?: string;
    };
  };
  navigation: any;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
  const { conversationId: existingConversationId, recipientId, recipientName, listingId, listingTitle } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(existingConversationId || null);
  const [isTyping, setIsTyping] = useState(false);
  const [recipientAvatar, setRecipientAvatar] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load or create conversation
  const initializeConversation = useCallback(async () => {
    if (!auth.currentUser || !recipientId) return;

    try {
      let convId = existingConversationId;

      if (!convId) {
        // Create new conversation
        convId = await MessagingService.getOrCreateConversation(
          auth.currentUser.uid,
          recipientId,
          listingId
        );
        setConversationId(convId);
      } else {
        setConversationId(convId);
      }

      // Get recipient avatar
      try {
        const recipientDoc = await getDoc(doc(db, 'users', recipientId));
        if (recipientDoc.exists()) {
          const recipientData = recipientDoc.data();
          setRecipientAvatar(recipientData.avatar || null);
        }
      } catch (error) {
        console.log('Could not fetch recipient avatar');
      }

    } catch (error) {
      console.error('Error initializing conversation:', error);
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    }
  }, [existingConversationId, recipientId, listingId]);

    // Subscribe to real-time messages
  const subscribeToMessages = useCallback((convId: string) => {
    if (!convId) return;

    const messagesRef = collection(db, 'conversations', convId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Received snapshot with', snapshot.docs.length, 'messages');
      
      const newMessages: Message[] = [];
      const seenIds = new Set<string>(); // Track seen message IDs
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Processing message:', doc.id, data);
        
        // Check if message data is valid and not already seen
        if (data.text && data.user && data.user._id && !seenIds.has(doc.id)) {
          seenIds.add(doc.id); // Mark as seen
          
          const message: Message = {
            id: doc.id,
            text: data.text,
            createdAt: data.createdAt?.toDate() || new Date(),
            user: {
              _id: data.user._id,
              name: data.user.name || 'Unknown User',
              avatar: data.user.avatar || undefined,
            },
            image: data.image,
            system: data.system,
          };
          
          newMessages.push(message);
          console.log('Added message:', message);
        } else {
          if (seenIds.has(doc.id)) {
            console.log('Skipped duplicate message:', doc.id);
          } else {
            console.log('Skipped invalid message:', data);
          }
        }
      });

      console.log('Total unique valid messages:', newMessages.length);
      
      // Sort by creation time
      newMessages.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
        const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();
        return dateA.getTime() - dateB.getTime();
      });
      
      // Ensure no duplicates in state by comparing with existing messages
      setMessages(prevMessages => {
        const existingIds = new Set(prevMessages.map(msg => msg.id));
        const trulyUniqueMessages = newMessages.filter(msg => !existingIds.has(msg.id));
        
        if (trulyUniqueMessages.length !== newMessages.length) {
          console.log('Filtered out', newMessages.length - trulyUniqueMessages.length, 'duplicates from state');
        }
        
        // Merge existing and new messages, ensuring uniqueness
        const allMessages = [...prevMessages, ...trulyUniqueMessages];
        const finalMessages = allMessages.filter((msg, index, self) => 
          index === self.findIndex(m => m.id === msg.id)
        );
        
        console.log('Final state: existing + new =', finalMessages.length, 'messages');
        return finalMessages;
      });

      // Scroll to bottom on new message
      if (newMessages.length > 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    unsubscribeRef.current = unsubscribe;
    return unsubscribe;
  }, []);

  // Initialize conversation and subscribe to messages
  useFocusEffect(
    useCallback(() => {
      initializeConversation();
      
      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    }, [initializeConversation])
  );

  // Subscribe to messages when conversation ID is available
  useEffect(() => {
    if (conversationId) {
      console.log('Setting up message listener for conversation:', conversationId);
      const unsubscribe = subscribeToMessages(conversationId);
      return () => {
        console.log('Cleaning up message listener for conversation:', conversationId);
        if (unsubscribe) unsubscribe();
      };
    }
  }, [conversationId]); // Removed subscribeToMessages dependency

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (conversationId) {
      // Force refresh by re-subscribing
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      const unsubscribe = subscribeToMessages(conversationId);
      if (unsubscribe) {
        unsubscribeRef.current = unsubscribe;
      }
    }
    setRefreshing(false);
  }, [conversationId, subscribeToMessages]);

  const sendMessage = useCallback(async () => {
    if (!message.trim() || !auth.currentUser || !conversationId) {
      return;
    }

    setIsLoading(true);
    try {
             // Create message data - only include avatar if it exists
       const userData: any = {
         _id: auth.currentUser.uid,
         name: auth.currentUser.displayName || 'Unknown User',
       };
       
       // Only add avatar if it exists and is not null/undefined
       if (auth.currentUser.photoURL) {
         userData.avatar = auth.currentUser.photoURL;
       }
       
       const messageData = {
         text: message.trim(),
         user: userData,
         createdAt: serverTimestamp(),
       };

      console.log('Sending message with data:', messageData);
      
      // Add message to Firestore
      try {
        const messageId = await MessagingService.sendMessage(conversationId, messageData);
        console.log('Message sent successfully via service, ID:', messageId);
      } catch (error) {
        console.error('Error sending message via service:', error);
        // Fallback: add message directly to conversation
        const conversationRef = doc(db, 'conversations', conversationId);
        const messagesRef = collection(conversationRef, 'messages');
        
        // Create clean message data without undefined fields
        const cleanMessageData = {
          text: messageData.text,
          user: userData, // Use the clean userData we created above
          createdAt: messageData.createdAt
        };
        
        console.log('Using fallback method with clean data:', cleanMessageData);
        const fallbackId = await addDoc(messagesRef, cleanMessageData);
        console.log('Message sent via fallback, ID:', fallbackId);
      }

      // Clear input
      setMessage('');

      // Update conversation metadata
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessage: messageData,
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
        listingId: listingId || null,
        listingTitle: listingTitle || null,
      });

      // Send push notification to recipient
      try {
        const recipientDoc = await getDoc(doc(db, 'users', recipientId));
        if (recipientDoc.exists()) {
          const recipientData = recipientDoc.data();
          if (recipientData.pushToken && recipientData.notificationSettings?.messages) {
            // You can implement push notification here
            console.log('Push notification would be sent to:', recipientData.pushToken);
          }
        }
      } catch (error) {
        console.error('Error sending push notification:', error);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [message, conversationId, listingId, listingTitle, recipientId]);

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isMyMessage = item.user && item.user._id === auth.currentUser?.uid;
    
    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.theirMessage]}>
        {/* Avatar for other person's messages */}
        {!isMyMessage && (
          <View style={styles.avatarContainer}>
            {recipientAvatar ? (
              <Image source={{ uri: recipientAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.defaultAvatar}>
                <Ionicons name="person" size={16} color="#fff" />
              </View>
            )}
          </View>
        )}
        
        <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble]}>
          {/* Username for other person's messages */}
          {!isMyMessage && (
            <Text style={styles.userName}>{item.user.name}</Text>
          )}
          
          <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
            {item.text}
          </Text>
          
          <Text style={[styles.messageTime, isMyMessage ? styles.myMessageTime : styles.theirMessageTime]}>
            {(item.createdAt instanceof Date ? item.createdAt : item.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  }, [recipientAvatar]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-outline" size={80} color="#ddd" />
      <Text style={styles.emptyText}>No messages yet</Text>
      <Text style={styles.emptySubtext}>Start the conversation by sending a message</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.headerAvatar}>
            {recipientAvatar ? (
              <Image source={{ uri: recipientAvatar }} style={styles.headerAvatarImage} />
            ) : (
              <View style={styles.headerDefaultAvatar}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.recipientName}>{recipientName}</Text>
            {listingTitle && (
              <Text style={styles.conversationInfo}>
                📦 {listingTitle}
              </Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            textAlignVertical="center"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!message.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!message.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerAvatar: {
    marginRight: 12,
  },
  headerAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerDefaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  recipientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  conversationInfo: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  theirMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  defaultAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6c757d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  myMessageBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 6,
  },
  theirMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userName: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: 'white',
  },
  theirMessageText: {
    color: '#212529',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 6,
    opacity: 0.7,
  },
  myMessageTime: {
    color: 'white',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: '#6c757d',
    textAlign: 'left',
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 12,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#adb5bd',
    shadowOpacity: 0,
    elevation: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ChatScreen;