import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Card, Button, Avatar, Input } from '../../components/ui';
import { STATUS_LABELS } from '../../constants';
import { Produto } from '../../types';

export default function SellerScreen() {
  const router = useRouter();
  const { isVendedor } = useAuth();
  const { getMeusProdutos, createProduto, updateProdutoStatus, deleteProduto } = useApi();

  if (!isVendedor) {
    return (
      <View style={styles.unauthorizedContainer}>
        <Ionicons name="lock-closed-outline" size={48} color="#D1E3F0" />
        <Text style={styles.unauthorizedText}>Acesso restrito a vendedores</Text>
      </View>
    );
  }

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    categoria: 'Alimentos',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const carregarProdutos = useCallback(async (paginaAtual = 1, isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const params: any = { pagina: paginaAtual, limite: 20 };
      if (statusFilter) params.status = statusFilter;

      const response = await getMeusProdutos(params);
      const produtosData = response.produtos || response.data || [];
      if (paginaAtual === 1) {
        setProdutos(produtosData);
      } else {
        setProdutos(prev => [...prev, ...produtosData]);
      }
      setPagina(response.paginacao.pagina);
      setTotalPaginas(response.paginacao.totalPaginas);
    } catch (error: any) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getMeusProdutos, statusFilter]);

  useEffect(() => {
    carregarProdutos(1, true);
  }, [statusFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    carregarProdutos(1, true);
  };

  const handleLoadMore = () => {
    if (pagina < totalPaginas && !loading) {
      carregarProdutos(pagina + 1);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.nome.trim()) errors.nome = 'Nome é obrigatório';
    if (!formData.preco || parseFloat(formData.preco) <= 0) errors.preco = 'Preço inválido';
    if (!formData.categoria) errors.categoria = 'Categoria é obrigatória';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateProduto = async () => {
    if (!validateForm()) return;

    setCreating(true);
    try {
      await createProduto({
        nome: formData.nome,
        descricao: formData.descricao || undefined,
        preco: parseFloat(formData.preco),
        categoria: formData.categoria,
      });
      setShowCreateModal(false);
      setFormData({ nome: '', descricao: '', preco: '', categoria: 'Alimentos' });
      carregarProdutos(1, true);
      Alert.alert('Sucesso', 'Produto criado com sucesso!');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao criar produto');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (produto: Produto) => {
    const newStatus = produto.status === 'ATIVO' ? 'PAUSADO' : 'ATIVO';
    try {
      await updateProdutoStatus(produto.id, newStatus);
      setProdutos(prev =>
        prev.map(p => p.id === produto.id ? { ...p, status: newStatus } : p)
      );
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao alterar status');
    }
  };

  const handleDelete = (produto: Produto) => {
    Alert.alert(
      'Excluir Produto',
      `Tem certeza que deseja excluir "${produto.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduto(produto.id);
              setProdutos(prev => prev.filter(p => p.id !== produto.id));
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao excluir');
            }
          },
        },
      ]
    );
  };

  const renderStatusBadge = (status: string) => (
    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
      <Text style={styles.statusBadgeText}>{STATUS_LABELS[status]}</Text>
    </View>
  );

  const renderProduto = ({ item }: { item: Produto }) => (
    <TouchableOpacity
      style={styles.produtoCard}
      onPress={() => router.push(`/product/${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.produtoHeader}>
        <View style={styles.produtoMain}>
          <Text style={styles.produtoNome} numberOfLines={1}>{item.nome}</Text>
          <Text style={styles.produtoCategoria}>{item.categoria} • R$ {item.preco.toFixed(2).replace('.', ',')}</Text>
        </View>
        {renderStatusBadge(item.status)}
      </View>

      <View style={styles.produtoActions}>
        <Button
          title={item.status === 'ATIVO' ? 'Pausar' : 'Ativar'}
          onPress={() => handleToggleStatus(item)}
          variant={item.status === 'ATIVO' ? 'outline' : 'primary'}
          size="sm"
          fullWidth
        />
        <Button
          title="Excluir"
          onPress={() => handleDelete(item)}
          variant="danger"
          size="sm"
          fullWidth
        />
      </View>
    </TouchableOpacity>
  );

  const renderFilter = ({ item }: { item: string }) => (
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
        {item === 'TODOS' ? 'Todos' : STATUS_LABELS[item]}
      </Text>
    </TouchableOpacity>
  );

  const statusOptions = ['TODOS', 'ATIVO', 'PAUSADO', 'QUARENTENA', 'EXCLUIDO'];

  if (loading && produtos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.loadingText}>Carregando...</Text>
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
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Painel do Vendedor</Text>
            <Text style={styles.headerSubtitle}>
              {produtos.filter(p => p.status === 'ATIVO').length}/15 produtos ativos
            </Text>
          </View>
          <Button
            title="+ Novo Produto"
            onPress={() => setShowCreateModal(true)}
            size="md"
            style={styles.addButton}
          />
        </View>

        <FlatList
          data={statusOptions}
          renderItem={renderFilter}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
          keyExtractor={(item) => item}
        />
      </View>

      {produtos.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name={statusFilter ? 'filter-outline' : 'storefront-outline'} size={48} color="#D1E3F0" />
          <Text style={styles.emptyText}>
            {statusFilter ? 'Nenhum produto com este status' : 'Nenhum produto cadastrado'}
          </Text>
          <Text style={styles.emptySubtext}>
            {statusFilter ? 'Tente outro filtro' : 'Crie seu primeiro produto para começar a vender'}
          </Text>
          {!statusFilter && (
            <Button title="Criar Produto" onPress={() => setShowCreateModal(true)} style={styles.emptyButton} />
          )}
        </View>
      ) : (
        <FlatList
          data={produtos}
          renderItem={renderProduto}
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

      {/* Create Modal */}
      {showCreateModal && (
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowCreateModal(false)} activeOpacity={1}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Produto</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#6C7A8A" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Input
                label="Nome do Produto *"
                placeholder="Ex: Pão de Queijo Caseiro"
                value={formData.nome}
                onChangeText={(v) => setFormData(prev => ({ ...prev, nome: v }))}
                error={formErrors.nome}
                autoCapitalize="words"
                style={styles.modalInput}
              />

              <Input
                label="Descrição"
                placeholder="Descreva seu produto..."
                value={formData.descricao}
                onChangeText={(v) => setFormData(prev => ({ ...prev, descricao: v }))}
                multiline
                numberOfLines={3}
                style={styles.modalInput}
              />

              <Input
                label="Preço (R$) *"
                placeholder="0,00"
                value={formData.preco}
                onChangeText={(v) => setFormData(prev => ({ ...prev, preco: v }))}
                error={formErrors.preco}
                keyboardType="numeric"
                style={styles.modalInput}
              />

              <Text style={styles.modalLabel}>Categoria *</Text>
              <View style={styles.categoriaGrid}>
                {['Alimentos', 'Bebidas', 'Limpeza', 'Higiene', 'Papelaria', 'Eletrônicos', 'Roupas', 'Outros'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoriaOption,
                      formData.categoria === cat && styles.categoriaOptionSelected,
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, categoria: cat }))}
                  >
                    <Text
                      style={[
                        styles.categoriaOptionText,
                        formData.categoria === cat && styles.categoriaOptionTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Cancelar" onPress={() => setShowCreateModal(false)} variant="outline" fullWidth />
              <Button title="Criar" onPress={handleCreateProduto} loading={creating} fullWidth />
            </View>
          </View>
        </TouchableOpacity>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6C7A8A',
    marginTop: 2,
  },
  addButton: {},
  filtersList: {
    gap: 8,
    paddingHorizontal: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D1E3F0',
    backgroundColor: '#FFFFFF',
  },
  filterChipSelected: {
    borderColor: '#1E3A5F',
    backgroundColor: '#E6F4FE',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3D4A5A',
  },
  filterChipTextSelected: {
    color: '#1E3A5F',
    fontWeight: '600',
  },
  separator: {
    height: 8,
  },
  produtoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EFF5',
  },
  produtoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  produtoMain: {
    flex: 1,
    marginRight: 12,
  },
  produtoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  produtoCategoria: {
    fontSize: 13,
    color: '#6C7A8A',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    flexShrink: 0,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  produtoActions: {
    flexDirection: 'row',
    gap: 8,
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
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyButton: {
    width: 200,
    marginTop: 8,
  },
  loadMoreIndicator: {
    paddingVertical: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    gap: 16,
  },
  modalInput: {
    marginBottom: 0,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
    marginTop: 8,
  },
  categoriaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoriaOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1E3F0',
    backgroundColor: '#FFFFFF',
  },
  categoriaOptionSelected: {
    borderColor: '#1E3A5F',
    backgroundColor: '#E6F4FE',
  },
  categoriaOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3D4A5A',
  },
  categoriaOptionTextSelected: {
    color: '#1E3A5F',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8EFF5',
  },
});