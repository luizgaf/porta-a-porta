import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { ProductImage } from './ProductImage';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/design';
import { Produto } from '../../types';
import { formatBRL } from '../../utils/format';

interface ProductTileProps {
  produto: Produto;
  onPress: () => void;
  style?: ViewStyle;
}

// Card da vitrine em grade. Foto quadrada, nome em até duas linhas com altura fixa e preço
// sempre na mesma posição, para todos os cards da grade terem o mesmo tamanho.
export const ProductTile: React.FC<ProductTileProps> = ({ produto, onPress, style }) => {
  const pausado = produto.status === 'PAUSADO';

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${produto.nome}, ${formatBRL(produto.preco)}${pausado ? ', indisponível' : ''}`}
    >
      <View style={styles.fotoArea}>
        <ProductImage url={produto.imagemUrl} style={styles.foto} iconSize={36} />
        {pausado && (
          <View style={styles.selo}>
            <Text style={styles.seloTexto}>Indisponível</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.categoria} numberOfLines={1}>
          {produto.categoria}
        </Text>
        <Text style={styles.nome} numberOfLines={2}>
          {produto.nome}
        </Text>
        <View style={styles.rodape}>
          <Text style={[styles.preco, pausado && styles.precoPausado]}>{formatBRL(produto.preco)}</Text>
          {produto.vendedor?.unidade ? (
            <Text style={styles.unidade} numberOfLines={1}>
              {produto.vendedor.unidade}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const LINHA_NOME = 20;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  fotoArea: {
    aspectRatio: 1,
    backgroundColor: colors.morningFog,
  },
  foto: {
    width: '100%',
    height: '100%',
  },
  selo: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(27, 42, 58, 0.85)',
  },
  seloTexto: {
    fontFamily: typography.labelSmall.fontFamily,
    fontSize: 11,
    color: colors.textOnPrimary,
  },
  info: {
    padding: spacing.sm + 2,
    gap: 2,
  },
  categoria: {
    fontFamily: typography.labelSmall.fontFamily,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  nome: {
    fontFamily: typography.labelLarge.fontFamily,
    fontSize: 14,
    lineHeight: LINHA_NOME,
    // Sempre reserva duas linhas, mesmo para nomes curtos
    height: LINHA_NOME * 2,
    color: colors.textPrimary,
  },
  rodape: {
    marginTop: spacing.xs,
    gap: 2,
  },
  preco: {
    fontFamily: typography.displaySmall.fontFamily,
    fontSize: 17,
    color: colors.primary,
  },
  precoPausado: {
    color: colors.textMuted,
  },
  unidade: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
