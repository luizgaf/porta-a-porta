import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token, setLoading, login, logout } = useAuth();

  useEffect(() => {
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
  }, [token, isAuthenticated, login, logout, setLoading]);

  return <>{children}</>;
};