import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import { api } from '../utils/api';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token, setLoading, login, logout } = useAuth();
  // O persist do Zustand lê o AsyncStorage de forma assíncrona; antes disso token/isAuthenticated
  // ainda são os valores iniciais e o usuário seria tratado como deslogado.
  const [hydrated, setHydrated] = useState(useAuthStore.persist.hasHydrated());

  useEffect(() => useAuthStore.persist.onFinishHydration(() => setHydrated(true)), []);

  useEffect(() => {
    if (!hydrated) return;

    const initAuth = async () => {
      if (token && isAuthenticated) {
        try {
          const response = await api.getMe();
          if (response.usuario) {
            login(response.usuario, token);
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [hydrated, token, isAuthenticated, login, logout, setLoading]);

  return <>{children}</>;
};
