import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Input, Button, Card } from '../../components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const { isLoading } = useAuth();
  const { login } = useApi();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !senha) {
      setError('Preencha todos os campos');
      return;
    }

    setError('');
    try {
      const response = await login({ email, senha });
      router.replace('/(tabs)/home');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Entrar</Text>
          <Text style={styles.subtitle}>Acesse sua conta no Porta a Porta</Text>
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
            error={error}
            style={styles.input}
          />

          <Input
            label="Senha"
            placeholder="••••••••"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            autoComplete="password"
            error={error}
            style={styles.input}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            title="Entrar"
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
            size="lg"
            style={styles.loginButton}
          />
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Não tem conta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/community-selection')}>
            <Text style={styles.link}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6C7A8A',
  },
  formCard: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 8,
  },
  footer: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 15,
    color: '#6C7A8A',
  },
  link: {
    fontSize: 15,
    color: '#1E3A5F',
    fontWeight: '600',
  },
});