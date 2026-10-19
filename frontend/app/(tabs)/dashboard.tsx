import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Button } from '../../components/ui';
import { STATUS_LABELS } from '../../constants';
import { DashboardVendas } from '../../types';
import { formatBRL } from '../../utils/format';
import { colors, spacing, typography, borderRadius, layout } from '../../constants/design';

// Painel de vendas do vendedor no condomínio ativo. Os valores somam só os itens dele
// em cada pedido; "vendido" conta os pedidos entregues.

// As mesmas cores da lista de pedidos
const COR_STATUS: Record<string, string> = {
  PENDENTE: '#FFC107',
  CONFIRMADO: '#17A2B8',
  EM_PREPARO: '#6F42C1',
  PRONTO_ENTREGA: '#FD7E14',
  ENTREGUE: '#28A745',
  CANCELADO: '#DC3545',
};

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const nomeDoMes = (chave: string) => MESES[Number(chave.slice(5, 7)) - 1] ?? chave;

const dataCurta = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

// Valores grandes no eixo do gráfico: R$ 1,2 mil
const valorCompacto = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1).replace('.', ',')} mil` : String(Math.round(v)));

export default function DashboardScreen() {
  const router = useRouter();
  const { usuario, isVendedor } = useAuth();
  const { getDashboardVendas } = useApi();

  const [dados, setDados] = useState<DashboardVendas | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    try {
      setErro('');
      setDados(await getDashboardVendas());
    } catch (error: any) {
      setErro(error.message || 'Não foi possível carregar o painel');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [getDashboardVendas]);

  // Recarrega ao voltar para a aba, para refletir pedidos atendidos em outras telas
  useFocusEffect(
    useCallback(() => {
      if (isVendedor) carregar();
    }, [carregar, isVendedor])
  );

  if (!isVendedor) {
    return (
      <View style={styles.centro}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.borderStrong} />
        <Text style={styles.vazioTitulo}>Painel disponível para vendedores</Text>
      </View>
    );
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (erro || !dados) {
    return (
      <View style={styles.centro}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.borderStrong} />
        <Text style={styles.vazioTitulo}>{erro || 'Painel indisponível'}</Text>
        <Button title="Tentar de novo" variant="outline" onPress={() => { setCarregando(true); carregar(); }} />
      </View>
    );
  }

  const { totais, porStatus, maisVendidos, ultimosMeses, ultimosPedidos } = dados;
  const totalPedidos = porStatus.reduce((t, s) => t + s.quantidade, 0);
  const maiorMes = Math.max(...ultimosMeses.map((m) => m.valor), 0);
  const maiorStatus = Math.max(...porStatus.map((s) => s.quantidade), 1);
  const usoAnuncios = Math.min(totais.produtosAtivos / totais.limiteProdutosAtivos, 1);
  const entregues = porStatus.find((s) => s.status === 'ENTREGUE')?.quantidade ?? 0;

  return (
    <ScrollView
      style={styles.tela}
      contentContainerStyle={styles.conteudo}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={() => { setAtualizando(true); carregar(); }} colors={[colors.primary]} />
      }
    >
      <Text style={styles.titulo}>Painel de vendas</Text>
      <Text style={styles.subtitulo} numberOfLines={1}>
        {usuario?.condominioNome || 'Seu condomínio'}
      </Text>

      {/* Destaque: total vendido */}
      <View style={styles.destaque}>
        <Text style={styles.destaqueRotulo}>Total vendido</Text>
        <Text style={styles.destaqueValor}>{formatBRL(totais.vendido)}</Text>
        <Text style={styles.destaqueDetalhe}>
          {entregues} {entregues === 1 ? 'pedido entregue' : 'pedidos entregues'} · {totais.itensVendidos}{' '}
          {totais.itensVendidos === 1 ? 'item' : 'itens'} · ticket médio {formatBRL(totais.ticketMedio)}
        </Text>
      </View>

      {/* Indicadores */}
      <View style={styles.indicadores}>
        <View style={styles.indicador}>
          <Ionicons name="time-outline" size={18} color={colors.accent} />
          <Text style={styles.indicadorValor} numberOfLines={1}>
            {formatBRL(totais.emAndamento)}
          </Text>
          <Text style={styles.indicadorRotulo}>em andamento</Text>
        </View>
        <View style={styles.indicador}>
          <Ionicons name="receipt-outline" size={18} color={colors.accent} />
          <Text style={styles.indicadorValor}>{totais.pedidos}</Text>
          <Text style={styles.indicadorRotulo}>{totais.pedidos === 1 ? 'pedido' : 'pedidos'}</Text>
        </View>
        <View style={styles.indicador}>
          <Ionicons name="pricetags-outline" size={18} color={colors.accent} />
          <Text style={styles.indicadorValor}>
            {totais.produtosAtivos}/{totais.limiteProdutosAtivos}
          </Text>
          <Text style={styles.indicadorRotulo}>anúncios ativos</Text>
          <View style={styles.trilho}>
            <View style={[styles.trilhoCheio, { width: `${usoAnuncios * 100}%` }]} />
          </View>
        </View>
      </View>

      {totalPedidos === 0 ? (
        <View style={styles.vazio}>
          <Ionicons name="bar-chart-outline" size={44} color={colors.borderStrong} />
          <Text style={styles.vazioTitulo}>Nenhuma venda ainda</Text>
          <Text style={styles.vazioTexto}>Quando um vizinho comprar um produto seu, os números aparecem aqui.</Text>
          <Button title="Ver meus anúncios" variant="outline" onPress={() => router.push('/(tabs)/seller')} />
        </View>
      ) : (
        <>
          {/* Vendas por mês */}
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Vendas entregues nos últimos 6 meses</Text>
            <View style={styles.grafico} accessibilityLabel="Gráfico de vendas por mês">
              {ultimosMeses.map((m) => {
                const altura = maiorMes > 0 ? Math.max((m.valor / maiorMes) * 100, m.valor > 0 ? 6 : 0) : 0;
                return (
                  <View key={m.mes} style={styles.coluna} accessibilityLabel={`${nomeDoMes(m.mes)}: ${formatBRL(m.valor)}`}>
                    <Text style={styles.colunaValor}>{m.valor > 0 ? valorCompacto(m.valor) : ''}</Text>
                    <View style={styles.colunaArea}>
                      <View style={[styles.barra, { height: `${altura}%` }]} />
                    </View>
                    <Text style={styles.colunaMes}>{nomeDoMes(m.mes)}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Pedidos por status */}
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Pedidos por status</Text>
            {porStatus.map((s) => (
              <View key={s.status} style={styles.statusLinha}>
                <View style={[styles.statusPonto, { backgroundColor: COR_STATUS[s.status] }]} />
                <Text style={styles.statusNome}>{STATUS_LABELS[s.status] || s.status}</Text>
                <View style={styles.statusTrilho}>
                  <View
                    style={[
                      styles.statusBarra,
                      { width: `${(s.quantidade / maiorStatus) * 100}%`, backgroundColor: COR_STATUS[s.status] },
                    ]}
                  />
                </View>
                <Text style={styles.statusQtd}>{s.quantidade}</Text>
              </View>
            ))}
          </View>

          {/* Mais vendidos */}
          {maisVendidos.length > 0 && (
            <View style={styles.secao}>
              <Text style={styles.secaoTitulo}>Mais vendidos</Text>
              {maisVendidos.map((p, i) => (
                <TouchableOpacity
                  key={p.produtoId}
                  style={[styles.linha, i > 0 && styles.linhaSeparada]}
                  onPress={() => router.push(`/product/${p.produtoId}`)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.posicao}>{i + 1}</Text>
                  <View style={styles.linhaTexto}>
                    <Text style={styles.linhaNome} numberOfLines={1}>
                      {p.nome}
                    </Text>
                    <Text style={styles.linhaDetalhe}>
                      {p.quantidade} {p.quantidade === 1 ? 'unidade' : 'unidades'}
                    </Text>
                  </View>
                  <Text style={styles.linhaValor}>{formatBRL(p.valor)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Últimos pedidos */}
          <View style={styles.secao}>
            <View style={styles.secaoTopo}>
              <Text style={styles.secaoTitulo}>Últimos pedidos</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
                <Text style={styles.verTodos}>Ver todos</Text>
              </TouchableOpacity>
            </View>
            {ultimosPedidos.map((p, i) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.linha, i > 0 && styles.linhaSeparada]}
                onPress={() => router.push(`/order/${p.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.linhaTexto}>
                  <Text style={styles.linhaNome}>
                    {p.unidadeEntrega} · {dataCurta(p.criadoEm)}
                  </Text>
                  <View style={styles.statusSelo}>
                    <View style={[styles.statusPonto, { backgroundColor: COR_STATUS[p.status] }]} />
                    <Text style={styles.linhaDetalhe}>
                      {STATUS_LABELS[p.status] || p.status} · {p.itens} {p.itens === 1 ? 'item' : 'itens'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.linhaValor, p.status === 'CANCELADO' && styles.valorCancelado]}>{formatBRL(p.valor)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.background },
  conteudo: { padding: layout.screenPadding, paddingBottom: spacing.xl },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  titulo: {
    fontFamily: typography.displayMedium.fontFamily,
    fontSize: typography.displayMedium.fontSize,
    lineHeight: typography.displayMedium.lineHeight,
    color: colors.primary,
  },
  subtitulo: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  destaque: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
  },
  destaqueRotulo: {
    fontFamily: typography.labelSmall.fontFamily,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#AFC0D2',
  },
  destaqueValor: {
    fontFamily: typography.displayLarge.fontFamily,
    fontSize: 36,
    lineHeight: 44,
    color: colors.textOnPrimary,
    marginTop: spacing.xs,
  },
  destaqueDetalhe: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 13,
    color: '#C9D4E0',
    marginTop: spacing.xs,
  },
  indicadores: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  indicador: {
    flex: 1,
    gap: 2,
    padding: spacing.sm + 4,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  indicadorValor: {
    fontFamily: typography.labelLarge.fontFamily,
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  indicadorRotulo: { fontFamily: typography.bodySmall.fontFamily, fontSize: 12, color: colors.textSecondary },
  trilho: { height: 4, borderRadius: 2, backgroundColor: colors.morningFog, marginTop: spacing.xs, overflow: 'hidden' },
  trilhoCheio: { height: 4, borderRadius: 2, backgroundColor: colors.accent },
  secao: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secaoTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  secaoTitulo: {
    fontFamily: typography.labelLarge.fontFamily,
    fontSize: 15,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  verTodos: { fontFamily: typography.labelMedium.fontFamily, fontSize: 13, color: colors.accent },
  grafico: { flexDirection: 'row', alignItems: 'flex-end', height: 150, gap: spacing.sm, marginTop: spacing.xs },
  coluna: { flex: 1, alignItems: 'center', height: '100%' },
  colunaValor: { fontFamily: typography.labelSmall.fontFamily, fontSize: 10, color: colors.textSecondary, height: 16 },
  colunaArea: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  barra: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: colors.accent },
  colunaMes: { fontFamily: typography.labelSmall.fontFamily, fontSize: 11, color: colors.textMuted, marginTop: spacing.xs },
  statusLinha: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  statusPonto: { width: 8, height: 8, borderRadius: 4 },
  statusNome: { width: 130, fontFamily: typography.bodySmall.fontFamily, fontSize: 13, color: colors.textPrimary },
  statusTrilho: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.morningFog, overflow: 'hidden' },
  statusBarra: { height: 8, borderRadius: 4 },
  statusQtd: { width: 24, textAlign: 'right', fontFamily: typography.labelMedium.fontFamily, fontSize: 13, color: colors.textPrimary },
  statusSelo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm + 2 },
  linhaSeparada: { borderTopWidth: 1, borderTopColor: colors.border },
  posicao: {
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    overflow: 'hidden',
    backgroundColor: colors.morningFog,
    fontFamily: typography.labelSmall.fontFamily,
    fontSize: 12,
    color: colors.primary,
  },
  linhaTexto: { flex: 1, gap: 2 },
  linhaNome: { fontFamily: typography.labelMedium.fontFamily, fontSize: 14, color: colors.textPrimary },
  linhaDetalhe: { fontFamily: typography.bodySmall.fontFamily, fontSize: 12, color: colors.textSecondary },
  linhaValor: { fontFamily: typography.labelLarge.fontFamily, fontSize: 14, color: colors.primary },
  valorCancelado: { color: colors.textMuted, textDecorationLine: 'line-through' },
  vazio: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vazioTitulo: { fontFamily: typography.labelLarge.fontFamily, fontSize: 16, color: colors.textPrimary, textAlign: 'center' },
  vazioTexto: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
