import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui';
import { colors, spacing, typography, layout, borderRadius } from '../../constants/design';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/(auth)/role-selection');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Porta a Porta</Text>
        <Text style={styles.subtitle}>
          Comércio interno do seu condomínio, organizado e seguro.
        </Text>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🛍️</Text>
            <Text style={styles.featureText}>Vitrine de produtos dos vizinhos</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🚪</Text>
            <Text style={styles.featureText}>Entrega na portaria ou unidade</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🛡️</Text>
            <Text style={styles.featureText}>Moderação pelo síndico</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottom}>
        <Button
          title="Criar Conta"
          onPress={handleGetStarted}
          size="lg"
          fullWidth
        />
        <View style={styles.loginRow}>
          <Text style={styles.footerText}>Já tem conta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.link}>Entrar</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.termsText}>
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
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.md,
  },
  content: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    width: 100,
    height: 100,
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
    lineHeight: 24,
  },
  features: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  bottom: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    ...typography.bodyMedium,
    color: colors.mutedSlate,
  },
  link: {
    ...typography.bodyMedium,
    color: colors.portaNavy,
    fontWeight: '600' as const,
  },
  termsText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.sm,
  },
});
