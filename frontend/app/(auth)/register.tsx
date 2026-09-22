import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Input, Button, Card } from '../../components/ui';
import { TipoUsuario } from '../../constants';

export default function RegisterScreen() {
  const router = useRouter();
  const { isLoading } = useAuth();
  const { register } = useApi();
  const [formData, setFormData] = useState({
    condominioId: '',
    nome: '',
    cpf: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    unidade: '',
    tipo: 'COMPRADOR' as TipoUsuario,
  });
  const [error, setError] = useState('');

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers;
  };

  const handleRegister = async () => {
    const { condominioId, nome, cpf, email, senha, confirmarSenha, unidade, tipo } = formData;

    if (!condominioId || !nome || !cpf || !email || !senha || !confirmarSenha || !unidade) {
      setError('Preencha todos os campos');
      return;
    }

    if (cpf.length !== 11) {
      setError('CPF deve ter 11 dígitos');
      return;
    }

    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }

    if (senha.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    setError('');
    try {
      await register({ ...formData, cpf: formatCPF(cpf) } as any);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>Preencha seus dados para começar</Text>
          </View>

          <Card style={styles.formCard}>
            <Input
              label="ID do Condomínio"
              placeholder="Fornecido pelo síndico"
              value={formData.condominioId}
              onChangeText={(v) => handleChange('condominioId', v)}
              autoCapitalize="none"
              style={styles.input}
            />

            <Input
              label="Nome Completo"
              placeholder="João da Silva"
              value={formData.nome}
              onChangeText={(v) => handleChange('nome', v)}
              autoCapitalize="words"
              style={styles.input}
            />

            <Input
              label="CPF"
              placeholder="000.000.000-00"
              value={formData.cpf}
              onChangeText={(v) => handleChange('cpf', formatCPF(v))}
              keyboardType="number-pad"
              maxLength={14}
              style={styles.input}
            />

            <Input
              label="E-mail"
              placeholder="seu@email.com"
              value={formData.email}
              onChangeText={(v) => handleChange('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
            />

            <Input
              label="Unidade/Bloco"
              placeholder="Ex: Bloco A, Ap 101"
              value={formData.unidade}
              onChangeText={(v) => handleChange('unidade', v)}
              autoCapitalize="words"
              style={styles.input}
            />

            <Text style={styles.sectionLabel}>Tipo de Usuário</Text>
            <View style={styles.roleOptions}>
              {(['COMPRADOR', 'VENDEDOR'] as TipoUsuario[]).map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  style={[
                    styles.roleOption,
                    formData.tipo === tipo && styles.roleOptionSelected,
                  ]}
                  onPress={() => handleChange('tipo', tipo)}
                >
                  <Text style={[
                    styles.roleOptionText,
                    formData.tipo === tipo && styles.roleOptionTextSelected,
                  ]}>
                    {tipo === 'COMPRADOR' ? '🛒 Comprador' : '🏪 Vendedor'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Senha"
              placeholder="••••••••"
              value={formData.senha}
              onChangeText={(v) => handleChange('senha', v)}
              secureTextEntry
              autoComplete="new-password"
              style={styles.input}
            />

            <Input
              label="Confirmar Senha"
              placeholder="••••••••"
              value={formData.confirmarSenha}
              onChangeText={(v) => handleChange('confirmarSenha', v)}
              secureTextEntry
              autoComplete="new-password"
              style={styles.input}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              title="Criar Conta"
              onPress={handleRegister}
              loading={isLoading}
              fullWidth
              size="lg"
              style={styles.registerButton}
            />
          </Card>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem conta? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.link}>Faça login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  content: {
    width: '100%',
  },
  header: {
    marginBottom: 24,
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
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 8,
    marginTop: 8,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1E3F0',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  roleOptionSelected: {
    borderColor: '#1E3A5F',
    backgroundColor: '#E6F4FE',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3D4A5A',
  },
  roleOptionTextSelected: {
    color: '#1E3A5F',
    fontWeight: '600',
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  registerButton: {
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