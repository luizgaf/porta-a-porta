import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../constants/design';

// Aviso de erro dos formulários de entrada
export const MensagemErro: React.FC<{ texto?: string }> = ({ texto }) => {
  if (!texto) return null;
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Ionicons name="alert-circle" size={18} color={colors.error} />
      <Text style={styles.texto}>{texto}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.errorLight,
  },
  texto: {
    flex: 1,
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.error,
  },
});
