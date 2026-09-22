import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { DoorTag } from './DoorTag';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/design';
import { Produto } from '../../types';

interface ProductCardProps {
  product: Produto;
  onPress: () => void;
  sellerUnit?: string; // Unidade do vendedor para o Door Tag
}

export const ProductCard = React.forwardRef<React.ElementRef<typeof TouchableOpacity>, ProductCardProps>(
  ({ product, onPress, sellerUnit }, ref) => {
    const categoryLabels: Record<string, string> = {
      alimentos: 'Alimentos',
      artesanato: 'Artesanato',
      servicos: 'Serviços',
      beleza: 'Beleza',
      outros: 'Outros',
    };

    return (
      <TouchableOpacity
        ref={ref}
        onPress={onPress}
        activeOpacity={0.85}
        style={styles.cardWrapper}
      >
        <Card elevation="sm" padding="none" style={styles.card}>
          <View style={styles.content}>
            {/* Left: Image */}
            <View style={styles.imageWrapper}>
              {product.imagem_url ? (
                <Image
                  source={{ uri: product.imagem_url }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: colors.morningFog }]}>
                  <Ionicons name="bag-outline" size={32} color={colors.mutedSlate} />
                </View>
              )}
            </View>

            {/* Right: Info */}
            <View style={styles.info} >
              {/* Top row: Category + Door Tag */}
              <View style={styles.topRow}>
                <Text
                  style={[
                    styles.category,
                    { fontFamily: typography.labelSmall.fontFamily, fontWeight: typography.labelSmall.fontWeight, fontSize: typography.labelSmall.fontSize },
                  ]}
                >
                  {categoryLabels[product.categoria] || product.categoria}
                </Text>
                {sellerUnit && (
                  <DoorTag unit={sellerUnit} variant="seller" size="sm" />
                )}
              </View>

              {/* Title */}
              <Text
                style={[
                  styles.title,
                  { fontFamily: typography.displaySmall.fontFamily, fontWeight: typography.displaySmall.fontWeight, fontSize: typography.displaySmall.fontSize },
                ]}
                numberOfLines={2}
              >
                {product.nome}
              </Text>

              {/* Description */}
              {product.descricao && (
                <Text
                  style={[
                    styles.description,
                    { fontFamily: typography.bodySmall.fontFamily, fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight },
                  ]}
                  numberOfLines={2}
                >
                  {product.descricao}
                </Text>
              )}

              {/* Bottom row: Price + Rating */}
              <View style={styles.bottomRow}>
                <Text
                  style={[
                    styles.price,
                    { fontFamily: typography.utilityLarge.fontFamily, fontWeight: typography.utilityLarge.fontWeight, fontSize: typography.utilityLarge.fontSize },
                  ]}
                >
                  R$ {Number(product.preco).toFixed(2).replace('.', ',')}
                </Text>

                {product.media_avaliacoes && (product.total_avaliacoes || 0) > 0 && (
                  <View style={styles.rating}>
                    <Ionicons name="star" size={14} color={colors.warning} />
                    <Text
                      style={[
                        styles.ratingText,
                        { fontFamily: typography.utilitySmall.fontFamily, fontSize: typography.utilitySmall.fontSize },
                      ]}
                    >
                      {Number(product.media_avaliacoes).toFixed(1)} ({product.total_avaliacoes})
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  }
);

ProductCard.displayName = 'ProductCard';

const styles = StyleSheet.create({
  cardWrapper: {
    width: 280,
    marginRight: spacing.md,
  },
  card: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  imageWrapper: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  category: {
    color: colors.warmTerracotta,
    backgroundColor: '#FDECE8',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  title: {
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    color: colors.portaNavy,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: colors.textSecondary,
  },
});

export default ProductCard;