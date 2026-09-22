import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Card, Avatar } from '../../components/ui';
import { STATUS_LABELS, CATEGORIAS } from '../../constants';
import { Produto } from '../../types';

export default function SearchScreen() {
  const router = useRouter();
  const { getProdutos } = useApi();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [debouncedBusca, setDebouncedBusca] = useState('');

  const carregarProdutos = useCallback(async (paginaAtual = 1, isNewSearch = false) => {
    setLoading(true);
    try {
      const params: any = { pagina: paginaAtual, limite: 20 };
      if (categoriaSelecionada) params.categoria = categoriaSelecionada;
      if (debouncedBusca) params.busca = debouncedBusca;

      const response = await getProdutos(params);
      const produtosData = response.produtos || response.data || [];
      if (paginaAtual === 1 || isNewSearch) {
        setProdutos(produtosData);
      } else {
        setProdutos(prev => [...prev, ...produtosData]);
      }
      setPagina(response.paginacao.pagina);
      setTotalPaginas(response.paginacao.totalPaginas);
    } catch (error: any) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  }, [getProdutos, categoriaSelecionada, debouncedBusca]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBusca(busca);
      carregarProdutos(1, true);
    }, 300);

    return () => clearTimeout(timer);
  }, [busca, carregarProdutos]);

  useEffect(() => {
    carregarProdutos(1, true);
  }, [categoriaSelecionada]);

  const handleLoadMore = () => {
    if (pagina < totalPaginas && !loading) {
      carregarProdutos(pagina + 1);
    }
  };

  const renderProduto = ({ item }: { item: Produto }) => (
    <TouchableOpacity
      style={styles.produtoCard}
      onPress={() => router.push(`/product/${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.produtoImageContainer}>
        <Image
          source={{ uri: 'https://via.placeholder.com/300x200/E6F4FE/1E3A5F?text=Produto' }}
          style={styles.produtoImage}
          resizeMode="cover"
        />
        {item.status !== 'ATIVO' && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{STATUS_LABELS[item.status]}</Text>
          </View>
        )}
      </View>
      <View style={styles.produtoInfo}>
        <View style={styles.produtoHeader}>
          <Text style={styles.produtoNome} numberOfLines={1}>{item.nome}</Text>
          <Text style={styles.produtoPreco}>R$ {item.preco.toFixed(2).replace('.', ',')}</Text>
        </View>
        <Text style={styles.produtoCategoria}>{item.categoria}</Text>
        <View style={styles.produtoFooter}>
          <View style={styles.vendedorInfo}>
            <Avatar name={item.vendedor?.nome || 'Vendedor'} size="xs" />
            <Text style={styles.vendedorNome}>{item.vendedor?.nome || 'Vendedor'}</Text>
          </View>
          <Text style={styles.vendedorUnidade}>{item.vendedor?.unidade || ''}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoria = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoriaChip,
        categoriaSelecionada === item && styles.categoriaChipSelected,
      ]}
      onPress={() => setCategoriaSelecionada(categoriaSelecionada === item ? null : item)}
    >
      <Text
        style={[
          styles.categoriaChipText,
          categoriaSelecionada === item && styles.categoriaChipTextSelected,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produtos, categorias..."
          value={busca}
          onChangeText={setBusca}
          placeholderTextColor="#9AA8B8"
        />
      </View>

      <View style={styles.categoriasContainer}>
        <Text style={styles.sectionTitle}>Categorias</Text>
        <FlatList
          data={CATEGORIAS}
          renderItem={renderCategoria}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriasList}
          keyExtractor={(item) => item}
        />
      </View>

      <Text style={styles.sectionTitle}>Resultados ({produtos.length})</Text>

      {loading && produtos.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E3A5F" />
          <Text style={styles.loadingText}>Buscando...</Text>
        </View>
      ) : produtos.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color="#D1E3F0" />
          <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
          <Text style={styles.emptySubtext}>
            {busca || categoriaSelecionada
              ? 'Tente alterar os filtros ou termos de busca'
              : 'Navegue pelas categorias ou busque por nome'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={produtos}
          renderItem={renderProduto}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridWrapper}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            pagina < totalPaginas && !loading ? (
              <ActivityIndicator size="small" color="#1E3A5F" style={styles.loadMoreIndicator} />
            ) : null
          }
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
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1E3F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E3A5F',
  },
  categoriasContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 12,
  },
  categoriasList: {
    gap: 8,
    paddingHorizontal: 4,
  },
  categoriaChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1E3F0',
    backgroundColor: '#FFFFFF',
  },
  categoriaChipSelected: {
    borderColor: '#1E3A5F',
    backgroundColor: '#E6F4FE',
  },
  categoriaChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3D4A5A',
  },
  categoriaChipTextSelected: {
    color: '#1E3A5F',
    fontWeight: '600',
  },
  gridWrapper: {
    justifyContent: 'space-between',
  },
  produtoCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8EFF5',
  },
  produtoImageContainer: {
    position: 'relative',
    height: 120,
  },
  produtoImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  produtoInfo: {
    padding: 12,
  },
  produtoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  produtoNome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
    flex: 1,
    marginRight: 8,
  },
  produtoPreco: {
    fontSize: 16,
    fontWeight: '700',
    color: '#28A745',
  },
  produtoCategoria: {
    fontSize: 12,
    color: '#6C7A8A',
    marginBottom: 8,
  },
  produtoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vendedorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vendedorNome: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3D4A5A',
  },
  vendedorUnidade: {
    fontSize: 11,
    color: '#9AA8B8',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6C7A8A',
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
  },
  loadMoreIndicator: {
    paddingVertical: 20,
  },
});