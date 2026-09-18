'use client';

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { Button, Card, Avatar } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

const menuItems = [
  { id: 'addresses', title: 'Endereços salvos', icon: 'location-outline' as const, color: '#007AFF', screen: 'addresses' },
  { id: 'payment', title: 'Formas de pagamento', icon: 'card-outline' as const, color: '#34C759', screen: 'payment' },
  { id: 'notifications', title: 'Notificações', icon: 'notifications-outline' as const, color: '#FF9500', screen: 'notifications' },
  { id: 'promotions', title: 'Cupons e promoções', icon: 'pricetag-outline' as const, color: '#FF2D92', screen: 'promotions' },
  { id: 'favorites', title: 'Favoritos', icon: 'heart-outline' as const, color: '#FF3B30', screen: 'favorites' },
  { id: 'settings', title: 'Configurações', icon: 'settings-outline' as const, color: '#8E8E93', screen: 'settings' },
];

const sellerMenuItems = [
  { id: 'dashboard', title: 'Painel do vendedor', icon: 'storefront-outline' as const, color: '#34C759', screen: '/seller/dashboard' },
  { id: 'products', title: 'Meus produtos', icon: 'fast-food-outline' as const, color: '#007AFF', screen: '/seller/products' },
  { id: 'orders', title: 'Pedidos recebidos', icon: 'bag-handle-outline' as const, color: '#BF5AF2', screen: '/seller/orders' },
  { id: 'analytics', title: 'Analytics', icon: 'bar-chart-outline' as const, color: '#FF9500', screen: '/seller/analytics' },
  { id: 'payouts', title: 'Recebimentos', icon: 'cash-outline' as const, color: '#30D158', screen: '/seller/payouts' },
];

const moderatorMenuItems = [
  { id: 'dashboard', title: 'Painel do moderador', icon: 'shield-outline' as const, color: '#FF9500', screen: '/moderator/dashboard' },
  { id: 'sellers', title: 'Gerenciar vendedores', icon: 'people-outline' as const, color: '#007AFF', screen: '/moderator/sellers' },
  { id: 'disputes', title: 'Disputas', icon: 'alert-circle-outline' as const, color: '#FF3B30', screen: '/moderator/disputes' },
  { id: 'settings', title: 'Configurações da comunidade', icon: 'settings-outline' as const, color: '#8E8E93', screen: '/moderator/settings' },
  { id: 'reports', title: 'Relatórios', icon: 'document-outline' as const, color: '#BF5AF2', screen: '/moderator/reports' },
];

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const { getItemCount } = useCartStore();
  const [cartCount, setCartCount] = useState(0);

  const isSeller = user?.role === 'seller';
  const isModerator = user?.role === 'moderator';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Avatar
            name={user?.displayName}
            size="xl"
            source={user?.photoURL ? { uri: user.photoURL } : undefined}
          />
        </View>
        <Text style={styles.userName}>{user?.displayName || 'Usuário'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'email@exemplo.com'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{getRoleLabel(user?.role)}</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/orders')}>
          <View style={styles.statIconContainer}>
            <Ionicons name="bag-handle-outline" size={24} color="#007AFF" />
          </View>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Pedidos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/favorites')}>
          <View style={styles.statIconContainer}>
            <Ionicons name="heart-outline" size={24} color="#FF3B30" />
          </View>
          <Text style={styles.statValue}>8</Text>
          <Text style={styles.statLabel}>Favoritos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/promotions')}>
          <View style={styles.statIconContainer}>
            <Ionicons name="pricetag-outline" size={24} color="#FF2D92" />
          </View>
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.statLabel}>Cupons</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/orders')}>
          <View style={styles.statIconContainer}>
            <Ionicons name="cart-outline" size={24} color="#34C759" />
          </View>
          <Text style={styles.statValue}>{cartCount}</Text>
          <Text style={styles.statLabel}>No carrinho</Text>
        </TouchableOpacity>
      </View>

      {/* Role-specific Menu */}
      {(isSeller || isModerator) && (
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>
            {isSeller ? 'Painel do Vendedor' : 'Painel do Moderador'}
          </Text>
          <View style={styles.menuList}>
            {(isSeller ? sellerMenuItems : moderatorMenuItems).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => router.push(item.screen)}
                activeOpacity={0.8}
              >
                <View style={[styles.menuItemIcon, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={styles.menuItemText}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* General Menu */}
      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>Minha conta</Text>
        <View style={styles.menuList}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => router.push(item.screen)}
              activeOpacity={0.8}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={styles.menuItemText}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>Suporte</Text>
        <View style={styles.menuList}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Ajuda', 'Central de ajuda em desenvolvimento')}
            activeOpacity={0.8}
          >
            <View style={[styles.menuItemIcon, { backgroundColor: '#007AFF20' }]}>
              <Ionicons name="help-circle-outline" size={24} color="#007AFF" />
            </View>
            <Text style={styles.menuItemText}>Central de ajuda</Text>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Contato', 'suporte@portaaporta.com.br')}
            activeOpacity={0.8}
          >
            <View style={[styles.menuItemIcon, { backgroundColor: '#34C75920' }]}>
              <Ionicons name="chatbubble-outline" size={24} color="#34C759" />
            </View>
            <Text style={styles.menuItemText}>Fale conosco</Text>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/terms')}
            activeOpacity={0.8}
          >
            <View style={[styles.menuItemIcon, { backgroundColor: '#8E8E9320' }]}>
              <Ionicons name="document-text-outline" size={24} color="#8E8E93" />
            </View>
            <Text style={styles.menuItemText}>Termos e políticas</Text>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <Button
          title="Sair da conta"
          variant="danger"
          size="lg"
          fullWidth
          onPress={() => {
            Alert.alert(
              'Sair da conta',
              'Tem certeza que deseja sair?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', style: 'destructive', onPress: () => logout() },
              ]
            );
          }}
        />
      </View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Porta a Porta v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const getRoleLabel = (role?: string) => {
  switch (role) {
    case 'customer':
      return 'Cliente';
    case 'seller':
      return 'Vendedor';
    case 'moderator':
      return 'Moderador';
    default:
      return 'Visitante';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E6F4FE',
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  menuSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    marginLeft: 4,
  },
  menuList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  menuItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  logoutContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  versionContainer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#C7C7CC',
  },
});