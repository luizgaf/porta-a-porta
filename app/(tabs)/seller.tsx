'use client';

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, Avatar } from '@/components/ui';

const stats = [
  { label: 'Pedidos hoje', value: '24', icon: 'bag-handle' as const, color: '#007AFF', trend: '+12%' },
  { label: 'Faturamento', value: 'R$ 1.247,50', icon: 'cash' as const, color: '#34C759', trend: '+8%' },
  { label: 'Ticket médio', value: 'R$ 52,00', icon: 'calculator' as const, color: '#BF5AF2', trend: '+3%' },
  { label: 'Avaliação', value: '4.8 ⭐', icon: 'star' as const, color: '#FF9500', trend: '+0.1' },
];

const recentOrders = [
  { id: 'ORD-001', customer: 'João Silva', items: 3, total: 89.70, status: 'preparing', time: '10 min atrás' },
  { id: 'ORD-002', customer: 'Maria Santos', items: 1, total: 42.90, status: 'confirmed', time: '5 min atrás' },
  { id: 'ORD-003', customer: 'Pedro Costa', items: 2, total: 67.80, status: 'pending', time: '2 min atrás' },
];

export default function SellerDashboardScreen() {
  const [isOpen, setIsOpen] = useState(true);

  const quickActions = [
    { id: 'toggle', title: isOpen ? 'Fechar loja' : 'Abrir loja', icon: isOpen ? 'lock-closed' as const : 'lock-open' as const, color: isOpen ? '#FF3B30' : '#34C759' },
    { id: 'products', title: 'Gerenciar produtos', icon: 'fast-food' as const, color: '#007AFF' },
    { id: 'orders', title: 'Ver todos os pedidos', icon: 'list' as const, color: '#BF5AF2' },
    { id: 'analytics', title: 'Ver analytics', icon: 'analytics' as const, color: '#FF9500' },
  ];

  const handleActionPress = (actionId: string) => {
    if (actionId === 'toggle') {
      setIsOpen(!isOpen);
    } else {
      router.push(`/seller/${actionId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'confirmed': return '#007AFF';
      case 'preparing': return '#BF5AF2';
      case 'ready': return '#34C759';
      case 'out_for_delivery': return '#007AFF';
      case 'delivered': return '#34C759';
      case 'cancelled': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmado';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto';
      case 'out_for_delivery': return 'Saiu para entrega';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
      {/* Store Header */}
      <View style={styles.storeHeader}>
        <View style={styles.storeInfo}>
          <View style={styles.storeAvatar}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400' }} style={styles.storeImage} resizeMode="cover" />
          </View>
          <View style={styles.storeDetails}>
            <Text style={styles.storeName}>Pizza do João</Text>
            <View style={styles.storeMeta}>
              <Text style={styles.storeCategory}>🍕 Pizza • Artesanal</Text>
              <Text style={styles.storeRating}>
                <Ionicons name="star" size={14} color="#FFD600" />
                4.8 (245 avaliações)
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.statusToggle, { backgroundColor: isOpen ? '#34C75920' : '#FF3B3020' }]}>
          <View style={[styles.statusDot, { backgroundColor: isOpen ? '#34C759' : '#8E8E93' }]} />
          <Text style={[styles.statusText, { color: isOpen ? '#34C759' : '#8E8E93' }]}>
            {isOpen ? 'Aberto' : 'Fechado'}
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
              <Ionicons name={stat.icon} size={24} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={[styles.statTrend, { color: stat.trend.startsWith('+') ? '#34C759' : '#FF3B30' }]}>
              {stat.trend} vs ontem
            </Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações rápidas</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={() => handleActionPress(action.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Orders */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pedidos recentes</Text>
          <TouchableOpacity onPress={() => router.push('/seller/orders')}>
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.ordersList}>
          {recentOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => router.push(`/seller/orders/${order.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.orderMain}>
                <View style={styles.orderCustomer}>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <Text style={styles.customerName}>{order.customer}</Text>
                </View>
                <View style={styles.orderDetails}>
                  <Text style={styles.orderItems}>{order.items} itens</Text>
                  <Text style={styles.orderTotal}>R$ {order.total.toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.orderFooter}>
                <View style={[styles.orderStatus, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{getStatusLabel(order.status)}</Text>
                </View>
                <Text style={styles.orderTime}>{order.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Revenue Chart Placeholder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Faturamento da semana</Text>
        <View style={styles.chartPlaceholder}>
          <Ionicons name="bar-chart" size={48} color="#C7C7CC" />
          <Text style={styles.chartText}>Gráfico de faturamento será implementado</Text>
          <Text style={styles.chartSubtext}>Integração com biblioteca de gráficos (ex: react-native-chart-kit)</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  contentContainer: {
    paddingBottom: 100,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  storeAvatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
  },
  storeImage: {
    width: '100%',
    height: '100%',
  },
  storeDetails: {
    gap: 2,
  },
  storeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  storeMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  storeCategory: {
    fontSize: 13,
    color: '#8E8E93',
  },
  storeRating: {
    fontSize: 13,
    color: '#8E8E93',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statTrend: {
    fontSize: 11,
    fontWeight: '500',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
    textAlign: 'center',
  },
  ordersList: {
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  orderMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderCustomer: {
    flex: 1,
  },
  orderId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  orderDetails: {
    alignItems: 'flex-end',
  },
  orderItems: {
    fontSize: 13,
    color: '#8E8E93',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D1D1F',
    marginTop: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  orderStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  chartPlaceholder: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  chartText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1D1D1F',
    marginTop: 16,
    textAlign: 'center',
  },
  chartSubtext: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
});