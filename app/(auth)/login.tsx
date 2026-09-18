'use client';

import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { email: initialEmail } = useLocalSearchParams<{ email?: string }>();
  const { login, setLoading, setError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: initialEmail || '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Determine role from email prefix (for demo/test purposes)
      const emailPrefix = data.email.split('@')[0].toLowerCase();
      let role: 'customer' | 'seller' | 'moderator' = 'customer';
      let communities: string[] = [];
      let displayName = 'João Silva';

      if (emailPrefix === 'seller') {
        role = 'seller';
        displayName = 'Maria Santos';
      } else if (emailPrefix === 'moderator') {
        role = 'moderator';
        displayName = 'Carlos Admin';
      } else {
        role = 'customer';
        communities = ['comunidade-1'];
        displayName = 'João Silva';
      }

      // Mock user data
      const mockUser = {
        uid: '1',
        email: data.email,
        phone: '+55 11 99999-9999',
        displayName,
        role,
        communities,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      login(mockUser, 'mock-token');

      // Route based on role
      if (role === 'customer') {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/role-selection');
      }
    } catch (err) {
      setError('Erro ao fazer login. Verifique suas credenciais.');
      Alert.alert('Erro', 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Voltar">
          <Text style={styles.backText}>‹ Voltar</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Entrar</Text>
          <Text style={styles.subtitle}>Acesse sua conta para continuar</Text>
        </View>

        <View style={styles.form}>
          <Input
            name="email"
            control={control}
            label="E-mail"
            placeholder="seu@email.com"
            error={errors.email?.message}
            rules={{ required: 'E-mail é obrigatório' }}
          />

          <Input
            name="password"
            control={control}
            label="Senha"
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            }
            error={errors.password?.message}
            rules={{ required: 'Senha é obrigatória' }}
          />

          <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.forgotPasswordText}>Esqueci a senha</Text>
          </TouchableOpacity>

          <Button
            title="Entrar"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
          />
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          title="Entrar com Google"
          variant="outline"
          size="lg"
          fullWidth
          leftIcon={<Text style={styles.googleIcon}>G</Text>}
          onPress={() => Alert.alert('Em breve', 'Login com Google será implementado')}
        />

        <Button
          title="Entrar com Apple"
          variant="outline"
          size="lg"
          fullWidth
          leftIcon={<Text style={styles.appleIcon}>🍎</Text>}
          onPress={() => Alert.alert('Em breve', 'Login com Apple será implementado')}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Não tem conta? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.linkText}>Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
  },
  form: {
    gap: 20,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#8E8E93',
    fontSize: 14,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  appleIcon: {
    fontSize: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
  },
  footerText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  linkText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  eyeIcon: {
    fontSize: 20,
  },
});