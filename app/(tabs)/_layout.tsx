import { Tabs } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

export default function TabsLayout() {
  const { user } = useAuthStore();
  const colorScheme = useColorScheme();

  const isSeller = user?.role === 'seller';
  const isModerator = user?.role === 'moderator';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#fff',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          paddingTop: 8,
          height: 90,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Início',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={26} color={color} />
          ),
        }}
      />
      {isSeller && (
        <Tabs.Screen
          name="seller"
          options={{
            title: 'Vendedor',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'storefront' : 'storefront-outline'} size={26} color={color} />
            ),
          }}
        />
      )}
      {isModerator && (
        <Tabs.Screen
          name="moderator"
          options={{
            title: 'Moderador',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'shield' : 'shield-outline'} size={26} color={color} />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'bag' : 'bag-outline'} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}