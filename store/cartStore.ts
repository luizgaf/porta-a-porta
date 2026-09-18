import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Product, Seller } from '@/types';

interface CartState {
  items: CartItem[];
  sellerId: string | null;
  seller: Seller | null;
  deliveryFee: number;
  discount: number;
  couponCode: string | null;

  // Actions
  addItem: (product: Product, quantity?: number, notes?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNotes: (productId: string, notes: string) => void;
  clearCart: () => void;
  setSeller: (seller: Seller | null) => void;
  setDeliveryFee: (fee: number) => void;
  setDiscount: (discount: number, couponCode?: string) => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
  canAddProduct: (sellerId: string) => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      sellerId: null,
      seller: null,
      deliveryFee: 0,
      discount: 0,
      couponCode: null,

      addItem: (product, quantity = 1, notes) => {
        const { items, sellerId } = get();

        // Check if product is from the same seller
        if (sellerId && sellerId !== product.sellerId) {
          // In a real app, you'd show a confirmation dialog
          // For now, we'll just replace the cart
          set({
            items: [{ product, quantity, notes }],
            sellerId: product.sellerId,
          });
          return;
        }

        const existingItemIndex = items.findIndex((item) => item.product.id === product.id);

        if (existingItemIndex >= 0) {
          const newItems = [...items];
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newItems[existingItemIndex].quantity + quantity,
            notes: notes || newItems[existingItemIndex].notes,
          };
          set({ items: newItems, sellerId: product.sellerId });
        } else {
          set({
            items: [...items, { product, quantity, notes }],
            sellerId: product.sellerId,
          });
        }
      },

      removeItem: (productId) =>
        set((state) => {
          const newItems = state.items.filter((item) => item.product.id !== productId);
          return {
            items: newItems,
            sellerId: newItems.length > 0 ? newItems[0].product.sellerId : null,
          };
        }),

      updateQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            const newItems = state.items.filter((item) => item.product.id !== productId);
            return {
              items: newItems,
              sellerId: newItems.length > 0 ? newItems[0].product.sellerId : null,
            };
          }
          return {
            items: state.items.map((item) =>
              item.product.id === productId ? { ...item, quantity } : item
            ),
          };
        }),

      updateNotes: (productId, notes) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, notes } : item
          ),
        })),

      clearCart: () =>
        set({
          items: [],
          sellerId: null,
          seller: null,
          deliveryFee: 0,
          discount: 0,
          couponCode: null,
        }),

      setSeller: (seller) =>
        set({
          seller,
          sellerId: seller?.id || null,
        }),

      setDeliveryFee: (deliveryFee) => set({ deliveryFee }),

      setDiscount: (discount, couponCode) => set({ discount, couponCode }),

      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),

      getTotal: () => {
        const { items, deliveryFee, discount } = get();
        const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        return Math.max(0, subtotal + deliveryFee - discount);
      },

      canAddProduct: (productSellerId) => {
        const { sellerId } = get();
        return !sellerId || sellerId === productSellerId;
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        sellerId: state.sellerId,
        deliveryFee: state.deliveryFee,
        discount: state.discount,
        couponCode: state.couponCode,
      }),
    }
  )
);