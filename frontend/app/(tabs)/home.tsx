import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Button, CategoryChip, ProductTile } from '../../components/ui';
import { CATEGORIAS } from '../../constants';
import { Produto } from '../../types';
import { colors, spacing, typography, borderRadius, layout } from '../../constants/design';

const COLUNAS = 2;
const ESPACO_ENTRE_CARDS = 12;

const saudacao = () => {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
};

function HomeScreen() {
  const router = useRouter();
  const { usuario, isVendedor, updateUsuario } = useAuth();
  const { getProdutos, getNotificacoes, getMe } = useApi();
  const { width } = useWindowDimensions();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const [avisosNaoLidos, setAvisosNaoLidos] = useState(0);

  // Largura fixa por card: com número ímpar de produtos, o último não estica para a linha toda
  const larguraCard = (width - layout.screenPadding * 2 - ESPACO_ENTRE_CARDS * (COLUNAS - 1)) / COLUNAS;

  const atualizarAvisos = useCallback(() => {
    getNotificacoes({ limite: 1 })
      .then((resposta) => setAvisosNaoLidos(resposta.naoLidas))
      .catch(() => undefined);
  }, [getNotificacoes]);

  // Atualiza a contagem de avisos sempre que a vitrine volta a ficar visível
  useFocusEffect(atualizarAvisos);

  // Sessões antigas não guardavam o nome do condomínio: busca uma vez
  const buscouNome = useRef(false);
  useEffect(() => {
    if (usuario && !usuario.condominioNome && !buscouNome.current) {
      buscouNome.current = true;
      getMe()
        .then((resposta) => updateUsuario({ condominioNome: resposta.usuario.condominioNome }))
        .catch(() => undefined);
    }
  }, [usuario, getMe, updateUsuario]);

  const carregarProdutos = useCallback(async (paginaAtual = 1) => {
    if (paginaAtual === 1) setLoading(true);
    try {
      const params: { pagina: number; limite: number; categoria?: string } = { pagina: paginaAtual, limite: 20 };
      if (categoriaSelecionada) params.categoria = categoriaSelecionada;

      const response = await getProdutos(params);
      const novos = response.produtos || response.data || [];
      setProdutos((anteriores) => (paginaAtual === 1 ? novos : [...anteriores, ...novos]));
      setPagina(response.paginacao.pagina);
      setTotalPaginas(response.paginacao.totalPaginas);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getProdutos, categoriaSelecionada]);

  useEffect(() => {
    carregarProdutos(1);
  }, [carregarProdutos]);

  const handleRefresh = () => {
    setRefreshing(true);
    carregarProdutos(1);
    atualizarAvisos();
  };

  const handleLoadMore = () => {
    if (pagina < totalPaginas && !loading) {
      carregarProdutos(pagina + 1);
    }
  };

  // Cabeçalho da lista: saudação, avisos, busca e categorias. Fica dentro da própria FlatList,
  // em vez de a lista ficar dentro de um ScrollView (o que gerava o aviso de VirtualizedLists)
  const cabecalho = (
    <View>
      <View style={styles.topo}>
        <TouchableOpacity
          style={styles.condominio}
          onPress={() => router.push('/condominios')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Condomínio ${usuario?.condominioNome || ''}. Trocar ou adicionar condomínio`}
        >
          <Ionicons name="business" size={16} color={colors.accent} />
          <View style={styles.condominioTexto}>
            <Text style={styles.condominioRotulo}>Vendo produtos de</Text>
            <Text style={styles.condominioNome} numberOfLines={1}>
              {usuario?.condominioNome || 'Seu condomínio'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={16} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sino}
          onPress={() => router.push('/notifications')}
          activeOpacity={0.8}
          accessibilityLabel={avisosNaoLidos > 0 ? `Avisos, ${avisosNaoLidos} não lidos` : 'Avisos'}
        >
          <Ionicons name={avisosNaoLidos > 0 ? 'notifications' : 'notifications-outline'} size={22} color={colors.primary} />
          {avisosNaoLidos > 0 && (
            <View style={styles.sinoContador}>
              <Text style={styles.sinoContadorTexto}>{avisosNaoLidos > 9 ? '9+' : avisosNaoLidos}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.saudacao}>
        <Text style={styles.saudacaoTexto}>{saudacao()},</Text>
        <Text style={styles.nome} numberOfLines={1}>
          {usuario?.nome?.split(' ')[0] || 'vizinho'}
        </Text>
      </View>

      <TouchableOpacity style={styles.busca} onPress={() => router.push('/(tabs)/search')} activeOpacity={0.8}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <Text style={styles.buscaTexto}>Buscar produtos</Text>
      </TouchableOpacity>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categorias}
        style={styles.categoriasScroll}
      >
        <CategoryChip label="Todos" selected={!categoriaSelecionada} onPress={() => setCategoriaSelecionada(null)} />
        {CATEGORIAS.map((categoria) => (
          <CategoryChip
            key={categoria}
            label={categoria}
            selected={categoriaSelecionada === categoria}
            onPress={() => setCategoriaSelecionada(categoriaSelecionada === categoria ? null : categoria)}
          />
        ))}
      </ScrollView>

      <View style={styles.secaoTitulo}>
        <Text style={styles.secaoTexto}>{categoriaSelecionada || 'Produtos do condomínio'}</Text>
        {isVendedor && (
          <TouchableOpacity onPress={() => router.push('/product/new')} style={styles.anunciar} activeOpacity={0.8}>
            <Ionicons name="add" size={18} color={colors.textOnPrimary} />
            <Text style={styles.anunciarTexto}>Anunciar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const vazio = loading ? (
    <ActivityIndicator size="large" color={colors.primary} style={styles.carregando} />
  ) : (
    <View style={styles.vazio}>
      <Ionicons name="storefront-outline" size={48} color={colors.borderStrong} />
      <Text style={styles.vazioTitulo}>
        {categoriaSelecionada ? 'Nada nesta categoria ainda' : 'Nenhum produto disponível'}
      </Text>
      <Text style={styles.vazioTexto}>
        {categoriaSelecionada ? 'Tente outra categoria.' : 'Quando um vizinho anunciar, o produto aparece aqui.'}
      </Text>
      {isVendedor && !categoriaSelecionada && (
        <Button title="Anunciar um produto" onPress={() => router.push('/product/new')} style={styles.vazioBotao} />
      )}
    </View>
  );

  return (
    <FlatList
      style={styles.lista}
      contentContainerStyle={styles.listaConteudo}
      data={produtos}
      keyExtractor={(item) => item.id}
      numColumns={COLUNAS}
      columnWrapperStyle={styles.linha}
      renderItem={({ item }) => (
        <ProductTile produto={item} onPress={() => router.push(`/product/${item.id}`)} style={{ width: larguraCard }} />
      )}
      ListHeaderComponent={cabecalho}
      ListEmptyComponent={vazio}
      ListFooterComponent={
        pagina < totalPaginas ? <ActivityIndicator size="small" color={colors.primary} style={styles.maisItens} /> : null
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.4}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  lista: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listaConteudo: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  linha: {
    gap: ESPACO_ENTRE_CARDS,
    marginBottom: ESPACO_ENTRE_CARDS,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  condominio: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginRight: spacing.md,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  condominioTexto: {
    flex: 1,
  },
  condominioRotulo: {
    fontFamily: typography.labelSmall.fontFamily,
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  condominioNome: {
    fontFamily: typography.labelMedium.fontFamily,
    fontSize: 14,
    color: colors.primary,
  },
  saudacao: {
    marginBottom: spacing.md,
  },
  saudacaoTexto: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textSecondary,
  },
  nome: {
    fontFamily: typography.displayMedium.fontFamily,
    fontSize: typography.displayMedium.fontSize,
    lineHeight: typography.displayMedium.lineHeight,
    color: colors.primary,
  },
  sino: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sinoContador: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  sinoContadorTexto: {
    fontFamily: typography.labelSmall.fontFamily,
    fontSize: 11,
    color: colors.textOnAccent,
  },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buscaTexto: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textMuted,
  },
  categoriasScroll: {
    marginTop: spacing.md,
    marginHorizontal: -layout.screenPadding,
  },
  categorias: {
    gap: spacing.sm,
    paddingHorizontal: layout.screenPadding,
  },
  secaoTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  secaoTexto: {
    fontFamily: typography.displaySmall.fontFamily,
    fontSize: 20,
    color: colors.primary,
  },
  anunciar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  anunciarTexto: {
    fontFamily: typography.labelMedium.fontFamily,
    fontSize: 13,
    color: colors.textOnPrimary,
  },
  carregando: {
    marginTop: spacing.xxl,
  },
  vazio: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  vazioTitulo: {
    fontFamily: typography.labelLarge.fontFamily,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  vazioTexto: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  vazioBotao: {
    marginTop: spacing.md,
  },
  maisItens: {
    marginVertical: spacing.md,
  },
});

export default HomeScreen;
