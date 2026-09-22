import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, FlatList, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Card, Button, Avatar } from '../../components/ui';
import { STATUS_LABELS, TIPO_ENTREGA_LABELS } from '../../constants';
import { Pedido, ItemPedido, StatusPedido } from '../../types';

const STATUS_COLORS: Record<StatusPedido, string> = {
  PENDENTE: '#FFC107',
  CONFIRMADO: '#17A2B8',
  EM_PREPARO: '#6F42C1',
  PRONTO_ENTREGA: '#FD7E14',
  ENTREGUE: '#28A745',
  CANCELADO: '#DC3545',
};

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario, isVendedor, isSindico } = useAuth();
  const { getPedido, updatePedidoStatus, createAvaliacao } = useApi();

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAvaliacaoModal, setShowAvaliacaoModal] = useState(false);
  const [avaliacaoNota, setAvaliacaoNota] = useState(0);
  const [avaliacaoComentario, setAvaliacaoComentario] = useState('');
  const [avaliacaoLoading, setAvaliacaoLoading] = useState(false);

  useEffect(() => {
    if (id) carregarPedido();
  }, [id]);

  const carregarPedido = async () => {
    setLoading(true);
    try {
      const response = await getPedido(id!);
      setPedido(response.pedido);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Pedido não encontrado', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (novoStatus: StatusPedido) => {
    if (!pedido) return;
    try {
      await updatePedidoStatus(pedido.id, { status: novoStatus });
      setPedido({ ...pedido, status: novoStatus });
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao atualizar status');
    }
  };

  const handleAvaliacao = async () => {
    if (avaliacaoNota === 0) {
      Alert.alert('Erro', 'Selecione uma nota');
      return;
    }

    setAvaliacaoLoading(true);
    try {
      await createAvaliacao({
        pedidoId: pedido!.id,
        nota: avaliacaoNota,
        comentario: avaliacaoComentario || undefined,
      });
      setShowAvaliacaoModal(false);
      setAvaliacaoNota(0);
      setAvaliacaoComentario('');
      Alert.alert('Sucesso', 'Avaliação enviada com sucesso!');
      carregarPedido();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao enviar avaliação');
    } finally {
      setAvaliacaoLoading(false);
    }
  };

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

  const canUpdateStatus = () => {
    if (!pedido) return false;
    if (isSindico) return true;
    if (isVendedor && pedido.itens.some(i => i.produto?.vendedorId === usuario?.id)) return true;
    if (usuario?.tipo === 'COMPRADOR' && pedido.compradorId === usuario?.id) return true;
    return false;
  };

  const canAvaliar = () => {
    if (!pedido) return false;
    return pedido.status === 'ENTREGUE' &&
           pedido.compradorId === usuario?.id &&
           !pedido.avaliacao;
  };

  const renderStatusBadge = (status: StatusPedido) => (
    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[status] }]}>
      <Text style={styles.statusBadgeText}>{STATUS_LABELS[status]}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: ItemPedido }) => (
    <View style={styles.itemRow}>
      <View style={styles.itemImageContainer}>
        <Image
          source={{ uri: 'https://via.placeholder.com/80x80/E6F4FE/1E3A5F?text=Produto' }}
          style={styles.itemImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.itemInfo} >
        <Text style={styles.itemNome}>{item.produto?.nome || 'Produto'}</Text>
        <Text style={styles.itemDetails}>
          {item.quantidade}x R$ {item.precoUnitario.toFixed(2).replace('.', ',')}
        </Text>
      </View>
      <Text style={styles.itemTotal}>
        R$ {(item.quantidade * item.precoUnitario).toFixed(2).replace('.', ',')}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (!pedido) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Pedido não encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Status */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.pedidoId}>Pedido #{pedido.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.pedidoDate}>
              {new Date(pedido.criadoEm).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          {renderStatusBadge(pedido.status)}
        </View>

        {/* Progress Steps */}
        <View style={styles.progressContainer}>
          {(['PENDENTE', 'CONFIRMADO', 'EM_PREPARO', 'PRONTO_ENTREGA', 'ENTREGUE'] as StatusPedido[]).map((step, index) => (
            <View key={step} style={styles.progressStep}>
              <View
                style={[
                  styles.progressCircle,
                  getProgressCircleStyle(pedido.status, step),
                ]}
              >
                {getProgressIcon(pedido.status, step)}
              </View>
              <Text
                style={[
                  styles.progressLabel,
                  getProgressLabelStyle(pedido.status, step),
                ]}
              >
                {STATUS_LABELS[step]}
              </Text>
              {index < 4 && (
                <View
                  style={[
                    styles.progressLine,
                    getProgressLineStyle(pedido.status, step),
                  ]}
                />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Order Info */}
      <Card style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Informações da Entrega</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="location" size={20} color="#1E3A5F" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Tipo de Entrega</Text>
              <Text style={styles.infoValue}>{TIPO_ENTREGA_LABELS[pedido.tipoEntrega]}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="home" size={20} color="#1E3A5F" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Unidade</Text>
              <Text style={styles.infoValue}>{pedido.unidadeEntrega}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time" size={20} color="#1E3A5F" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Janela de Horário</Text>
              <Text style={styles.infoValue}>{pedido.janelaHorario}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="cash" size={20} color="#1E3A5F" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Valor Total</Text>
              <Text style={[styles.infoValue, { fontSize: 18, fontWeight: '700', color: '#28A745' }]}>
                R$ {pedido.valorTotal.toFixed(2).replace('.', ',')}
              </Text>
            </View>
          </View>
        </View>

        {(pedido.comprador || (isVendedor && pedido.itens[0]?.produto?.vendedorId)) && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Envolvidos</Text>
            <View style={styles.infoGrid}>
              {pedido.comprador && (
                <View style={styles.infoItem}>
                  <Avatar name={pedido.comprador.nome} size="sm" />
                  <View>
                    <Text style={styles.infoLabel}>Comprador</Text>
                    <Text style={styles.infoValue}>{pedido.comprador.nome}</Text>
                    <Text style={styles.infoSubValue}>{pedido.comprador.unidade}</Text>
                  </View>
                </View>
              )}
              {isVendedor && pedido.itens[0]?.produto?.vendedorId === usuario?.id && pedido.comprador && (
                <View style={styles.infoItem}>
                  <Avatar name={pedido.comprador.nome} size="sm" />
                  <View>
                    <Text style={styles.infoLabel}>Comprador</Text>
                    <Text style={styles.infoValue}>{pedido.comprador.nome}</Text>
                    <Text style={styles.infoSubValue}>{pedido.comprador.unidade} • {pedido.comprador.email}</Text>
                  </View>
                </View>
              )}
            </View>
          </>
        )}
      </Card>

      {/* Items */}
      <Card style={styles.itemsCard}>
        <Text style={styles.sectionTitle}>Itens do Pedido ({pedido.itens.length})</Text>
        <FlatList
          data={pedido.itens}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        />
      </Card>

      {/* Status Actions */}
      {canUpdateStatus() && getNextStatuses(pedido.status).length > 0 && (
        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Ações</Text>
          <View style={styles.actionButtons}>
            {getNextStatuses(pedido.status).map((nextStatus) => (
              <Button
                key={nextStatus}
                title={STATUS_LABELS[nextStatus]}
                onPress={() => handleUpdateStatus(nextStatus)}
                variant={nextStatus === 'CANCELADO' ? 'danger' : 'primary'}
                fullWidth
                size="md"
              />
            ))}
          </View>
        </Card>
      )}

      {/* Avaliação */}
      {canAvaliar() && (
        <Card style={styles.avaliacaoCard}>
          <View style={styles.avaliacaoHeader}>
            <Ionicons name="star-outline" size={24} color="#FFC107" />
            <Text style={styles.sectionTitle}>Avalie este Pedido</Text>
          </View>
          <Button
            title="Avaliar (1 a 5 estrelas)"
            onPress={() => setShowAvaliacaoModal(true)}
            variant="outline"
            fullWidth
          />
        </Card>
      )}

      {pedido.avaliacao && (
        <Card style={styles.avaliacaoCard}>
          <View style={styles.avaliacaoHeader}>
            <Ionicons name="star" size={24} color="#FFC107" />
            <Text style={styles.sectionTitle}>Sua Avaliação</Text>
          </View>
          <View style={styles.avaliacaoContent}>
            <View style={styles.avaliacaoStars}>
              {Array.from({ length: 5 }, (_, i) => (
                <Ionicons
                  key={i}
                  name={i < pedido.avaliacao!.nota ? 'star' : 'star-outline'}
                  size={24}
                  color="#FFC107"
                />
              ))}
            </View>
            {pedido.avaliacao.comentario && (
              <Text style={styles.avaliacaoComentario}>"{pedido.avaliacao.comentario}"</Text>
            )}
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

const getProgressCircleStyle = (currentStatus: StatusPedido, step: StatusPedido) => {
  const order = ['PENDENTE', 'CONFIRMADO', 'EM_PREPARO', 'PRONTO_ENTREGA', 'ENTREGUE'];
  const currentIndex = order.indexOf(currentStatus);
  const stepIndex = order.indexOf(step);

  if (stepIndex < currentIndex) {
    return styles.progressCircleCompleted;
  } else if (stepIndex === currentIndex) {
    return styles.progressCircleActive;
  }
  return styles.progressCirclePending;
};

const getProgressIcon = (currentStatus: StatusPedido, step: StatusPedido) => {
  const order = ['PENDENTE', 'CONFIRMADO', 'EM_PREPARO', 'PRONTO_ENTREGA', 'ENTREGUE'];
  const currentIndex = order.indexOf(currentStatus);
  const stepIndex = order.indexOf(step);

  if (stepIndex < currentIndex) {
    return <Ionicons name="checkmark" size={16} color="#FFFFFF" />;
  } else if (stepIndex === currentIndex) {
    return <Ionicons name="ellipsis-horizontal" size={16} color="#FFFFFF" />;
  }
  return null;
};

const getProgressLabelStyle = (currentStatus: StatusPedido, step: StatusPedido) => {
  const order = ['PENDENTE', 'CONFIRMADO', 'EM_PREPARO', 'PRONTO_ENTREGA', 'ENTREGUE'];
  const currentIndex = order.indexOf(currentStatus);
  const stepIndex = order.indexOf(step);

  if (stepIndex <= currentIndex) {
    return styles.progressLabelActive;
  }
  return styles.progressLabelPending;
};

const getProgressLineStyle = (currentStatus: StatusPedido, step: StatusPedido) => {
  const order = ['PENDENTE', 'CONFIRMADO', 'EM_PREPARO', 'PRONTO_ENTREGA', 'ENTREGUE'];
  const currentIndex = order.indexOf(currentStatus);
  const stepIndex = order.indexOf(step);

  if (stepIndex < currentIndex) {
    return styles.progressLineCompleted;
  }
  return styles.progressLinePending;
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
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
  header: {
    backgroundColor: '#1E3A5F',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pedidoId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pedidoDate: {
    fontSize: 13,
    color: '#A8C5E0',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStep: {
    flex: 1,
    alignItems: 'center',
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  progressCirclePending: {
    borderColor: '#A8C5E0',
    backgroundColor: 'transparent',
  },
  progressCircleActive: {
    borderColor: '#FFFFFF',
    backgroundColor: '#1E3A5F',
  },
  progressCircleCompleted: {
    borderColor: '#28A745',
    backgroundColor: '#28A745',
  },
  progressLine: {
    position: 'absolute',
    top: 16,
    left: '50%',
    right: '-50%',
    height: 2,
    zIndex: -1,
  },
  progressLinePending: {
    backgroundColor: '#A8C5E0',
  },
  progressLineCompleted: {
    backgroundColor: '#28A745',
  },
  progressLabel: {
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
  },
  progressLabelPending: {
    color: '#A8C5E0',
  },
  progressLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 16,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    gap: 10,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 11,
    color: '#9AA8B8',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  infoSubValue: {
    fontSize: 12,
    color: '#6C7A8A',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8EFF5',
    marginVertical: 16,
  },
  itemsCard: {
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemNome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  itemDetails: {
    fontSize: 12,
    color: '#6C7A8A',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A5F',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  itemSeparator: {
    height: 1,
    backgroundColor: '#E8EFF5',
    marginHorizontal: 12,
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionButtons: {
    gap: 8,
  },
  avaliacaoCard: {
    marginBottom: 16,
  },
  avaliacaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  avaliacaoContent: {
    gap: 8,
  },
  avaliacaoStars: {
    flexDirection: 'row',
    gap: 4,
  },
  avaliacaoComentario: {
    fontSize: 14,
    color: '#3D4A5A',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});