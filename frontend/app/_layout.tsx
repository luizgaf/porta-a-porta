import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Fraunces_500Medium, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { Providers } from '../components/Providers';
import { colors } from '../constants/design';

export default function RootLayout() {
  // Fontes do design system (constants/design.ts). Os nomes das chaves são os usados em fontFamily.
  const [fontesCarregadas, erroFontes] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  // Se as fontes falharem, o app segue com a fonte do sistema em vez de ficar travado
  if (!fontesCarregadas && !erroFontes) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {/* Só o topo: a barra de abas trata a parte de baixo (botões de navegação do Android) */}
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
        <Providers>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </Providers>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
