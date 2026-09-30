import { useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../store/authStore';
import {
  registerForPushNotifications,
  savePushToken,
  setupNotificationChannel,
  getNotificationData,
  NotificacaoResponse,
} from '../services/notificationService';
import { useRouter } from 'expo-router';

interface UsePushNotificationsResult {
  expoPushToken: string | null;
  isRegistered: boolean;
  register: () => Promise<void>;
}

export const usePushNotifications = (): UsePushNotificationsResult => {
  const router = useRouter();
  const { usuario, updateUsuario } = useAuthStore();
  const tokenRef = useRef<string | null>(null);

  const register = useCallback(async () => {
    try {
      const token = await registerForPushNotifications();
      if (token) {
        tokenRef.current = token;
        updateUsuario({ pushToken: token });
      }
    } catch (error) {
      console.error('Erro ao registrar push token:', error);
    }
  }, [updateUsuario]);

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = getNotificationData(response);
      if (!data) return;

      if (data.pedidoId) {
        router.push(`/order/${data.pedidoId}`);
      }
    },
    [router]
  );

  useEffect(() => {
    setupNotificationChannel();

    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    return () => subscription.remove();
  }, [handleNotificationResponse]);

  return {
    expoPushToken: tokenRef.current,
    isRegistered: !!usuario?.pushToken,
    register,
  };
};
