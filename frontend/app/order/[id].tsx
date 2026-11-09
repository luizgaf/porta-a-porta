import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, FlatList, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Card, Button, Avatar, ProductImage, Input, Estrelas, nomeDaNota } from '../../components/ui';
import { STATUS_LABELS, TIPO_ENTREGA_LABELS, ACAO_STATUS_LABELS } from '../../constants';
import { Pedido, ItemPedido, StatusPedido } from '../../types';
import { formatBRL, toNumber } from '../../utils/format';

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
  // Produto que está sendo avaliado (uma avaliação por produto do pedido)
  const [avaliando, setAvaliando] = useState<{ id: string; nome: string } | null>(null);
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

  const abrirAvaliacao = (produto: { id: string; nome: string }) => {
    setAvaliacaoNota(0);
    setAvaliacaoComentario('');
    setAvaliando(produto);
  };

  const handleAvaliacao = async () => {
    if (!pedido || !avaliando) return;
    if (avaliacaoNota === 0) {
      Alert.alert('Escolha uma nota', 'Toque nas estrelas para dar uma nota de 1 a 5.');
      return;
    }

    setAvaliacaoLoading(true);
    try {
      await createAvaliacao({
        pedidoId: pedido.id,
        produtoId: avaliando.id,
        nota: avaliacaoNota,
        comentario: avaliacaoComentario.trim() || undefined,
      });
      setAvaliando(null);
      Alert.alert('Obrigado!', 'Sua avaliação foi enviada. Ela aparece no anúncio sem mostrar o seu nome.');
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
    const proximos = transitions[currentStatus] || [];
    // Quem vende algum item conduz o pedido; quem comprou só pode cancelar (a API aplica a mesma regra)
    const ehVendedorDoPedido = pedido?.itens.some(i => i.produto?.vendedorId === usuario?.id);
    if (!ehVendedorDoPedido) {
      return proximos.filter(s => s === 'CANCELADO');
    }
    return proximos;
  };

  const canUpdateStatus = () => {
    if (!pedido) return false;
    if (pedido.itens.some(i => i.produto?.vendedorId === usuario?.id)) return true;
    return pedido.compradorId === usuario?.id;
  };

  // Só quem comprou avalia, depois da entrega; cada produto do pedido recebe a sua nota
  const souComprador = !!pedido && pedido.compradorId === usuario?.id;
  const produtosDoPedido = pedido
    ? pedido.itens
        .filter((i, k, todos) => !!i.produto && todos.findIndex((o) => o.produtoId === i.produtoId) === k)
        .map((i) => ({ id: i.produtoId, nome: i.produto?.nome || 'Produto' }))
    : [];
  const avaliacaoDo = (produtoId: string) => pedido?.avaliacoes?.find((a) => a.produtoId === produtoId);
  const mostrarAvaliacoes = souComprador && pedido?.status === 'ENTREGUE' && produtosDoPedido.length > 0;

  const renderStatusBadge = (status: StatusPedido) => (
    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[status] }]}>
      <Text style={styles.statusBadgeText}>{STATUS_LABELS[status]}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: ItemPedido }) => (
    <View style={styles.itemRow}>
      <View style={styles.itemImageContainer}>
        <ProductImage url={item.produto?.imagemUrl} style={styles.itemImage} iconSize={24} />
      </View>
      <View style={styles.itemInfo} >
        <Text style={styles.itemNome}>{item.produto?.nome || 'Produto'}</Text>
        <Text style={styles.itemDetails}>
          {item.quantidade}x {formatBRL(item.precoUnitario)}
        </Text>
      </View>
      <Text style={styles.itemTotal}>
        {formatBRL(item.quantidade * toNumber(item.precoUnitario))}
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
                {formatBRL(pedido.valorTotal)}
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
            </View>
          </>
        )}
      </Card>

      {/* Items */}
      <Card style={styles.itemsCard}>
        <Text style={styles.sectionTitle}>Itens do Pedido ({pedido.itens.length})</Text>
        <FlatList
          // A rolagem é da tela; a lista não rola sozinha (evita listas aninhadas)
          scrollEnabled={false}
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
                title={ACAO_STATUS_LABELS[nextStatus]}
                onPress={() => handleUpdateStatus(nextStatus)}
                variant={nextStatus === 'CANCELADO' ? 'danger' : 'primary'}
                fullWidth
                size="md"
              />
            ))}
          </View>
        </Card>
      )}

      {/* Avaliações: uma por produto, só para quem comprou e depois da entrega */}
      {mostrarAvaliacoes && (
        <Card style={styles.avaliacaoCard}>
          <View style={styles.avaliacaoHeader}>
            <Ionicons name="star-outline" size={22} color="#F5A524" />
            <Text style={[styles.sectionTitle, styles.semMargem]}>Avalie o que você comprou</Text>
          </View>
          <Text style={styles.avaliacaoAjuda}>
            A nota aparece no anúncio sem o seu nome e não pode ser alterada depois.
          </Text>
          {produtosDoPedido.map((p) => {
            const feita = avaliacaoDo(p.id);
            return (
              <View key={p.id} style={styles.avaliacaoLinha}>
                <View style={styles.avaliacaoLinhaTexto}>
                  <Text style={styles.avaliacaoProduto} numberOfLines={1}>{p.nome}</Text>
                  {feita ? (
                    <>
                      <Estrelas nota={feita.nota} tamanho={16} />
                      {feita.comentario ? (
                        <Text style={styles.avaliacaoComentario}>"{feita.comentario}"</Text>
                      ) : null}
                      {feita.removidaPor ? (
                        <Text style={styles.avaliacaoRemovida}>Removida pelo síndico</Text>
                      ) : null}
                    </>
                  ) : (
                    <Text style={styles.avaliacaoPendente}>Ainda não avaliado</Text>
                  )}
                </View>
                {!feita && (
                  <Button title="Avaliar" onPress={() => abrirAvaliacao(p)} variant="outline" size="sm" />
                )}
              </View>
            );
          })}
        </Card>
      )}

      <Modal visible={!!avaliando} animationType="slide" transparent onRequestClose={() => setAvaliando(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalFundo}>
          <TouchableOpacity style={styles.modalFundo} activeOpacity={1} onPress={() => setAvaliando(null)} />
          <View style={styles.modalCaixa}>
            <View style={styles.modalTopo}>
              <Text style={styles.modalTitulo}>Avaliar produto</Text>
              <TouchableOpacity onPress={() => setAvaliando(null)} accessibilityLabel="Fechar">
                <Ionicons name="close" size={24} color="#6C7A8A" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalProduto}>{avaliando?.nome}</Text>
            <Estrelas nota={avaliacaoNota} tamanho={36} onChange={setAvaliacaoNota} style={styles.modalEstrelas} />
            <Text style={styles.modalNotaNome}>{avaliacaoNota ? nomeDaNota(avaliacaoNota) : 'Toque numa estrela'}</Text>
            <Input
              label="Comentário (opcional)"
              placeholder="Conte como foi: sabor, entrega, atendimento..."
              value={avaliacaoComentario}
              onChangeText={setAvaliacaoComentario}
              multiline
              maxLength={500}
            />
            <Button
              title="Enviar avaliação"
              onPress={handleAvaliacao}
              loading={avaliacaoLoading}
              disabled={avaliacaoNota === 0}
              fullWidth
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    marginBottom: 6,
  },
  semMargem: {
    marginBottom: 0,
  },
  avaliacaoAjuda: {
    fontSize: 13,
    color: '#6C7A8A',
    marginBottom: 8,
  },
  avaliacaoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8EBEF',
  },
  avaliacaoLinhaTexto: {
    flex: 1,
    gap: 4,
  },
  avaliacaoProduto: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  avaliacaoPendente: {
    fontSize: 13,
    color: '#9AA8B8',
  },
  avaliacaoRemovida: {
    fontSize: 12,
    color: '#B42318',
  },
  modalFundo: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalCaixa: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    gap: 12,
  },
  modalTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  modalProduto: {
    fontSize: 15,
    color: '#3D4A5A',
  },
  modalEstrelas: {
    justifyContent: 'center',
    marginTop: 4,
  },
  modalNotaNome: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#6C7A8A',
  },
  avaliacaoComentario: {
    fontSize: 14,
    color: '#3D4A5A',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});