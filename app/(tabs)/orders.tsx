'use client';

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/types';
import { Card, Button } from '@/components/ui';

const mockOrders: Order[] = [
  {
    id: 'order-1',
    customerId: 'user-1',
    sellerId: 'seller-1',
    communityId: 'comunidade-1',
    items: [
      { productId: 'prod-1', productName: 'Pizza Margherita', quantity: 1, unitPrice: 42.90, totalPrice: 42.90 },
      { productId: 'prod-2', productName: 'Pizza Pepperoni', quantity: 1, unitPrice: 48.90, totalPrice: 48.90 },
    ],
    subtotal: 91.80,
    deliveryFee: 5.99,
    tax: 0,
    discount: 0,
    total: 97.79,
    status: 'out_for_delivery',
    paymentStatus: 'paid',
    paymentMethod: 'pix',
    deliveryAddress: {
      street: 'Rua Aspicuelta',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Vila Madalena',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05433-010',
    },
    notes: 'Interfone 45',
    estimatedDeliveryTime: new Date(Date.now() + 15 * 60000),
    createdAt: new Date(Date.now() - 35 * 60000),
    updatedAt: new Date(),
  },
  {
    id: 'order-2',
    customerId: 'user-1',
    sellerId: 'seller-2',
    communityId: 'comunidade-1',
    items: [
      { productId: 'prod-3', productName: 'X-Burger Clássico', quantity: 2, unitPrice: 28.90, totalPrice: 57.80 },
    ],
    subtotal: 57.80,
    deliveryFee: 4.99,
    tax: 0,
    discount: 5.00,
    total: 57.79,
    status: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'credit_card',
    deliveryAddress: {
      street: 'Rua Aspicuelta',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Vila Madalena',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05433-010',
    },
    estimatedDeliveryTime: new Date(Date.now() - 2 * 3600000),
    actualDeliveryTime: new Date(Date.now() - 1.5 * 3600000),
    createdAt: new Date(Date.now() - 3 * 3600000),
    updatedAt: new Date(Date.now() - 1.5 * 3600000),
  },
  {
    id: 'order-3',
    customerId: 'user-1',
    sellerId: 'seller-3',
    communityId: 'comunidade-1',
    items: [
      { productId: 'prod-5', productName: 'Combinado Sashimi (15 pcs)', quantity: 1, unitPrice: 89.90, totalPrice: 89.90 },
    ],
    subtotal: 89.90,
    deliveryFee: 6.99,
    tax: 0,
    discount: 0,
    total: 96.89,
    status: 'cancelled',
    paymentStatus: 'refunded',
    paymentMethod: 'pix',
    deliveryAddress: {
      street: 'Rua Aspicuelta',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Vila Madalena',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05433-010',
    },
    createdAt: new Date(Date.now() - 24 * 3600000),
    updatedAt: new Date(Date.now() - 23 * 3600000),
  },
];

const statusConfig = {
  pending: { label: 'Pendente', color: '#FF9500', icon: 'time-outline' as const },
  confirmed: { label: 'Confirmado', color: '#007AFF', icon: 'checkmark-circle-outline' as const },
  preparing: { label: 'Preparando', color: '#BF5AF2', icon: 'restaurant-outline' as const },
  ready: { label: 'Pronto', color: '#34C759', icon: 'checkmark-done-outline' as const },
  out_for_delivery: { label: 'Saiu para entrega', color: '#007AFF', icon: 'bicycle-outline' as const },
  delivered: { label: 'Entregue', color: '#34C759', icon: 'checkmark-done-circle-outline' as const },
  cancelled: { label: 'Cancelado', color: '#FF3B30', icon: 'close-circle-outline' as const },
  disputed: { label: 'Em disputa', color: '#FF9500', icon: 'alert-circle-outline' as const },
} as const;

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'past'>('all');

  const filteredOrders = orders.filter((order) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'active') {
      return !['delivered', 'cancelled', 'disputed'].includes(order.status);
    }
    return ['delivered', 'cancelled', 'disputed'].includes(order.status);
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const getStatusConfig = (status: OrderStatus) => statusConfig[status] || statusConfig.pending;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Pedidos</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { id: 'all', label: 'Todos' },
          { id: 'active', label: 'Em andamento' },
          { id: 'past', label: 'Histórico' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterTab,
              selectedFilter === filter.id && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter(filter.id as any)}
          >
            <Text style={[styles.filterTabText, selectedFilter === filter.id && styles.filterTabTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item }) => {
          const config = getStatusConfig(item.status);
          return (
            <TouchableOpacity
              style={styles.orderCard}
              onPress={() => router.push(`/order/${item.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.orderHeader}>
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>Pizza do João</Text>
                  <Text style={styles.orderTime}>{formatDate(item.createdAt)} às {formatTime(item.createdAt)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
                  <Ionicons name={config.icon} size={16} color={config.color} style={{ marginRight: 4 }} />
                  <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                </View>
              </View>

              <View style={styles.orderItems}>
                {item.items.slice(0, 2).map((orderItem, index) => (
                  <View key={index} style={styles.orderItem}>
                    <Text style={styles.itemName}>{orderItem.productName}</Text>
                    <Text style={styles.itemQuantity}>x{orderItem.quantity}</Text>
                  </View>
                ))}
                {item.items.length > 2 && (
                  <Text style={styles.moreItems}>+{item.items.length - 2} itens</Text>
                )}
              </View>

              <View style={styles.orderFooter}>
                <View style={styles.deliveryInfo}>
                  <Ionicons name="location-outline" size={14} color="#8E8E93" />
                  <Text style={styles.deliveryText}>
                    {item.deliveryAddress.street}, {item.deliveryAddress.number}
                  </Text>
                </View>
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>R$ {item.total.toFixed(2)}</Text>
                </View>
              </View>

              {['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(item.status) && (
                <View style={styles.trackButtonContainer}>
                  <Button
                    title="Acompanhar entrega"
                    variant="outline"
                    size="sm"
                    fullWidth
                    leftIcon={<Ionicons name="bicycle-outline" size={18} color="#007AFF" />}
                    onPress={() => router.push(`/order/${item.id}/tracking`)}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name={selectedFilter === 'active' ? 'bag-outline' : 'bag-outline'} size={64} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>
              {selectedFilter === 'active' ? 'Nenhum pedido em andamento' : 'Nenhum pedido no histórico'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter === 'active'
                ? 'Seus pedidos ativos aparecerão aqui'
                : 'Seus pedidos anteriores aparecerão aqui'}
            </Text>
            {selectedFilter !== 'active' && (
              <Button
                title="Fazer um pedido"
                variant="primary"
                size="md"
                onPress={() => router.push('/(tabs)/home')}
                style={{ marginTop: 16, width: 200 }}
              />
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  orderTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderItems: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 12,
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 14,
    color: '#1D1D1F',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  moreItems: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '60%',
  },
  deliveryText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  trackButtonContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  separator: {
    height: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
});