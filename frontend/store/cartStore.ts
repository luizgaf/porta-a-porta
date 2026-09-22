import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Produto } from '../types';

interface CartItem {
  produto: Produto;
  quantidade: number;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalValue: number;

  // Actions
  addItem: (produto: Produto, quantidade?: number) => void;
  removeItem: (produtoId: string) => void;
  updateQuantity: (produtoId: string, quantidade: number) => void;
  clearCart: () => void;
  getItem: (produtoId: string) => CartItem | undefined;
}

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

const calculateTotals = (items: CartItem[]) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantidade, 0);
  const totalValue = items.reduce(
    (sum, item) => sum + item.produto.preco * item.quantidade,
    0
  );
  return { totalItems, totalValue };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalValue: 0,

      addItem: (produto: Produto, quantidade = 1) => {
        const { items } = get();
        const existingIndex = items.findIndex((item) => item.produto.id === produto.id);

        let newItems: CartItem[];
        if (existingIndex >= 0) {
          newItems = [...items];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantidade: newItems[existingIndex].quantidade + quantidade,
          };
        } else {
          newItems = [...items, { produto, quantidade }];
        }

        const { totalItems, totalValue } = calculateTotals(newItems);
        set({ items: newItems, totalItems, totalValue });
      },

      removeItem: (produtoId: string) => {
        const { items } = get();
        const newItems = items.filter((item) => item.produto.id !== produtoId);
        const { totalItems, totalValue } = calculateTotals(newItems);
        set({ items: newItems, totalItems, totalValue });
      },

      updateQuantity: (produtoId: string, quantidade: number) => {
        const { items } = get();
        if (quantidade <= 0) {
          const newItems = items.filter((item) => item.produto.id !== produtoId);
          const { totalItems, totalValue } = calculateTotals(newItems);
          set({ items: newItems, totalItems, totalValue });
          return;
        }

        const newItems = items.map((item) =>
          item.produto.id === produtoId ? { ...item, quantidade } : item
        );
        const { totalItems, totalValue } = calculateTotals(newItems);
        set({ items: newItems, totalItems, totalValue });
      },

      clearCart: () => {
        set({ items: [], totalItems: 0, totalValue: 0 });
      },

      getItem: (produtoId: string) => {
        const { items } = get();
        return items.find((item) => item.produto.id === produtoId);
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);