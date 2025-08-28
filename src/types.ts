export interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  profileImage?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  listings: string[];
  favorites: string[];
  conversations: string[];
  notificationSettings?: {
    messages: boolean;
    favorites: boolean;
    newListings: boolean;
    priceChanges: boolean;
    system: boolean;
  };
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  subcategory: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  location: string;
  images: string[];
  sellerId: string;
  userId?: string; // For backward compatibility
  sellerName: string;
  sellerPhone: string;
  sellerEmail: string;
  createdAt: Date | any; // Firestore Timestamp or Date
  updatedAt: Date | any; // Firestore Timestamp or Date
  status: 'active' | 'sold' | 'expired';
  tags: string[];
  views: number;
  favorites: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface SearchFilters {
  category?: string;
  subcategory?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  keywords?: string;
}

export interface Location {
  id: string;
  name: string;
  state: string;
  country: string;
}

export interface Message {
  id: string;
  text: string;
  createdAt: Date;
  userId: string;
  userName: string;
  userAvatar?: string;
  conversationId: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  lastMessageTime?: Date;
  listingId?: string;
  createdAt: Date;
  updatedAt: Date;
}
