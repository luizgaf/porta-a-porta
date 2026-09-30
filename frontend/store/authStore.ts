import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Usuario, TipoUsuario } from '../types';

const TOKEN_KEY = 'token_ki_auth';
const USER_KEY = 'token_ki_user';
const CONDOMINIO_ID_KEY = 'token_ki_condominioId';

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

const customStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await AsyncStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await AsyncStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      usuario: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: async (usuario: Usuario, token: string) => {
        set({
          usuario,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        // Sincronizar com chaves que o api.ts usa
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(usuario));
        if (usuario.condominioId) {
          await AsyncStorage.setItem(CONDOMINIO_ID_KEY, usuario.condominioId);
        }
      },

      clearAuth: async () => {
        set({
          usuario: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        // Limpar chaves do api.ts
        await AsyncStorage.removeItem(USER_KEY);
        await AsyncStorage.removeItem(CONDOMINIO_ID_KEY);
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      updateUsuario: (data: Partial<Usuario>) => {
        const { usuario } = get();
        if (usuario) {
          const updated = { ...usuario, ...data };
          set({ usuario: updated });
          // Atualizar USER_KEY também
          AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
        }
      },

      hasRole: (...roles: TipoUsuario[]) => {
        const { usuario } = get();
        return usuario ? roles.includes(usuario.tipo) : false;
      },
    }),
    {
      name: TOKEN_KEY,
      storage: createJSONStorage(() => customStorage),
      partialize: (state) => ({
        usuario: state.usuario,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
