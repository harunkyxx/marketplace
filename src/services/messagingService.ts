import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Message {
  id: string;
  text: string;
  createdAt: Timestamp;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  image?: string;
  system?: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  lastMessageTime?: Timestamp;
  listingId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class MessagingService {
  // Create a new conversation
  static async createConversation(
    participantIds: string[], 
    listingId?: string
  ): Promise<string> {
    try {
      const conversationData = {
        participants: participantIds,
        listingId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'conversations'), conversationData);
      return docRef.id;
    } catch (error) {
      throw error;
    }
  }

  // Send a message
  static async sendMessage(
    conversationId: string, 
    message: Omit<Message, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      const messageData = {
        ...message,
        createdAt: serverTimestamp()
      };

      // Add message to subcollection
      const docRef = await addDoc(
        collection(db, 'conversations', conversationId, 'messages'), 
        messageData
      );

      // Update conversation's last message and metadata
      const lastMessageData: any = {
        text: message.text,
        user: {
          _id: message.user._id,
          name: message.user.name,
        },
        createdAt: messageData.createdAt
      };
      
      // Only add avatar if it exists
      if (message.user.avatar) {
        lastMessageData.user.avatar = message.user.avatar;
      }
      
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: lastMessageData,
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  // Get conversations for a user
  static subscribeToUserConversations(
    userId: string, 
    callback: (conversations: Conversation[]) => void
  ) {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const conversations: Conversation[] = [];
      snapshot.forEach((doc) => {
        conversations.push({
          id: doc.id,
          ...doc.data()
        } as Conversation);
      });
      callback(conversations);
    });
  }

  // Get messages for a conversation
  static subscribeToConversationMessages(
    conversationId: string, 
    callback: (messages: Message[]) => void
  ) {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        } as Message);
      });
      callback(messages);
    });
  }

  // Get or create conversation between two users
  static async getOrCreateConversation(
    userId1: string, 
    userId2: string, 
    listingId?: string
  ): Promise<string> {
    try {
      // Check if conversation already exists
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId1)
      );

      const snapshot = await getDocs(q);
      let existingConversationId: string | null = null;

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(userId2)) {
          existingConversationId = doc.id;
        }
      });

      if (existingConversationId) {
        return existingConversationId;
      }

      // Create new conversation
      return await this.createConversation([userId1, userId2], listingId);
    } catch (error) {
      throw error;
    }
  }
}
