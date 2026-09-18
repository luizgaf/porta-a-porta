export type UserRole = 'customer' | 'seller' | 'moderator';

export interface User {
  uid: string;
  email: string;
  phone: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  communities: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  location: GeoPoint;
  radius: number;
  imageUrl?: string;
  moderatorIds: string[];
  settings: CommunitySettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunitySettings {
  deliveryFee: number;
  commissionRate: number;
  minimumOrder: number;
  operatingHours: OperatingHours;
  deliveryZones: DeliveryZone[];
  acceptedPaymentMethods: PaymentMethod[];
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  polygon: GeoPoint[];
  fee: number;
  estimatedTime: number;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Seller {
  id: string;
  userId: string;
  communityId: string;
  businessName: string;
  description: string;
  category: string;
  address: string;
  location: GeoPoint;
  phone: string;
  imageUrl?: string;
  coverImageUrl?: string;
  isApproved: boolean;
  isOpen: boolean;
  operatingHours: OperatingHours;
  deliveryFee: number;
  minimumOrder: number;
  commissionRate: number;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  sellerId: string;
  communityId: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'disputed';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partial_refund';

export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'mercado_pago';

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: GeoPoint;
}

export interface Order {
  id: string;
  customerId: string;
  sellerId: string;
  communityId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  deliveryAddress: Address;
  deliveryLocation?: GeoPoint;
  notes?: string;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  sellerId: string;
  rating: number;
  comment?: string;
  images?: string[];
  createdAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}