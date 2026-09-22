import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Card, Button, Avatar } from '../../components/ui';
import { STATUS_LABELS, TIPO_ENTREGA_LABELS } from '../../constants';
import { Pedido, StatusPedido } from '../../types';

const STATUS_COLORS: Record<StatusPedido, string> = {
  PENDENTE: '#FFC107',
  CONFIRMADO: '#17A2B8',
  EM_PREPARO: '#6F42C1',
  PRONTO_ENTREGA: '#FD7E14',
  ENTREGUE: '#28A745',
  CANCELADO: '#DC3545',
};

export default function OrdersScreen() {
  const router = useRouter();
  const { usuario, isVendedor, isSindico } = useAuth();
  const { getPedidos, updatePedidoStatus } = useApi();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusPedido | null>(null);

  const carregarPedidos = useCallback(async (paginaAtual = 1, isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const params: any = { pagina: paginaAtual, limite: 20 };
      if (statusFilter) params.status = statusFilter;

      const response = await getPedidos(params);
      const pedidosData = response.pedidos || response.data || [];
      if (paginaAtual === 1) {
        setPedidos(pedidosData);
      } else {
        setPedidos(prev => [...prev, ...pedidosData]);
      }
      setPagina(response.paginacao.pagina);
      setTotalPaginas(response.paginacao.totalPaginas);
    } catch (error: any) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getPedidos, statusFilter]);

  useEffect(() => {
    carregarPedidos(1, true);
  }, [statusFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    carregarPedidos(1, true);
  };

  const handleLoadMore = () => {
    if (pagina < totalPaginas && !loading) {
      carregarPedidos(pagina + 1);
    }
  };

  const handleUpdateStatus = async (pedido: Pedido, novoStatus: StatusPedido) => {
    try {
      await updatePedidoStatus(pedido.id, { status: novoStatus });
      setPedidos(prev =>
        prev.map(p => p.id === pedido.id ? { ...p, status: novoStatus } : p)
      );
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao atualizar status');
    }
  };

  const renderStatusBadge = (status: StatusPedido) => (
    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[status] }]}>
      <Text style={styles.statusBadgeText}>{STATUS_LABELS[status]}</Text>
    </View>
  );

  const renderPedido = ({ item }: { item: Pedido }) => (
    <TouchableOpacity
      style={styles.pedidoCard}
      onPress={() => router.push(`/order/${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.pedidoHeader}>
        <View style={styles.pedidoId}>
          <Text style={styles.pedidoIdLabel}>Pedido</Text>
          <Text style={styles.pedidoIdValue}>#{item.id.slice(0, 8).toUpperCase()}</Text>
        </View>
        {renderStatusBadge(item.status)}
      </View>

      <View style={styles.pedidoInfo}>
        <View style={styles.pedidoRow}>
          <Ionicons name="calendar" size={16} color="#6C7A8A" />
          <Text style={styles.pedidoDetail}>
            {new Date(item.criadoEm).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        <View style={styles.pedidoRow}>
          <Ionicons name="location" size={16} color="#6C7A8A" />
          <Text style={styles.pedidoDetail}>
            {TIPO_ENTREGA_LABELS[item.tipoEntrega]} - {item.unidadeEntrega}
          </Text>
        </View>

        <View style={styles.pedidoRow}>
          <Ionicons name="cash" size={16} color="#6C7A8A" />
          <Text style={styles.pedidoDetail}>
            R$ {item.valorTotal.toFixed(2).replace('.', ',')} • {item.itens.length} item(ns)
          </Text>
        </View>

        {usuario?.tipo === 'COMPRADOR' && item.comprador && (
          <View style={styles.pedidoRow}>
            <Ionicons name="person" size={16} color="#6C7A8A" />
            <Text style={styles.pedidoDetail}>Comprador: {item.comprador.nome}</Text>
          </View>
        )}

        {isVendedor && item.comprador && (
          <View style={styles.pedidoRow}>
            <Ionicons name="person" size={16} color="#6C7A8A" />
            <Text style={styles.pedidoDetail}>Comprador: {item.comprador.nome}</Text>
          </View>
        )}
      </View>

      {(isVendedor || isSindico) && item.status !== 'ENTREGUE' && item.status !== 'CANCELADO' && (
        <View style={styles.pedidoActions}>
          {getNextStatuses(item.status).map((nextStatus) => (
            <Button
              key={nextStatus}
              title={STATUS_LABELS[nextStatus]}
              onPress={() => handleUpdateStatus(item, nextStatus)}
              variant={nextStatus === 'CANCELADO' ? 'danger' : 'outline'}
              size="sm"
              style={styles.actionButton}
            />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  const getNextStatuses = (currentStatus: StatusPedido): StatusPedido[] => {
    const transitions: Record<StatusPedido, StatusPedido[]> = {
      PENDENTE: ['CONFIRMADO', 'CANCELADO'],
      CONFIRMADO: ['EM_PREPARO', 'CANCELADO'],
      EM_PREPARO: ['PRONTO_ENTREGA', 'CANCELADO'],
      PRONTO_ENTREGA: ['ENTREGUE', 'CANCELADO'],
      ENTREGUE: [],
      CANCELADO: [],
    };
    return transitions[currentStatus] || [];
  };

  const renderFilter = ({ item }: { item: StatusPedido }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        statusFilter === item && styles.filterChipSelected,
      ]}
      onPress={() => setStatusFilter(statusFilter === item ? null : item)}
    >
      <Text
        style={[
          styles.filterChipText,
          statusFilter === item && styles.filterChipTextSelected,
        ]}
      >
        {STATUS_LABELS[item]}
      </Text>
    </TouchableOpacity>
  );

  if (loading && pedidos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.loadingText}>Carregando pedidos...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#1E3A5F']} />
      }
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.filtersContainer}>
        <FlatList
          data={['PENDENTE', 'CONFIRMADO', 'EM_PREPARO', 'PRONTO_ENTREGA', 'ENTREGUE', 'CANCELADO'] as StatusPedido[]}
          renderItem={renderFilter}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
          keyExtractor={(item) => item}
        />
      </View>

      {pedidos.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="list-outline" size={48} color="#D1E3F0" />
          <Text style={styles.emptyText}>
            {statusFilter ? 'Nenhum pedido com este status' : 'Nenhum pedido encontrado'}
          </Text>
          <Text style={styles.emptySubtext}>
            {statusFilter ? 'Tente outro filtro' : 'Seus pedidos aparecerão aqui'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={pedidos}
          renderItem={renderPedido}
          keyExtractor={(item) => item.id}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            pagina < totalPaginas && !loading ? (
              <ActivityIndicator size="small" color="#1E3A5F" style={styles.loadMoreIndicator} />
            ) : null
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6C7A8A',
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersList: {
    gap: 8,
    paddingHorizontal: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1E3F0',
    backgroundColor: '#FFFFFF',
  },
  filterChipSelected: {
    borderColor: '#1E3A5F',
    backgroundColor: '#E6F4FE',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3D4A5A',
  },
  filterChipTextSelected: {
    color: '#1E3A5F',
    fontWeight: '600',
  },
  separator: {
    height: 12,
  },
  pedidoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EFF5',
  },
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pedidoId: {},
  pedidoIdLabel: {
    fontSize: 12,
    color: '#9AA8B8',
    textTransform: 'uppercase',
  },
  pedidoIdValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  pedidoInfo: {
    gap: 6,
  },
  pedidoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pedidoDetail: {
    fontSize: 14,
    color: '#3D4A5A',
    flex: 1,
  },
  pedidoActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8EFF5',
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D4A5A',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6C7A8A',
  },
  loadMoreIndicator: {
    paddingVertical: 20,
  },
});