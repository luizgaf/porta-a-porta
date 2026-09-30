import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from '../utils/api';

export interface NotificacaoData {
  type: string;
  pedidoId?: string;
}

export interface NotificacaoResponse {
  type: 'new_order' | 'order_status' | 'order_cancelled' | 'announcement' | 'test';
  pedidoId?: string;
  title: string;
  body: string;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestUserPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export async function registerForPushNotifications(): Promise<string | null> {
  const hasPermission = await requestUserPermission();
  if (!hasPermission) {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync();
  await api.put('/usuarios/me', { pushToken: token.data });
  return token.data;
}

export async function savePushToken(token: string): Promise<void> {
  await api.put('/usuarios/me', { pushToken: token });
}

export function setupNotificationChannel(): void {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'Notificações',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      enableLights: true,
      lightColor: '#C65D3B',
    });
  }
}

export function getNotificationData(
  response: Notifications.NotificationResponse
): NotificacaoResponse | null {
  const data = response.notification.request.content.data as NotificacaoData | undefined;
  if (!data) return null;

  const { type, pedidoId } = data;
  const title = response.notification.request.content.title ?? '';
  const body = response.notification.request.content.body ?? '';

  return { type: type as NotificacaoResponse['type'], pedidoId, title, body };
}
