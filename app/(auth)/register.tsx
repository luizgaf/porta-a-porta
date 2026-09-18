'use client';

import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(11, 'Telefone inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const { login, setLoading, setError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Determine role from email prefix (for demo/test purposes)
      const emailPrefix = data.email.split('@')[0].toLowerCase();
      let role: 'customer' | 'seller' | 'moderator' = 'customer';

      if (emailPrefix === 'seller') {
        role = 'seller';
      } else if (emailPrefix === 'moderator') {
        role = 'moderator';
      } else {
        role = 'customer';
      }

      const mockUser = {
        uid: '1',
        email: data.email,
        phone: data.phone,
        displayName: data.name,
        role,
        communities: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      login(mockUser, 'mock-token');
      router.push('/(auth)/role-selection');
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.');
      Alert.alert('Erro', 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Voltar">
          <Text style={styles.backText}>‹ Voltar</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Junte-se à Porta a Porta</Text>
        </View>

        <View style={styles.form}>
          <Input
            name="name"
            control={control}
            label="Nome completo"
            placeholder="João Silva"
            error={errors.name?.message}
          />

          <Input
            name="email"
            control={control}
            label="E-mail"
            placeholder="seu@email.com"
            error={errors.email?.message}
          />

          <Input
            name="phone"
            control={control}
            label="Telefone"
            placeholder="(11) 99999-9999"
            error={errors.phone?.message}
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
          />

          <Input
            name="confirmPassword"
            control={control}
            label="Confirmar senha"
            placeholder="••••••••"
            secureTextEntry={!showConfirmPassword}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Text style={styles.eyeIcon}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            }
            error={errors.confirmPassword?.message}
          />

          <View style={styles.terms}>
            <Text style={styles.termsText}>
              Ao continuar, você concorda com nossos {' '}
              <Text style={styles.linkText}>Termos de Uso</Text>
              {' '} e {' '}
              <Text style={styles.linkText}>Política de Privacidade</Text>
            </Text>
          </View>

          <Button
            title="Criar conta"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Já tem conta? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.linkText}>Entrar</Text>
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
  terms: {
    marginTop: 8,
  },
  termsText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: '#007AFF',
    fontWeight: '500',
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
  eyeIcon: {
    fontSize: 20,
  },
});