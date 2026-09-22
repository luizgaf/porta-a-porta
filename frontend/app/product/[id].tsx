import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Card, Button, Avatar, Input } from '../../components/ui';
import { STATUS_LABELS } from '../../constants';
import { Produto } from '../../types';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario, isVendedor, isSindico } = useAuth();
  const { getProduto, updateProdutoStatus, deleteProduto, createDenuncia } = useApi();

  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showDenunciaModal, setShowDenunciaModal] = useState(false);
  const [denunciaMotivo, setDenunciaMotivo] = useState('');
  const [denunciaLoading, setDenunciaLoading] = useState(false);

  useEffect(() => {
    if (id) carregarProduto();
  }, [id]);

  const carregarProduto = async () => {
    setLoading(true);
    try {
      const response = await getProduto(id!);
      setProduto(response.produto);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Produto não encontrado', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!produto) return;

    if (produto.status !== 'ATIVO') {
      Alert.alert('Indisponível', 'Este produto não está disponível para compra');
      return;
    }

    if (produto.vendedorId === usuario?.id) {
      Alert.alert('Seu Produto', 'Você não pode comprar seu próprio produto');
      return;
    }

    // Add to cart via cartStore
    const { addItem } = require('../../store/cartStore').useCartStore.getState();
    addItem(produto, 1);
    Alert.alert('Adicionado!', `${produto.nome} foi adicionado ao carrinho`);
  };

  const handleToggleStatus = async () => {
    if (!produto) return;

    const newStatus = produto.status === 'ATIVO' ? 'PAUSADO' : 'ATIVO';
    try {
      await updateProdutoStatus(produto.id, newStatus);
      setProduto({ ...produto, status: newStatus });
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao alterar status');
    }
  };

  const handleDelete = () => {
    if (!produto) return;

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
              router.back();
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao excluir');
            }
          },
        },
      ]
    );
  };

  const handleDenuncia = async () => {
    if (!denunciaMotivo.trim() || denunciaMotivo.length < 10) {
      Alert.alert('Erro', 'O motivo deve ter pelo menos 10 caracteres');
      return;
    }

    setDenunciaLoading(true);
    try {
      await createDenuncia({ produtoId: id!, motivo: denunciaMotivo });
      setShowDenunciaModal(false);
      setDenunciaMotivo('');
      Alert.alert('Denúncia Enviada', 'Obrigado por ajudar a manter a comunidade segura');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao enviar denúncia');
    } finally {
      setDenunciaLoading(false);
    }
  };

  const renderStatusBadge = (status: string) => (
    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
      <Text style={styles.statusBadgeText}>{STATUS_LABELS[status]}</Text>
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

  if (!produto) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Produto não encontrado</Text>
      </View>
    );
  }

  const isOwner = produto.vendedorId === usuario?.id;
  const canManage = isOwner || isSindico;

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: 'https://via.placeholder.com/400x300/E6F4FE/1E3A5F?text=' + encodeURIComponent(produto.nome) }}
          style={styles.image}
          resizeMode="cover"
        />
        {renderStatusBadge(produto.status)}
      </View>

      <View style={styles.content}>
        {/* Title & Price */}
        <View style={styles.titleSection}>
          <View>
            <Text style={styles.nome}>{produto.nome}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.preco}>R$ {produto.preco.toFixed(2).replace('.', ',')}</Text>
              <Text style={styles.categoria}>{produto.categoria}</Text>
            </View>
          </View>
        </View>

        {/* Seller Info */}
        <Card style={styles.sellerCard}>
          <View style={styles.sellerRow}>
            <Avatar name={produto.vendedor?.nome || 'Vendedor'} size="md" />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerNome}>{produto.vendedor?.nome || 'Vendedor'}</Text>
              <Text style={styles.sellerUnidade}>{produto.vendedor?.unidade || ''}</Text>
            </View>
            {isOwner && (
              <View style={styles.sellerBadge}>
                <Text style={styles.sellerBadgeText}>Seu Produto</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Description */}
        {produto.descricao && (
          <Card style={styles.descCard}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <Text style={styles.descricao}>{produto.descricao}</Text>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {canManage ? (
            <>
              <Button
                title={produto.status === 'ATIVO' ? 'Pausar' : 'Ativar'}
                onPress={handleToggleStatus}
                variant={produto.status === 'ATIVO' ? 'outline' : 'primary'}
                fullWidth
                style={styles.actionButton}
              />
              <Button
                title="Excluir"
                onPress={handleDelete}
                variant="danger"
                fullWidth
                style={styles.actionButton}
              />
            </>
          ) : produto.status === 'ATIVO' ? (
            <Button
              title="Adicionar ao Carrinho"
              onPress={handleAddToCart}
              loading={addingToCart}
              fullWidth
              size="lg"
              style={styles.actionButton}
            />
          ) : (
            <View style={styles.unavailable}>
              <Ionicons name="information-outline" size={20} color="#FFC107" />
              <Text style={styles.unavailableText}>
                {STATUS_LABELS[produto.status] === 'QUARENTENA'
                  ? 'Produto em quarentena aguardando moderação'
                  : 'Produto indisponível no momento'}
              </Text>
            </View>
          )}

          {!canManage && produto.status === 'ATIVO' && (
            <TouchableOpacity
              style={styles.denunciaButton}
              onPress={() => setShowDenunciaModal(true)}
            >
              <Ionicons name="flag-outline" size={18} color="#DC3545" />
              <Text style={styles.denunciaButtonText}>Denunciar Produto</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Denuncia Modal */}
      {showDenunciaModal && (
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowDenunciaModal(false)} activeOpacity={1}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Denunciar Produto</Text>
              <TouchableOpacity onPress={() => setShowDenunciaModal(false)}>
                <Ionicons name="close" size={24} color="#6C7A8A" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Motivo da denúncia *</Text>
              <Input
                multiline
                numberOfLines={4}
                placeholder="Descreva o motivo (mín. 10 caracteres)..."
                value={denunciaMotivo}
                onChangeText={setDenunciaMotivo}
                style={styles.modalInput}
              />
              <Text style={styles.charCount}>{denunciaMotivo.length}/500</Text>
            </View>

            <View style={styles.modalFooter}>
              <Button title="Cancelar" onPress={() => setShowDenunciaModal(false)} variant="outline" fullWidth />
              <Button title="Enviar Denúncia" onPress={handleDenuncia} loading={denunciaLoading} variant="danger" fullWidth />
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
  imageContainer: {
    position: 'relative',
    height: 240,
    backgroundColor: '#E6F4FE',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  titleSection: {
    marginBottom: 16,
  },
  nome: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  preco: {
    fontSize: 24,
    fontWeight: '700',
    color: '#28A745',
  },
  categoria: {
    fontSize: 14,
    color: '#6C7A8A',
    backgroundColor: '#E6F4FE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  sellerCard: {
    marginBottom: 16,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sellerNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  sellerUnidade: {
    fontSize: 13,
    color: '#6C7A8A',
    marginTop: 2,
  },
  sellerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#E6F4FE',
    borderRadius: 12,
  },
  sellerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  descCard: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 8,
  },
  descricao: {
    fontSize: 15,
    color: '#3D4A5A',
    lineHeight: 22,
  },
  actions: {
    gap: 12,
  },
  actionButton: {},
  unavailable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFECB3',
  },
  unavailableText: {
    fontSize: 14,
    color: '#8D6E00',
  },
  denunciaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DC3545',
    backgroundColor: 'transparent',
  },
  denunciaButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC3545',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
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
    gap: 8,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  modalInput: {
    marginBottom: 0,
  },
  charCount: {
    fontSize: 12,
    color: '#9AA8B8',
    textAlign: 'right',
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