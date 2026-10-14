import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useCartStore } from '../../store/cartStore';
import { colors, typography } from '../../constants/design';

type NomeIcone = keyof typeof Ionicons.glyphMap;

const icone = (ativo: NomeIcone, inativo: NomeIcone) =>
  ({ focused, color }: { focused: boolean; color: string }) => (
    <Ionicons name={focused ? ativo : inativo} size={22} color={color} />
  );

export default function TabsLayout() {
  const { isVendedor, isSindico, isLoading, isAuthenticated } = useAuth();
  const itensNoCarrinho = useCartStore((estado: { totalItems: number }) => estado.totalItems);
  // Espaço dos botões de navegação do Android (e da barra do iPhone), para a barra de abas não ficar atrás deles
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.mutedSlate,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        tabBarLabelStyle: {
          fontFamily: typography.labelSmall.fontFamily,
          fontSize: 11,
        },
        tabBarBadgeStyle: {
          backgroundColor: colors.accent,
          color: colors.textOnAccent,
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Início', tabBarIcon: icone('home', 'home-outline') }} />
      <Tabs.Screen name="search" options={{ title: 'Buscar', tabBarIcon: icone('search', 'search-outline') }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Carrinho',
          tabBarIcon: icone('bag-handle', 'bag-handle-outline'),
          tabBarBadge: itensNoCarrinho > 0 ? itensNoCarrinho : undefined,
        }}
      />
      <Tabs.Screen name="orders" options={{ title: 'Pedidos', tabBarIcon: icone('receipt', 'receipt-outline') }} />
      <Tabs.Screen
        name="seller"
        options={{ href: isVendedor ? undefined : null, title: 'Vender', tabBarIcon: icone('storefront', 'storefront-outline') }}
      />
      <Tabs.Screen
        name="moderator"
        options={{ href: isSindico ? undefined : null, title: 'Moderação', tabBarIcon: icone('shield-checkmark', 'shield-checkmark-outline') }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: icone('person', 'person-outline') }} />
    </Tabs>
  );
}
