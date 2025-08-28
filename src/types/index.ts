export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  location: string;
  rating: number;
  joinDate: Date;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  subcategory?: string;
  location: string;
  images: string[];
  userId: string;
  user: User;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'sold' | 'expired';
  views: number;
  favorites: number;
  tags: string[];
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
  icon: string;
}

export interface SearchFilters {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  condition?: string;
  sortBy?: 'price-asc' | 'price-desc' | 'date-newest' | 'date-oldest' | 'relevance';
}

export interface Location {
  id: string;
  name: string;
  state: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}
