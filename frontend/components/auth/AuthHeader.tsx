import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants/design';

interface AuthHeaderProps {
  titulo: string;
  subtitulo?: string;
  onVoltar?: () => void;
  // Etapa atual do cadastro (ex.: { atual: 2, total: 3 })
  etapa?: { atual: number; total: number };
}

// Cabeçalho comum das telas de entrada: voltar, progresso do cadastro, título e subtítulo
export const AuthHeader: React.FC<AuthHeaderProps> = ({ titulo, subtitulo, onVoltar, etapa }) => (
  <View style={styles.container}>
    <View style={styles.topo}>
      {onVoltar ? (
        <TouchableOpacity onPress={onVoltar} style={styles.voltar} accessibilityLabel="Voltar" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.voltar} />
      )}
      {etapa && (
        <Text style={styles.etapaTexto}>
          Etapa {etapa.atual} de {etapa.total}
        </Text>
      )}
    </View>

    {etapa && (
      <View style={styles.progresso} accessibilityElementsHidden>
        {Array.from({ length: etapa.total }).map((_, i) => (
          <View key={i} style={[styles.passo, i < etapa.atual && styles.passoFeito]} />
        ))}
      </View>
    )}

    <Text style={styles.titulo}>{titulo}</Text>
    {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    marginBottom: spacing.md,
  },
  voltar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  etapaTexto: {
    fontFamily: typography.labelMedium.fontFamily,
    fontSize: typography.labelMedium.fontSize,
    color: colors.textSecondary,
  },
  progresso: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.lg,
  },
  passo: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  passoFeito: {
    backgroundColor: colors.accent,
  },
  titulo: {
    fontFamily: typography.displayMedium.fontFamily,
    fontSize: typography.displayMedium.fontSize,
    lineHeight: typography.displayMedium.lineHeight,
    letterSpacing: typography.displayMedium.letterSpacing,
    color: colors.primary,
  },
  subtitulo: {
    marginTop: spacing.sm,
    fontFamily: typography.bodyLarge.fontFamily,
    fontSize: typography.bodyLarge.fontSize,
    lineHeight: typography.bodyLarge.lineHeight,
    color: colors.textSecondary,
  },
});
