import React from 'react';
import { Stack } from 'expo-router';
import { Providers } from '../components/Providers';

export default function RootLayout() {
  return (
    <Providers>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F5F8FA' },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </Providers>
  );
}