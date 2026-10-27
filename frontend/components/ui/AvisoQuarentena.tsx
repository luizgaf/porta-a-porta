import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Produto } from '../../types';
import { colors, spacing, borderRadius, typography } from '../../constants/design';

interface Props {
  quarentena?: Produto['quarentena'];
  // "vendedor": dono do anúncio; "sindico": painel de moderação
  para: 'vendedor' | 'sindico';
  // Versão menor, para o card do painel Vender
  compacto?: boolean;
  style?: ViewStyle;
}

const VERMELHO = '#B42318';

// Quadro da quarentena: o motivo em destaque e, abaixo, os motivos das denúncias recebidas,
// sem identificar quem denunciou (RN02).
export const AvisoQuarentena: React.FC<Props> = ({ quarentena, para, compacto, style }) => {
  const denuncias = quarentena?.denuncias ?? [];
  const automatica = !quarentena?.porSindico;
  const mostrar = compacto ? denuncias.slice(0, 3) : denuncias;

  return (
    <View style={[styles.caixa, compacto && styles.caixaCompacta, style]} accessibilityRole="summary">
      <View style={styles.topo}>
        <Ionicons name="shield" size={compacto ? 16 : 18} color={VERMELHO} />
        <Text style={[styles.titulo, compacto && styles.tituloCompacto]}>
          {automatica ? 'Em quarentena por denúncias' : 'Em quarentena pelo síndico'}
        </Text>
      </View>

      <Text style={styles.rotulo}>Motivo</Text>
      <Text style={[styles.motivo, compacto && styles.motivoCompacto]}>{quarentena?.motivo || 'Produto sob análise do síndico.'}</Text>

      {denuncias.length > 0 && (
        <>
          <Text style={styles.rotulo}>
            {denuncias.length === 1 ? '1 denúncia recebida' : `${denuncias.length} denúncias recebidas`}
          </Text>
          {mostrar.map((motivo, i) => (
            <View key={i} style={styles.item}>
              <View style={styles.marcador} />
              <Text style={styles.itemTexto} numberOfLines={compacto ? 1 : undefined}>
                {motivo}
              </Text>
            </View>
          ))}
          {mostrar.length < denuncias.length && (
            <Text style={styles.mais}>e mais {denuncias.length - mostrar.length}</Text>
          )}
        </>
      )}

      <Text style={styles.rodape}>
        {para === 'vendedor'
          ? 'O anúncio não aparece para os outros moradores. Só o síndico pode reativá-lo.'
          : automatica
            ? 'Suspenso automaticamente ao receber 3 denúncias. Você pode restaurar ou manter em quarentena.'
            : 'Você pode restaurar o anúncio se o problema foi resolvido.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  caixa: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECDCA',
  },
  caixaCompacta: {
    padding: spacing.sm + 4,
    marginBottom: spacing.sm,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  titulo: {
    fontFamily: typography.labelLarge.fontFamily,
    fontSize: 15,
    color: VERMELHO,
  },
  tituloCompacto: {
    fontSize: 14,
  },
  rotulo: {
    fontFamily: typography.labelSmall.fontFamily,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#912018',
    marginTop: spacing.sm,
    marginBottom: 2,
  },
  motivo: {
    fontFamily: typography.labelMedium.fontFamily,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  motivoCompacto: {
    fontSize: 14,
    lineHeight: 19,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: 3,
  },
  marcador: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 7,
    backgroundColor: VERMELHO,
  },
  itemTexto: {
    flex: 1,
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  mais: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginLeft: spacing.sm + 5,
  },
  rodape: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
