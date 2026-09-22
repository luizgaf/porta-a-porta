import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Card, Button, Avatar, CategoryChip, ProductCard } from '../../components/ui';
import { STATUS_LABELS, CATEGORIAS } from '../../constants';
import { Produto } from '../../types';
import { colors, spacing, typography, shadows, borderRadius, layout } from '../../constants/design';

function HomeScreen() {
  const router = useRouter();
  const { usuario, isVendedor, isSindico } = useAuth();
  const { getProdutos } = useApi();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  const carregarProdutos = useCallback(async (paginaAtual = 1, isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const params: any = { pagina: paginaAtual, limite: 20 };
      if (categoriaSelecionada) params.categoria = categoriaSelecionada;
      if (busca) params.busca = busca;

      const response = await getProdutos(params);
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
  }, [getProdutos, categoriaSelecionada, busca]);

  useEffect(() => {
    carregarProdutos(1, true);
  }, [carregarProdutos]);

  const handleRefresh = () => {
    setRefreshing(true);
    carregarProdutos(1, true);
  };

  const handleLoadMore = () => {
    if (pagina < totalPaginas && !loading) {
      carregarProdutos(pagina + 1);
    }
  };

  const renderCategoria = ({ item }: { item: string }) => (
    <CategoryChip
      key={item}
      label={item.charAt(0).toUpperCase() + item.slice(1)}
      selected={categoriaSelecionada === item}
      onPress={() => setCategoriaSelecionada(categoriaSelecionada === item ? null : item)}
    />
  );

  if (loading && produtos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando produtos...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
      }
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.welcome}>
            <Text style={[styles.welcomeLabel, { fontFamily: typography.bodySmall.fontFamily, fontSize: typography.bodySmall.fontSize }]}>Bom dia,</Text>
            <Text style={[styles.welcomeName, { fontFamily: typography.displayMedium.fontFamily, fontWeight: typography.displayMedium.fontWeight, fontSize: typography.displayMedium.fontSize }]}>
              {usuario?.nome?.split(' ')[0] || 'Vizinho'}
            </Text>
          </View>
          <Avatar name={usuario?.nome || 'U'} size="md" />
        </View>

        {/* Search Bar - navigates to search tab */}
        <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(tabs)/search')} activeOpacity={0.8}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <Text style={[styles.searchPlaceholder, { fontFamily: typography.bodyMedium.fontFamily, fontSize: typography.bodyMedium.fontSize }]}>Buscar produtos, vendedores...</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.categoriasContainer}>
        <Text style={[styles.sectionTitle, { fontFamily: typography.labelLarge.fontFamily, fontWeight: typography.labelLarge.fontWeight, fontSize: typography.labelLarge.fontSize }]}>Categorias</Text>
        <FlatList
          data={CATEGORIAS}
          renderItem={renderCategoria}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriasList}
          keyExtractor={(item) => item}
        />
      </View>

      {/* Products Header */}
      <View style={styles.produtosHeader}>
        <Text style={[styles.sectionTitle, { fontFamily: typography.labelLarge.fontFamily, fontWeight: typography.labelLarge.fontWeight, fontSize: typography.labelLarge.fontSize }]}>Produtos Disponíveis</Text>
        {isVendedor && (
          <TouchableOpacity onPress={() => router.push('/product/new')} style={styles.addButton} activeOpacity={0.8}>
            <Ionicons name="add" size={22} color={colors.textOnPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Products Horizontal List */}
      {produtos.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="storefront-outline" size={56} color={colors.border} />
          <Text style={[styles.emptyText, { fontFamily: typography.bodyLarge.fontFamily, fontSize: typography.bodyLarge.fontSize }]}>
            {busca || categoriaSelecionada ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
          </Text>
          <Text style={[styles.emptySubtext, { fontFamily: typography.bodyMedium.fontFamily, fontSize: typography.bodyMedium.fontSize }]}>
            {busca || categoriaSelecionada ? 'Tente outra busca ou categoria' : 'Seja o primeiro a anunciar!'}
          </Text>
          {isVendedor && (
            <Button
              title="Criar meu primeiro produto"
              variant="primary"
              size="md"
              onPress={() => router.push('/product/new')}
              style={{ marginTop: spacing.md, width: 260 }}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={produtos}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item.id}`)}
              sellerUnit={item.vendedor?.unidade}
            />
          )}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            pagina < totalPaginas && !loading ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: layout.screenPadding + 20,
    paddingTop: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textSecondary,
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.bodyMedium.fontSize,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  welcome: {
    flex: 1,
  },
  welcomeLabel: {
    color: colors.textSecondary,
    marginBottom: 2,
  },
  welcomeName: {
    color: colors.textPrimary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    ...shadows.sm,
  },
  searchPlaceholder: {
    color: colors.textMuted,
    flex: 1,
  },
  categoriasContainer: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  categoriasList: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  produtosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  horizontalList: {
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
    gap: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptySubtext: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loadMoreContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});

export default HomeScreen;

