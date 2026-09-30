import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { api } from '../utils/api';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token, setLoading, login, logout } = useAuth();
  const { register } = usePushNotifications();

  useEffect(() => {
    const initAuth = async () => {
      if (token && isAuthenticated) {
        try {
          const response = await api.getMe();
          if (response.usuario) {
            login(response.usuario, token);
            // Register push token after successful auth init
            if (!response.usuario.pushToken) {
              void register();
            }
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
  }, [token, isAuthenticated, login, logout, setLoading, register]);

  return <>{children}</>;
};
