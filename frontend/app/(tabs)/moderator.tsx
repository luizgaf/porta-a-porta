import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, ScrollView, Modal } from 'react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Card, Button, Input } from '../../components/ui';
import { STATUS_LABELS } from '../../constants';
import { Avaliacao, Denuncia, Produto } from '../../types';
import { aoChegarPertoDoFim } from '../../utils/rolagem';
import { PedidosParticipacao } from '../../components/moderacao/PedidosParticipacao';

type Aba = 'DENUNCIAS' | 'AVALIACOES' | 'MORADORES';
const NOME_ABA: Record<Aba, string> = { DENUNCIAS: 'Denúncias', AVALIACOES: 'Avaliações', MORADORES: 'Moradores' };

export default function ModeratorScreen() {
  const router = useRouter();
  const { isSindico } = useAuth();
  const { getDenuncias, getDenunciasProduto, updateDenunciaStatus, getProduto, getAvaliacoes, deleteAvaliacao } = useApi();

  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [selectedDenuncia, setSelectedDenuncia] = useState<Denuncia | null>(null);
  const [denunciasProduto, setDenunciasProduto] = useState<Denuncia[]>([]);
  const [loadingDenunciasProduto, setLoadingDenunciasProduto] = useState(false);
  const [produtoDetalhe, setProdutoDetalhe] = useState<Produto | null>(null);
  const [acaoPendente, setAcaoPendente] = useState<'QUARENTENA' | 'RESTAURAR' | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const [processando, setProcessando] = useState(false);

  // Aba de avaliações: o síndico remove avaliações abusivas, com justificativa (RN02)
  // Um aviso de pedido de participação abre direto na aba de moradores
  const params = useLocalSearchParams<{ aba?: string }>();
  const [aba, setAba] = useState<Aba>(params.aba === 'MORADORES' ? 'MORADORES' : 'DENUNCIAS');
  const [atualizarMoradores, setAtualizarMoradores] = useState(0);
  const [pedidosMoradores, setPedidosMoradores] = useState<number | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loadingAvaliacoes, setLoadingAvaliacoes] = useState(false);
  const [avaliacaoParaRemover, setAvaliacaoParaRemover] = useState<Avaliacao | null>(null);
  const [justificativaRemocao, setJustificativaRemocao] = useState('');
  const [removendo, setRemovendo] = useState(false);

  const carregarAvaliacoes = useCallback(async () => {
    setLoadingAvaliacoes(true);
    try {
      const response = await getAvaliacoes({ limite: 50 });
      setAvaliacoes(response.avaliacoes || []);
    } catch (error: any) {
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      setLoadingAvaliacoes(false);
      setRefreshing(false);
    }
  }, [getAvaliacoes]);

  const trocarAba = (novaAba: Aba) => {
    setAba(novaAba);
    if (novaAba === 'AVALIACOES' && avaliacoes.length === 0) carregarAvaliacoes();
  };

  const fecharRemocao = () => {
    setAvaliacaoParaRemover(null);
    setJustificativaRemocao('');
  };

  const handleRemoverAvaliacao = async () => {
    if (!avaliacaoParaRemover?.pedidoId) return;
    if (justificativaRemocao.trim().length < 5) {
      Alert.alert('Justificativa obrigatória', 'Explique o motivo da remoção (mínimo 5 caracteres).');
      return;
    }
    setRemovendo(true);
    try {
      await deleteAvaliacao(avaliacaoParaRemover.pedidoId, justificativaRemocao.trim());
      setAvaliacoes(prev =>
        prev.map(a => (a.id === avaliacaoParaRemover.id ? { ...a, removidaPor: 'sindico' } : a))
      );
      fecharRemocao();
      Alert.alert('Avaliação removida', 'A remoção foi registrada no log de auditoria.');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível remover a avaliação');
    } finally {
      setRemovendo(false);
    }
  };

  const carregarDenuncias = useCallback(async (paginaAtual = 1, isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const response = await getDenuncias({ pagina: paginaAtual, limite: 20 });
      const denunciasData = response.denuncias || response.data || [];
      if (paginaAtual === 1) {
        setDenuncias(denunciasData);
      } else {
        setDenuncias(prev => [...prev, ...denunciasData]);
      }
      setPagina(response.paginacao.pagina);
      setTotalPaginas(response.paginacao.totalPaginas);
    } catch (error: any) {
      console.error('Erro ao carregar denúncias:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getDenuncias]);

  useEffect(() => {
    if (isSindico) carregarDenuncias(1, true);
  }, [isSindico]);

  const handleRefresh = () => {
    setRefreshing(true);
    if (aba === 'AVALIACOES') carregarAvaliacoes();
    else if (aba === 'MORADORES') {
      setAtualizarMoradores(n => n + 1);
      setRefreshing(false);
    } else carregarDenuncias(1, true);
  };

  const handleLoadMore = () => {
    if (pagina < totalPaginas && !loading) {
      carregarDenuncias(pagina + 1);
    }
  };

  const fecharDetalhe = () => {
    setSelectedDenuncia(null);
    setAcaoPendente(null);
    setJustificativa('');
  };

  const handleViewDenuncias = async (denuncia: Denuncia) => {
    setSelectedDenuncia(denuncia);
    setProdutoDetalhe(denuncia.produto as Produto);
    setAcaoPendente(null);
    setJustificativa('');
    setLoadingDenunciasProduto(true);
    try {
      // A listagem de denúncias não traz o status do produto; busca o produto para saber se já está em quarentena
      const [denunciasResponse, produtoResponse] = await Promise.all([
        getDenunciasProduto(denuncia.produtoId),
        getProduto(denuncia.produtoId),
      ]);
      setDenunciasProduto(denunciasResponse.denuncias);
      setProdutoDetalhe(produtoResponse.produto);
    } catch (error) {
      console.error('Erro ao carregar denúncias do produto:', error);
    } finally {
      setLoadingDenunciasProduto(false);
    }
  };

  const handleQuarentena = async () => {
    if (!selectedDenuncia || !acaoPendente) return;
    const acao = acaoPendente;
    if (acao === 'QUARENTENA' && justificativa.trim().length < 5) {
      Alert.alert('Motivo obrigatório', 'Explique o motivo da quarentena (mínimo 5 caracteres). O vendedor vai ler este texto.');
      return;
    }
    const novoStatus = acao === 'QUARENTENA' ? 'QUARENTENA' : 'ATIVO';

    setProcessando(true);
    try {
      await updateDenunciaStatus(selectedDenuncia.produtoId, {
        acao,
        justificativa: justificativa.trim() || undefined,
      });
      Alert.alert('Sucesso', `Produto ${acao === 'QUARENTENA' ? 'colocado em quarentena' : 'restaurado'}`);
      setDenuncias(prev =>
        prev.map(d =>
          d.produtoId === selectedDenuncia.produtoId
            ? { ...d, produto: { ...d.produto!, status: novoStatus } }
            : d
        )
      );
      fecharDetalhe();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao processar ação');
    } finally {
      setProcessando(false);
    }
  };

  const renderStatusBadge = (status: string) => (
    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
      <Text style={styles.statusBadgeText}>{STATUS_LABELS[status]}</Text>
    </View>
  );

  const renderDenuncia = ({ item }: { item: Denuncia }) => (
    <TouchableOpacity
      style={styles.denunciaCard}
      onPress={() => handleViewDenuncias(item)}
      activeOpacity={0.8}
    >
      <View style={styles.denunciaHeader}>
        <View style={styles.denunciaProduto}>
          <Text style={styles.denunciaProdutoNome}>{item.produto?.nome || 'Produto'}</Text>
          {item.produto?.status ? renderStatusBadge(item.produto.status) : null}
        </View>
        <View style={styles.denunciaMeta}>
          <Text style={styles.denunciaDenunciante}>Denúncia anônima</Text>
          <Text style={styles.denunciaDate}>
            {new Date(item.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      <Text style={styles.denunciaMotivo}>"{item.motivo}"</Text>

      <View style={styles.denunciaActions}>
        <Button
          title="Ver Detalhes"
          onPress={() => handleViewDenuncias(item)}
          variant="outline"
          size="sm"
          fullWidth
        />
      </View>
    </TouchableOpacity>
  );

  const renderAvaliacao = (item: Avaliacao) => {
    const produtos = (item.pedido?.itens || []).map(i => i.produto?.nome).filter(Boolean).join(', ');
    const removida = !!item.removidaPor;
    return (
      <View key={item.id} style={[styles.denunciaCard, removida && styles.avaliacaoRemovida]}>
        <View style={styles.avaliacaoTopo}>
          <View style={styles.estrelas} accessibilityLabel={`Nota ${item.nota} de 5`}>
            {[1, 2, 3, 4, 5].map(n => (
              <Ionicons key={n} name={n <= item.nota ? 'star' : 'star-outline'} size={16} color="#FFC107" />
            ))}
          </View>
          <Text style={styles.denunciaDate}>
            {new Date(item.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {produtos ? <Text style={styles.denunciaProdutoNome}>{produtos}</Text> : null}
        <Text style={styles.denunciaDenunciante}>Avaliação anônima</Text>
        {item.comentario ? <Text style={styles.denunciaMotivo}>"{item.comentario}"</Text> : null}
        <View style={styles.denunciaActions}>
          {removida ? (
            <View style={styles.removidaTag}>
              <Ionicons name="eye-off-outline" size={14} color="#6C7A8A" />
              <Text style={styles.removidaTexto}>Removida pelo síndico</Text>
            </View>
          ) : (
            <Button title="Remover avaliação" onPress={() => setAvaliacaoParaRemover(item)} variant="outline" size="sm" fullWidth />
          )}
        </View>
      </View>
    );
  };

  if (!isSindico) {
    return (
      <View style={styles.unauthorizedContainer}>
        <Ionicons name="lock-closed-outline" size={48} color="#D1E3F0" />
        <Text style={styles.unauthorizedText}>Acesso restrito ao síndico</Text>
      </View>
    );
  }

  if (loading && denuncias.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.loadingText}>Carregando denúncias...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      onScroll={aoChegarPertoDoFim(() => aba === 'DENUNCIAS' && handleLoadMore())}
      scrollEventThrottle={200}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#1E3A5F']} />
      }
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Painel de Moderação</Text>
        <Text style={styles.headerSubtitle}>
          {aba === 'DENUNCIAS'
            ? `${denuncias.length} denúncia(s) no condomínio`
            : aba === 'AVALIACOES'
              ? `${avaliacoes.filter(a => !a.removidaPor).length} avaliação(ões) visível(is) no condomínio`
              : `${pedidosMoradores ?? 0} pedido(s) para participar do condomínio`}
        </Text>
      </View>

      <View style={styles.abas}>
        {(['DENUNCIAS', 'AVALIACOES', 'MORADORES'] as const).map(opcao => (
          <TouchableOpacity
            key={opcao}
            style={[styles.aba, aba === opcao && styles.abaAtiva]}
            onPress={() => trocarAba(opcao)}
            accessibilityState={{ selected: aba === opcao }}
          >
            <Text style={[styles.abaTexto, aba === opcao && styles.abaTextoAtivo]}>
              {NOME_ABA[opcao]}
              {opcao === 'MORADORES' && pedidosMoradores ? ` (${pedidosMoradores})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {aba === 'MORADORES' ? (
        <PedidosParticipacao atualizar={atualizarMoradores} onContagem={setPedidosMoradores} />
      ) : aba === 'AVALIACOES' ? (
        loadingAvaliacoes && avaliacoes.length === 0 ? (
          <ActivityIndicator size="large" color="#1E3A5F" style={styles.loadMoreIndicator} />
        ) : avaliacoes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="star-outline" size={48} color="#9AA8B8" />
            <Text style={styles.emptyText}>Nenhuma avaliação</Text>
            <Text style={styles.emptySubtext}>As avaliações dos pedidos entregues aparecem aqui.</Text>
          </View>
        ) : (
          <View style={styles.listaAvaliacoes}>{avaliacoes.map(renderAvaliacao)}</View>
        )
      ) : denuncias.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="shield-checkmark-outline" size={48} color="#28A745" />
          <Text style={styles.emptyText}>Nenhuma denúncia</Text>
          <Text style={styles.emptySubtext}>Tudo tranquilo no condomínio!</Text>
        </View>
      ) : (
        <FlatList
          // A rolagem é da tela; a lista não rola sozinha (evita listas aninhadas)
          scrollEnabled={false}
          data={denuncias}
          renderItem={renderDenuncia}
          keyExtractor={(item) => item.id}
          ListFooterComponent={
            pagina < totalPaginas && !loading ? (
              <ActivityIndicator size="small" color="#1E3A5F" style={styles.loadMoreIndicator} />
            ) : null
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Remoção de avaliação */}
      {avaliacaoParaRemover && (
        <Modal visible={true} animationType="slide" transparent={true} onRequestClose={fecharRemocao}>
          <TouchableOpacity style={styles.modalOverlay} onPress={fecharRemocao} activeOpacity={1}>
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Remover avaliação</Text>
                <TouchableOpacity onPress={fecharRemocao}>
                  <Ionicons name="close" size={24} color="#6C7A8A" />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={styles.modalBody}>
                {avaliacaoParaRemover.comentario ? (
                  <Text style={styles.modalDenunciaMotivo}>"{avaliacaoParaRemover.comentario}"</Text>
                ) : null}
                <View style={styles.modalActions}>
                  <Input
                    label="Justificativa *"
                    placeholder="Ex.: comentário ofensivo, pedido do vendedor..."
                    value={justificativaRemocao}
                    onChangeText={setJustificativaRemocao}
                    multiline
                  />
                  <Button title="Confirmar remoção" onPress={handleRemoverAvaliacao} variant="danger" loading={removendo} fullWidth />
                  <Button title="Cancelar" onPress={fecharRemocao} variant="ghost" fullWidth />
                </View>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Detail Modal */}
      {selectedDenuncia && (
        <Modal visible={true} animationType="slide" transparent={true} onRequestClose={fecharDetalhe}>
          <TouchableOpacity style={styles.modalOverlay} onPress={fecharDetalhe} activeOpacity={1}>
            {/* Captura o toque para não fechar o modal ao interagir com o conteúdo */}
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitle}>{produtoDetalhe?.nome || 'Produto'}</Text>
                  {produtoDetalhe && renderStatusBadge(produtoDetalhe.status)}
                </View>
                <TouchableOpacity onPress={fecharDetalhe}>
                  <Ionicons name="close" size={24} color="#6C7A8A" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalBody}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Denúncias ({denunciasProduto.length})</Text>
                  {loadingDenunciasProduto ? (
                    <View style={styles.loadingMini}>
                      <ActivityIndicator size="small" color="#1E3A5F" />
                    </View>
                  ) : denunciasProduto.length === 0 ? (
                    <Text style={styles.modalEmptyText}>Nenhuma denúncia detalhada</Text>
                  ) : (
                    <FlatList
                      // A rolagem é da tela; a lista não rola sozinha (evita listas aninhadas)
                      scrollEnabled={false}
                      data={denunciasProduto}
                      renderItem={({ item }) => (
                        <View style={styles.modalDenunciaItem}>
                          <Text style={styles.modalDenunciaMotivo}>"{item.motivo}"</Text>
                          <Text style={styles.modalDenunciaDate}>
                            {new Date(item.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      )}
                      keyExtractor={(item) => item.id}
                      ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
                    />
                  )}
                </View>

                <View style={styles.modalActions}>
                  {acaoPendente ? (
                    <>
                      <Input
                        label={acaoPendente === 'QUARENTENA' ? 'Motivo (o vendedor vai ler este texto)' : 'Justificativa (opcional)'}
                        placeholder={acaoPendente === 'QUARENTENA' ? 'Por que suspender este produto?' : 'Por que restaurar este produto?'}
                        value={justificativa}
                        onChangeText={setJustificativa}
                        multiline
                      />
                      <Button
                        title={acaoPendente === 'QUARENTENA' ? 'Confirmar Quarentena' : 'Confirmar Restauração'}
                        onPress={handleQuarentena}
                        variant={acaoPendente === 'QUARENTENA' ? 'danger' : 'primary'}
                        loading={processando}
                        fullWidth
                      />
                      <Button title="Cancelar" onPress={() => setAcaoPendente(null)} variant="ghost" fullWidth />
                    </>
                  ) : produtoDetalhe?.status === 'QUARENTENA' ? (
                    <>
                      {produtoDetalhe.quarentena && (
                        <Text style={styles.motivoAtual}>
                          {produtoDetalhe.quarentena.porSindico ? 'Motivo registrado: ' : ''}
                          {produtoDetalhe.quarentena.motivo}
                        </Text>
                      )}
                      <Button
                        title="Restaurar Produto"
                        onPress={() => setAcaoPendente('RESTAURAR')}
                        disabled={loadingDenunciasProduto}
                        fullWidth
                      />
                      {/* Na quarentena automática, o síndico confirma a suspensão e registra o motivo para o vendedor */}
                      <Button
                        title="Manter em Quarentena"
                        onPress={() => setAcaoPendente('QUARENTENA')}
                        variant="danger"
                        disabled={loadingDenunciasProduto}
                        fullWidth
                      />
                    </>
                  ) : (
                    <Button
                      title="Colocar em Quarentena"
                      onPress={() => setAcaoPendente('QUARENTENA')}
                      variant="danger"
                      disabled={loadingDenunciasProduto}
                      fullWidth
                    />
                  )}
                </View>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </ScrollView>
  );
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    ATIVO: '#28A745',
    PAUSADO: '#6C7A8A',
    QUARENTENA: '#DC3545',
    EXCLUIDO: '#9AA8B8',
    PENDENTE: '#FFC107',
    CONFIRMADO: '#17A2B8',
    EM_PREPARO: '#6F42C1',
    PRONTO_ENTREGA: '#FD7E14',
    ENTREGUE: '#28A745',
    CANCELADO: '#DC3545',
  };
  return colors[status] || '#6C7A8A';
};

const styles = StyleSheet.create({
  motivoAtual: {
    fontSize: 13,
    color: '#A52834',
    backgroundColor: '#FDECEA',
    padding: 10,
    borderRadius: 8,
  },
  abas: {
    flexDirection: 'row',
    backgroundColor: '#E8EFF5',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  aba: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  abaAtiva: {
    backgroundColor: '#FFFFFF',
  },
  abaTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C7A8A',
  },
  abaTextoAtivo: {
    color: '#1E3A5F',
  },
  listaAvaliacoes: {
    gap: 12,
  },
  avaliacaoTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  estrelas: {
    flexDirection: 'row',
    gap: 2,
  },
  avaliacaoRemovida: {
    opacity: 0.6,
  },
  removidaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  removidaTexto: {
    fontSize: 13,
    color: '#6C7A8A',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  unauthorizedText: {
    fontSize: 16,
    color: '#6C7A8A',
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
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6C7A8A',
    marginTop: 4,
  },
  separator: {
    height: 8,
  },
  denunciaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EFF5',
  },
  denunciaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  denunciaProduto: {
    flex: 1,
    marginRight: 12,
  },
  denunciaProdutoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  denunciaMeta: {
    alignItems: 'flex-end',
  },
  denunciaDenunciante: {
    fontSize: 13,
    color: '#3D4A5A',
  },
  denunciaDate: {
    fontSize: 12,
    color: '#9AA8B8',
    marginTop: 2,
  },
  denunciaMotivo: {
    fontSize: 14,
    color: '#3D4A5A',
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 20,
  },
  denunciaActions: {},
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EFF5',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    gap: 20,
  },
  modalSection: {},
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 12,
  },
  loadingMini: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  modalEmptyText: {
    textAlign: 'center',
    color: '#9AA8B8',
    paddingVertical: 20,
  },
  modalDenunciaItem: {
    paddingVertical: 12,
    backgroundColor: '#FDFBF7',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  modalDenunciaAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  modalDenunciaName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  modalDenunciaUnit: {
    fontSize: 12,
    color: '#6C7A8A',
  },
  modalDenunciaMotivo: {
    fontSize: 13,
    color: '#3D4A5A',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  modalDenunciaDate: {
    fontSize: 11,
    color: '#9AA8B8',
  },
  modalSeparator: {
    height: 8,
  },
  modalActions: {
    paddingTop: 10,
    gap: 10,
  },
});