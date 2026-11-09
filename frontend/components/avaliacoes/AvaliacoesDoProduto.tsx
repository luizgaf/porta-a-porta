import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../hooks/useApi';
import { Estrelas } from '../ui/Estrelas';
import { AvaliacoesDoProduto as Dados } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../constants/design';

// Avaliações no detalhe do produto: média, quantas notas de cada valor e os comentários.
// Quem avaliou nunca aparece (RN02); cada avaliação vem de um pedido entregue.

interface Props {
  produtoId: string;
}

const MOSTRAR_INICIO = 3;

const quando = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export function AvaliacoesDoProduto({ produtoId }: Props) {
  const { getAvaliacoesProduto } = useApi();
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [todas, setTodas] = useState(false);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    getAvaliacoesProduto(produtoId)
      .then((r) => ativo && setDados(r))
      .catch(() => ativo && setDados(null))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [produtoId, getAvaliacoesProduto]);

  if (carregando) {
    return <ActivityIndicator color={colors.primary} style={styles.carregando} />;
  }

  if (!dados || dados.total === 0) {
    return (
      <View style={styles.vazio}>
        <Ionicons name="star-outline" size={22} color={colors.textMuted} />
        <Text style={styles.vazioTexto}>
          Ainda sem avaliações. Quem comprar pode avaliar depois que o pedido for entregue.
        </Text>
      </View>
    );
  }

  const maior = Math.max(...dados.distribuicao.map((d) => d.total), 1);
  const comComentario = dados.avaliacoes;
  const visiveis = todas ? comComentario : comComentario.slice(0, MOSTRAR_INICIO);

  return (
    <View>
      <View style={styles.resumo}>
        <View style={styles.media}>
          <Text style={styles.mediaNumero}>{dados.media.toFixed(1).replace('.', ',')}</Text>
          <Estrelas nota={dados.media} tamanho={14} />
          <Text style={styles.mediaTotal}>
            {dados.total} {dados.total === 1 ? 'avaliação' : 'avaliações'}
          </Text>
        </View>

        <View style={styles.barras}>
          {dados.distribuicao.map((d) => (
            <View key={d.nota} style={styles.barraLinha} accessibilityLabel={`${d.nota} estrelas: ${d.total}`}>
              <Text style={styles.barraRotulo}>{d.nota}</Text>
              <Ionicons name="star" size={10} color={colors.textMuted} />
              <View style={styles.barraFundo}>
                <View style={[styles.barraCheia, { width: `${(d.total / maior) * 100}%` }]} />
              </View>
              <Text style={styles.barraTotal}>{d.total}</Text>
            </View>
          ))}
        </View>
      </View>

      {visiveis.map((a) => (
        <View key={a.id} style={styles.item}>
          <View style={styles.itemTopo}>
            <Estrelas nota={a.nota} tamanho={13} />
            <Text style={styles.itemData}>{quando(a.criadoEm)}</Text>
          </View>
          {a.comentario ? (
            <Text style={styles.itemComentario}>{a.comentario}</Text>
          ) : (
            <Text style={styles.itemSemComentario}>Avaliou sem comentário</Text>
          )}
          <Text style={styles.itemAutor}>Morador do condomínio · compra verificada</Text>
        </View>
      ))}

      {comComentario.length > MOSTRAR_INICIO && (
        <TouchableOpacity onPress={() => setTodas((v) => !v)} style={styles.verTodas} accessibilityRole="button">
          <Text style={styles.verTodasTexto}>
            {todas ? 'Mostrar menos' : `Ver todas as ${comComentario.length} avaliações`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  carregando: {
    paddingVertical: spacing.md,
  },
  vazio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.morningFog,
  },
  vazioTexto: {
    flex: 1,
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  resumo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  media: {
    alignItems: 'center',
    gap: 4,
    minWidth: 84,
  },
  mediaNumero: {
    fontFamily: typography.displayMedium.fontFamily,
    fontSize: 36,
    lineHeight: 40,
    color: colors.textPrimary,
  },
  mediaTotal: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
  },
  barras: {
    flex: 1,
    gap: 4,
  },
  barraLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  barraRotulo: {
    width: 10,
    fontFamily: typography.utilitySmall.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  barraFundo: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.morningFog,
    overflow: 'hidden',
  },
  barraCheia: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F5A524',
  },
  barraTotal: {
    width: 22,
    fontFamily: typography.utilitySmall.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  item: {
    paddingVertical: spacing.sm + 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  itemTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemData: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 12,
    color: colors.textMuted,
  },
  itemComentario: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  itemSemComentario: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.textSecondary,
  },
  itemAutor: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 11,
    color: colors.textMuted,
  },
  verTodas: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  verTodasTexto: {
    fontFamily: typography.labelMedium.fontFamily,
    fontSize: 14,
    color: colors.accent,
  },
});
