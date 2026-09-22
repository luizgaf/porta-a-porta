import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';

export default function TabsLayout() {
  const { isVendedor, isSindico, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1E3A5F',
        tabBarInactiveTintColor: '#6C7A8A',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E8EFF5',
          height: 70,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Início',
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={focused ? '#1E3A5F' : '#6C7A8A'} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={focused ? '#1E3A5F' : '#6C7A8A'} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Carrinho',
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? 'cart' : 'cart-outline'} size={24} color={focused ? '#1E3A5F' : '#6C7A8A'} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? 'list' : 'list-outline'} size={24} color={focused ? '#1E3A5F' : '#6C7A8A'} />
          ),
        }}
      />
      {isVendedor && (
        <Tabs.Screen
          name="seller"
          options={{
            title: 'Vendedor',
            tabBarIcon: ({ focused }) => (
              <Ionicons name={focused ? 'storefront' : 'storefront-outline'} size={24} color={focused ? '#1E3A5F' : '#6C7A8A'} />
            ),
          }}
        />
      )}
      {isSindico && (
        <Tabs.Screen
          name="moderator"
          options={{
            title: 'Moderação',
            tabBarIcon: ({ focused }) => (
              <Ionicons name={focused ? 'shield' : 'shield-outline'} size={24} color={focused ? '#1E3A5F' : '#6C7A8A'} />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={focused ? '#1E3A5F' : '#6C7A8A'} />
          ),
        }}
      />
    </Tabs>
  );
}