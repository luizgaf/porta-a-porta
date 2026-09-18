'use client';

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, Avatar } from '@/components/ui';

const stats = [
  { label: 'Vendedores ativos', value: '42', icon: 'storefront-outline' as const, color: '#007AFF', trend: '+3 esta semana' },
  { label: 'Pedidos hoje', value: '156', icon: 'bag-handle-outline' as const, color: '#34C759', trend: '+12% vs ontem' },
  { label: 'Disputas abertas', value: '3', icon: 'alert-circle-outline' as const, color: '#FF3B30', trend: '2 resolvidas' },
  { label: 'Avaliação média', value: '4.6 ⭐', icon: 'star-outline' as const, color: '#FF9500', trend: '+0.1' },
] as const;

const pendingSellers = [
  { id: 'seller-5', name: 'Tacos do Bairro', category: 'Mexicano', address: 'Rua Fidalga, 123', appliedAt: '2 horas atrás' },
  { id: 'seller-6', name: 'Doces da Vovó', category: 'Doces', address: 'Rua Mourato Coelho, 456', appliedAt: '5 horas atrás' },
  { id: 'seller-7', name: 'Açaí da Vila', category: 'Saudável', address: 'Rua Aspicuelta, 789', appliedAt: '1 dia atrás' },
] as const;

const recentDisputes = [
  { id: 'DISP-001', customer: 'Ana Costa', seller: 'Hamburgueria do Bairro', issue: 'Pedido incompleto', status: 'analyzing', createdAt: '1 hora atrás' },
  { id: 'DISP-002', customer: 'Carlos Lima', seller: 'Sushi da Vila', issue: 'Atraso na entrega', status: 'mediating', createdAt: '3 horas atrás' },
] as const;

const quickActions = [
  { id: 'sellers', title: 'Gerenciar vendedores', icon: 'people-outline' as const, color: '#007AFF' },
  { id: 'disputes', title: 'Resolver disputas', icon: 'alert-circle-outline' as const, color: '#FF3B30' },
  { id: 'settings', title: 'Configurações', icon: 'settings-outline' as const, color: '#8E8E93' },
  { id: 'reports', title: 'Ver relatórios', icon: 'document-outline' as const, color: '#BF5AF2' },
] as const;

export default function ModeratorDashboardScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
      {/* Community Header */}
      <View style={styles.communityHeader}>
        <View style={styles.communityInfo}>
          <View style={styles.communityAvatar}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400' }} style={styles.communityImage} resizeMode="cover" />
          </View>
          <View style={styles.communityDetails}>
            <Text style={styles.communityName}>Vila Madalena</Text>
            <Text style={styles.communityDescription}>Comunidade vibrante com ótimos restaurantes</Text>
          </View>
        </View>
        <View style={styles.communityStats}>
          <Text style={styles.statNumber}>2.5km</Text>
          <Text style={styles.statLabel}>Raio de entrega</Text>
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
            <Text style={styles.statGridLabel}>{stat.label}</Text>
            <Text style={styles.statTrend}>{stat.trend}</Text>
          </View>
        ))}
      </View>

      {/* Pending Sellers */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Vendedores pendentes</Text>
          <TouchableOpacity onPress={() => router.push('/moderator/sellers')}>
            <Text style={styles.seeAll}>Ver todos ({pendingSellers.length})</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.pendingList}>
          {pendingSellers.map((seller) => (
            <View key={seller.id} style={styles.pendingCard}>
              <View style={styles.pendingInfo}>
                <Text style={styles.pendingName}>{seller.name}</Text>
                <View style={styles.pendingMeta}>
                  <Text style={styles.pendingCategory}>{seller.category}</Text>
                  <Text style={styles.pendingAddress}>{seller.address}</Text>
                  <Text style={styles.pendingTime}>Cadastrado há {seller.appliedAt}</Text>
                </View>
              </View>
              <View style={styles.pendingActions}>
                <Button
                  title="Aprovar"
                  variant="secondary"
                  size="sm"
                  onPress={() => {}}
                />
                <Button
                  title="Recusar"
                  variant="outline"
                  size="sm"
                  onPress={() => {}}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Disputes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Disputas recentes</Text>
          <TouchableOpacity onPress={() => router.push('/moderator/disputes')}>
            <Text style={styles.seeAll}>Ver todas ({recentDisputes.length})</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.disputesList}>
          {recentDisputes.map((dispute) => (
            <TouchableOpacity
              key={dispute.id}
              style={styles.disputeCard}
              onPress={() => router.push(`/moderator/disputes/${dispute.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.disputeMain}>
                <View style={styles.disputeInfo}>
                  <Text style={styles.disputeId}>{dispute.id}</Text>
                  <Text style={styles.disputeParties}>
                    {dispute.customer} vs {dispute.seller}
                  </Text>
                  <Text style={styles.disputeIssue}>{dispute.issue}</Text>
                </View>
                <View style={[styles.disputeStatus, { backgroundColor: getStatusColor(dispute.status) + '20' }]}>
                  <Text style={[styles.disputeStatusText, { color: getStatusColor(dispute.status) }]}>
                    {getStatusLabel(dispute.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.disputeTime}>{dispute.createdAt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações rápidas</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={() => router.push(`/moderator/${action.id}`)}
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

      {/* Community Health */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Saúde da comunidade</Text>
        <View style={styles.healthGrid}>
          <View style={styles.healthCard}>
            <View style={styles.healthIcon}>
              <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            </View>
            <Text style={styles.healthValue}>94%</Text>
            <Text style={styles.healthLabel}>Taxa de aprovação</Text>
          </View>
          <View style={styles.healthCard}>
            <View style={styles.healthIcon}>
              <Ionicons name="time" size={24} color="#007AFF" />
            </View>
            <Text style={styles.healthValue}>28min</Text>
            <Text style={styles.healthLabel}>Tempo médio entrega</Text>
          </View>
          <View style={styles.healthCard}>
            <View style={styles.healthIcon}>
              <Ionicons name="chatbubble" size={24} color="#BF5AF2" />
            </View>
            <Text style={styles.healthValue}>12</Text>
            <Text style={styles.healthLabel}>Chats ativos</Text>
          </View>
          <View style={styles.healthCard}>
            <View style={styles.healthIcon}>
              <Ionicons name="cash" size={24} color="#30D158" />
            </View>
            <Text style={styles.healthValue}>R$ 12.4k</Text>
            <Text style={styles.healthLabel}>Volume semanal</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'analyzing': return '#FF9500';
    case 'mediating': return '#007AFF';
    case 'resolved': return '#34C759';
    case 'escalated': return '#FF3B30';
    default: return '#8E8E93';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'analyzing': return 'Analisando';
    case 'mediating': return 'Mediando';
    case 'resolved': return 'Resolvido';
    case 'escalated': return 'Escalado';
    default: return status;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  contentContainer: {
    paddingBottom: 100,
  },
  communityHeader: {
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
  communityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  communityAvatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
  },
  communityImage: {
    width: '100%',
    height: '100%',
  },
  communityDetails: {
    gap: 2,
  },
  communityName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  communityDescription: {
    fontSize: 13,
    color: '#8E8E93',
  },
  communityStats: {
    alignItems: 'flex-end',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E93',
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
  statGridLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statTrend: {
    fontSize: 11,
    color: '#8E8E93',
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
  pendingList: {
    gap: 12,
  },
  pendingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  pendingInfo: {
    flex: 1,
  },
  pendingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  pendingMeta: {
    gap: 4,
  },
  pendingCategory: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  pendingAddress: {
    fontSize: 13,
    color: '#8E8E93',
  },
  pendingTime: {
    fontSize: 12,
    color: '#C7C7CC',
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  disputesList: {
    gap: 12,
  },
  disputeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  disputeMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  disputeInfo: {
    flex: 1,
  },
  disputeId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  disputeParties: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
    marginBottom: 2,
  },
  disputeIssue: {
    fontSize: 13,
    color: '#8E8E93',
  },
  disputeStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  disputeStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  disputeTime: {
    fontSize: 12,
    color: '#C7C7CC',
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
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  healthCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  healthIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  healthValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  healthLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
});