import { Stack } from 'expo-router';
import { Providers } from '@/components/Providers';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function RootLayout() {
  const { initializeAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Providers>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="order/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="checkout" options={{ presentation: 'card' }} />
        <Stack.Screen name="seller/dashboard" options={{ presentation: 'card' }} />
        <Stack.Screen name="moderator/dashboard" options={{ presentation: 'card' }} />
      </Stack>
    </Providers>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});