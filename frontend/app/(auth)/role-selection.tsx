import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius, layout } from '../../constants/design';

const roles = [
  {
    id: 'COMPRADOR',
    label: 'Comprador',
    description: 'Quero comprar dos vizinhos',
    icon: '🛒',
    color: colors.portaNavy,
  },
  {
    id: 'VENDEDOR',
    label: 'Vendedor',
    description: 'Quero vender meus produtos',
    icon: '🏪',
    color: colors.warmTerracotta,
  },
];

export default function RoleSelectionScreen() {
  const router = useRouter();

  const handleSelectRole = (roleId: string) => {
    router.push(`/(auth)/community-selection?role=${roleId}`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Como você vai usar o app?</Text>
          <Text style={styles.subtitle}>Escolha seu perfil para continuar</Text>
        </View>

        <View style={styles.options}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[styles.optionCard, { borderColor: role.color }]}
              onPress={() => handleSelectRole(role.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.optionIcon}>{role.icon}</Text>
              <View style={styles.optionTextGroup}>
                <Text style={[styles.optionLabel, { color: role.color }]}>{role.label}</Text>
                <Text style={styles.optionDescription}>{role.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...typography.displaySmall,
    color: colors.portaNavy,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.mutedSlate,
    textAlign: 'center',
  },
  options: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderStyle: 'solid',
    borderRadius: borderRadius.lg,
    elevation: 1,
  },
  optionIcon: {
    fontSize: 36,
  },
  optionTextGroup: {
    flex: 1,
  },
  optionLabel: {
    ...typography.bodyLarge,
    fontWeight: '700' as const,
  },
  optionDescription: {
    ...typography.bodySmall,
    color: colors.mutedSlate,
    marginTop: spacing.xs,
  },
  footer: {
    paddingBottom: spacing.sm,
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
