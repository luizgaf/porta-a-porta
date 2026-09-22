import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Usuario, TipoUsuario } from '../types';

interface AuthState {
  usuario: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (usuario: Usuario, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  updateUsuario: (data: Partial<Usuario>) => void;
  hasRole: (...roles: TipoUsuario[]) => boolean;
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      usuario: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (usuario: Usuario, token: string) => {
        set({
          usuario,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      clearAuth: () => {
        set({
          usuario: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      updateUsuario: (data: Partial<Usuario>) => {
        const { usuario } = get();
        if (usuario) {
          set({ usuario: { ...usuario, ...data } });
        }
      },

      hasRole: (...roles: TipoUsuario[]) => {
        const { usuario } = get();
        return usuario ? roles.includes(usuario.tipo) : false;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        usuario: state.usuario,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);