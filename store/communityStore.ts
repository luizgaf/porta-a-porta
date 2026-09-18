import { create } from 'zustand';
import { Community, Seller, Product, GeoPoint } from '@/types';

interface CommunityState {
  currentCommunity: Community | null;
  nearbyCommunities: Community[];
  communitySellers: Seller[];
  communityProducts: Product[];
  userLocation: GeoPoint | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentCommunity: (community: Community | null) => void;
  setNearbyCommunities: (communities: Community[]) => void;
  setCommunitySellers: (sellers: Seller[]) => void;
  setCommunityProducts: (products: Product[]) => void;
  setUserLocation: (location: GeoPoint | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addSeller: (seller: Seller) => void;
  updateSeller: (sellerId: string, updates: Partial<Seller>) => void;
  removeSeller: (sellerId: string) => void;
  addProduct: (product: Product) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  removeProduct: (productId: string) => void;
}

export const useCommunityStore = create<CommunityState>((set) => ({
  currentCommunity: null,
  nearbyCommunities: [],
  communitySellers: [],
  communityProducts: [],
  userLocation: null,
  isLoading: false,
  error: null,

  setCurrentCommunity: (currentCommunity) => set({ currentCommunity }),
  setNearbyCommunities: (nearbyCommunities) => set({ nearbyCommunities }),
  setCommunitySellers: (communitySellers) => set({ communitySellers }),
  setCommunityProducts: (communityProducts) => set({ communityProducts }),
  setUserLocation: (userLocation) => set({ userLocation }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addSeller: (seller) =>
    set((state) => ({
      communitySellers: [...state.communitySellers, seller],
    })),

  updateSeller: (sellerId, updates) =>
    set((state) => ({
      communitySellers: state.communitySellers.map((seller) =>
        seller.id === sellerId ? { ...seller, ...updates } : seller
      ),
    })),

  removeSeller: (sellerId) =>
    set((state) => ({
      communitySellers: state.communitySellers.filter((seller) => seller.id !== sellerId),
    })),

  addProduct: (product) =>
    set((state) => ({
      communityProducts: [...state.communityProducts, product],
    })),

  updateProduct: (productId, updates) =>
    set((state) => ({
      communityProducts: state.communityProducts.map((product) =>
        product.id === productId ? { ...product, ...updates } : product
      ),
    })),

  removeProduct: (productId) =>
    set((state) => ({
      communityProducts: state.communityProducts.filter((product) => product.id !== productId),
    })),
}));