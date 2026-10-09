import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Input, Button, Card } from '../../components/ui';
import { colors, spacing, typography, borderRadius, layout } from '../../constants/design';

export default function LoginScreen() {
  const router = useRouter();
  const { setLoading, isLoading } = useAuth();
  const { login: loginApi } = useApi();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !senha) {
      setError('Preencha todos os campos');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await loginApi({ email, senha });
      router.replace('/(tabs)/home');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Bem-vindo(a)</Text>
          <Text style={styles.subtitle}>Digite suas credenciais para continuar</Text>
        </View>

        <Card style={styles.formCard}>
          <Input
            label="E-mail"
            placeholder="seu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Input
            label="Senha"
            placeholder="••••••••"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            autoComplete="password"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            title="Entrar"
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
            size="lg"
          />
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Não tem conta? </Text>
          <Link href="/(auth)/community-selection" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Cadastre-se</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  header: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...typography.displaySmall,
    color: colors.portaNavy,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.mutedSlate,
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  footer: {
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
});
