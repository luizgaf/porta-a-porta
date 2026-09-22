import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, ScrollView, Modal } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Card, Button, Avatar } from '../../components/ui';
import { STATUS_LABELS } from '../../constants';
import { Denuncia, Produto } from '../../types';

export default function ModeratorScreen() {
  const router = useRouter();
  const { isSindico } = useAuth();
  const { getDenuncias, getDenunciasProduto, updateDenunciaStatus } = useApi();

  if (!isSindico) {
    return (
      <View style={styles.unauthorizedContainer}>
        <Ionicons name="lock-closed-outline" size={48} color="#D1E3F0" />
        <Text style={styles.unauthorizedText}>Acesso restrito ao síndico</Text>
      </View>
    );
  }

  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [selectedDenuncia, setSelectedDenuncia] = useState<Denuncia | null>(null);
  const [denunciasProduto, setDenunciasProduto] = useState<Denuncia[]>([]);
  const [loadingDenunciasProduto, setLoadingDenunciasProduto] = useState(false);
  const [produtoDetalhe, setProdutoDetalhe] = useState<Produto | null>(null);

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
    carregarDenuncias(1, true);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    carregarDenuncias(1, true);
  };

  const handleLoadMore = () => {
    if (pagina < totalPaginas && !loading) {
      carregarDenuncias(pagina + 1);
    }
  };

  const handleViewDenuncias = async (denuncia: Denuncia) => {
    setSelectedDenuncia(denuncia);
    setLoadingDenunciasProduto(true);
    try {
      const response = await getDenunciasProduto(denuncia.produtoId);
      setDenunciasProduto(response.denuncias);
      setProdutoDetalhe(denuncia.produto as Produto);
    } catch (error) {
      console.error('Erro ao carregar denúncias do produto:', error);
    } finally {
      setLoadingDenunciasProduto(false);
    }
  };

  const handleQuarentena = async (acao: 'QUARENTENA' | 'RESTAURAR') => {
    if (!selectedDenuncia) return;

    const justificativa = await promptJustificativa(acao);
    if (justificativa === null) return; // User cancelled

    try {
      await updateDenunciaStatus(selectedDenuncia.produtoId, { acao, justificativa });
      Alert.alert('Sucesso', `Produto ${acao === 'QUARENTENA' ? 'colocado em quarentena' : 'restaurado'}`);

      // Update local state
      setDenuncias(prev =>
        prev.map(d =>
          d.produtoId === selectedDenuncia.produtoId
            ? { ...d, produto: { ...d.produto!, status: acao === 'QUARENTENA' ? 'QUARENTENA' : 'ATIVO' } }
            : d
        )
      );

      if (produtoDetalhe) {
        setProdutoDetalhe({ ...produtoDetalhe, status: acao === 'QUARENTENA' ? 'QUARENTENA' : 'ATIVO' });
      }

      setSelectedDenuncia(null);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao processar ação');
    }
  };

  const promptJustificativa = (acao: 'QUARENTENA' | 'RESTAURAR'): Promise<string | null> => {
    return new Promise((resolve) => {
      Alert.prompt(
        acao === 'QUARENTENA' ? 'Colocar em Quarentena' : 'Restaurar Produto',
        `Digite a justificativa para ${acao === 'QUARENTENA' ? 'colocar em quarentena' : 'restaurar'} este produto:`,
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(null) },
          { text: 'Confirmar', onPress: (text?: string) => resolve(text || '') },
        ],
        'plain-text',
        ''
      );
    });
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
          {renderStatusBadge(item.produto?.status || 'ATIVO')}
        </View>
        <View style={styles.denunciaMeta}>
          <Text style={styles.denunciaDenunciante}>
            Por {item.denunciante?.nome || 'Anônimo'} ({item.denunciante?.unidade || ''})
          </Text>
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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#1E3A5F']} />
      }
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Painel de Moderação</Text>
        <Text style={styles.headerSubtitle}>
          {denuncias.length} denúncia(s) no condomínio
        </Text>
      </View>

      {denuncias.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="shield-checkmark-outline" size={48} color="#28A745" />
          <Text style={styles.emptyText}>Nenhuma denúncia</Text>
          <Text style={styles.emptySubtext}>Tudo tranquilo no condomínio!</Text>
        </View>
      ) : (
        <FlatList
          data={denuncias}
          renderItem={renderDenuncia}
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

      {/* Detail Modal */}
      {selectedDenuncia && (
        <Modal visible={true} animationType="slide" transparent={true} onRequestClose={() => setSelectedDenuncia(null)}>
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setSelectedDenuncia(null)} activeOpacity={1}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitle}>{produtoDetalhe?.nome || 'Produto'}</Text>
                  {produtoDetalhe && renderStatusBadge(produtoDetalhe.status)}
                </View>
                <TouchableOpacity onPress={() => setSelectedDenuncia(null)}>
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
                      data={denunciasProduto}
                      renderItem={({ item }) => (
                        <View style={styles.modalDenunciaItem}>
                          <View style={styles.modalDenunciaAuthor}>
                            <Avatar name={item.denunciante?.nome || 'U'} size="xs" />
                            <View>
                              <Text style={styles.modalDenunciaName}>{item.denunciante?.nome || 'Anônimo'}</Text>
                              <Text style={styles.modalDenunciaUnit}>{item.denunciante?.unidade || ''}</Text>
                            </View>
                          </View>
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
                  <Button
                    title={produtoDetalhe?.status === 'QUARENTENA' ? 'Restaurar Produto' : 'Colocar em Quarentena'}
                    onPress={() => handleQuarentena(produtoDetalhe?.status === 'QUARENTENA' ? 'RESTAURAR' : 'QUARENTENA')}
                    variant={produtoDetalhe?.status === 'QUARENTENA' ? 'primary' : 'danger'}
                    fullWidth
                  />
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
    backgroundColor: '#F5F8FA',
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
  },
});