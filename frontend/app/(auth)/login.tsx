import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Input, Button } from '../../components/ui';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { MensagemErro } from '../../components/auth/MensagemErro';
import { colors, spacing, typography } from '../../constants/design';

export default function LoginScreen() {
  const router = useRouter();
  const { setLoading, isLoading } = useAuth();
  const { login: loginApi } = useApi();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    const emailLimpo = email.trim().toLowerCase();
    if (!emailLimpo || !senha) {
      setError('Informe o e-mail e a senha.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await loginApi({ email: emailLimpo, senha });
      router.replace('/(tabs)/home');
    } catch (err: any) {
      setError(err.message || 'Não foi possível entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <AuthHeader
          titulo="Entrar"
          subtitulo="Use o e-mail cadastrado no seu condomínio."
          onVoltar={router.canGoBack() ? () => router.back() : undefined}
        />

        <View style={styles.formulario}>
          <Input
            label="E-mail"
            placeholder="seu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            leftIcon={<Ionicons name="mail-outline" size={20} color={colors.mutedSlate} />}
          />

          <Input
            label="Senha"
            placeholder="Sua senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={!mostrarSenha}
            autoComplete="password"
            textContentType="password"
            onSubmitEditing={handleLogin}
            returnKeyType="go"
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.mutedSlate} />}
            rightIcon={
              <TouchableOpacity
                onPress={() => setMostrarSenha((v) => !v)}
                accessibilityLabel={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                hitSlop={8}
              >
                <Ionicons name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.mutedSlate} />
              </TouchableOpacity>
            }
          />

          <MensagemErro texto={error} />

          <Button title="Entrar" onPress={handleLogin} loading={isLoading} fullWidth size="lg" style={styles.botao} />
        </View>

        <View style={styles.rodape}>
          <Text style={styles.rodapeTexto}>Ainda não tem conta?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/role-selection')} hitSlop={8}>
            <Text style={styles.link}>Criar conta</Text>
          </TouchableOpacity>
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
  conteudo: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  formulario: {
    gap: spacing.md,
  },
  botao: {
    marginTop: spacing.sm,
  },
  rodape: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  rodapeTexto: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textSecondary,
  },
  link: {
    fontFamily: typography.labelLarge.fontFamily,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.accent,
  },
});
