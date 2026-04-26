export type UserRole = 'renter' | 'lender' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phoneNumber?: string;
  photoUrl?: string;
  equipmentCategories?: string[];
  preferredLocation?: string;
  createdAt: any;
}

export interface EquipmentAsset {
  id: string;
  name: string;
  description: string;
  category: string;
  dailyRate: number;
  location: string;
  imageUrl: string;
  lenderId: string;
  status: 'available' | 'rented' | 'maintenance';
  ratingCount?: number;
  averageRating?: number;
  features?: string[];
  createdAt: any;
}

export interface RentalRequest {
  id: string;
  assetId: string;
  renterId: string;
  lenderId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'completed' | 'cancelled';
  expirationNotified?: boolean;
  createdAt: any;
  updatedAt?: any;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: 'rental_request' | 'rental_update' | 'return_reminder' | 'system';
  link?: string;
  createdAt: any;
}

export interface Review {
  id: string;
  assetId: string;
  reviewerId: string;
  lenderId: string;
  rating: number; // 1 to 5
  comment: string;
  rentalId: string;
  createdAt: any;
}
