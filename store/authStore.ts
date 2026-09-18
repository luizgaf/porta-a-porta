import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '@/types';

// Fallback storage for Expo Go (where native AsyncStorage isn't available)
const createStorage = (): StateStorage => {
  let memoryStorage: Record<string, string> = {};

  return {
    getItem: async (name: string) => {
      try {
        const value = await AsyncStorage.getItem(name);
        return value ?? memoryStorage[name] ?? null;
      } catch {
        return memoryStorage[name] ?? null;
      }
    },
    setItem: async (name: string, value: string) => {
      try {
        await AsyncStorage.setItem(name, value);
      } catch {
        memoryStorage[name] = value;
      }
    },
    removeItem: async (name: string) => {
      try {
        await AsyncStorage.removeItem(name);
      } catch {
        delete memoryStorage[name];
      }
    },
  };
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setAuthenticated: (isAuth: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
          error: null,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      hasRole: (role) => get().user?.role === role,

      hasAnyRole: (roles) => get().user ? roles.includes(get().user!.role) : false,

      initializeAuth: async () => {
        const { token } = get();
        if (token) {
          // Here you would validate the token with your backend
          // For now, we'll just mark as initialized
        }
        set({ isInitialized: true });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => createStorage()),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);