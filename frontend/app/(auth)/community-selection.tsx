import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Input, Button, Card } from '../../components/ui';
import { api } from '../../utils/api';
import { TipoUsuario } from '../../types';
import { colors, spacing, typography, borderRadius, layout } from '../../constants/design';

interface Condominio {
  id: string;
  nome: string;
  endereco: string;
}

export default function CommunitySelectionScreen() {
  const router = useRouter();
  const { isLoading } = useAuth();
  const { register } = useApi();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [selectedCondominio, setSelectedCondominio] = useState<string>('');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [unidade, setUnidade] = useState('');
  const [error, setError] = useState('');
  const [loadingCondominios, setLoadingCondominios] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const roleId = (role as TipoUsuario) || 'COMPRADOR';

  useEffect(() => {
    fetchCondominios();
  }, []);

  const fetchCondominios = async () => {
    try {
      const response = await api.get<{ condominios: Condominio[] }>('/condominios');
      setCondominios(response.condominios || []);
    } catch {
      // Se falhar, permite entrada manual
    } finally {
      setLoadingCondominios(false);
    }
  };

  const formatCPF = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 11);
  };

  const handleSelectCondominio = (condominioId: string) => {
    setSelectedCondominio(condominioId);
    setShowForm(true);
  };

  const handleRegister = async () => {
    if (!selectedCondominio || !nome || !email || !senha || !unidade) {
      setError('Preencha todos os campos');
      return;
    }
    if (senha !== confirmarSenha) {
      setError('Senhas não conferem');
      return;
    }
    if (formatCPF(cpf).length !== 11) {
      setError('CPF inválido');
      return;
    }
    setError('');
    try {
      await register({
        condominioId: selectedCondominio,
        nome,
        cpf: formatCPF(cpf),
        email,
        senha,
        unidade,
        tipo: roleId,
      });
      router.replace('/(tabs)/home');
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar');
    }
  };

  if (loadingCondominios) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.portaNavy} />
        <Text style={styles.loadingText}>Carregando condomínios...</Text>
      </View>
    );
  }

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
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {showForm ? 'Criar Conta' : 'Selecione seu Condomínio'}
            </Text>
            <Text style={styles.subtitle}>
              {showForm
                ? 'Preencha seus dados para continuar'
                : 'Encontre seu condomínio na lista ou digite o ID'}
            </Text>
          </View>

          {!showForm && (
            <Card style={styles.formCard}>
              <View style={styles.condominioList}>
                {condominios.map((cond) => (
                  <TouchableOpacity
                    key={cond.id}
                    style={styles.condominioItem}
                    onPress={() => handleSelectCondominio(cond.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.condominioInfo}>
                      <Text style={styles.condominioName}>{cond.nome}</Text>
                      <Text style={styles.condominioAddress}>{cond.endereco}</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.manualEntry}>
                <Text style={styles.manualText}>Condomínio não encontrado?</Text>
                <Input
                  label="ID do Condomínio"
                  placeholder="Fornecido pelo síndico"
                  value={selectedCondominio}
                  onChangeText={setSelectedCondominio}
                  autoCapitalize="none"
                />
                <Button
                  title="Continuar com ID Manual"
                  onPress={() => selectedCondominio && setShowForm(true)}
                  disabled={!selectedCondominio}
                  fullWidth
                  variant="outline"
                />
              </View>
            </Card>
          )}

          {showForm && (
            <Card style={styles.formCard}>
              <Text style={styles.selectedCondominio}>
                Condomínio: {condominios.find((c) => c.id === selectedCondominio)?.nome || 'ID Manual'}
              </Text>

              <Input
                label="Nome Completo"
                placeholder="João da Silva"
                value={nome}
                onChangeText={setNome}
                autoCapitalize="words"
              />

              <Input
                label="CPF"
                placeholder="000.000.000-00"
                value={cpf}
                onChangeText={(v) => setCpf(formatCPF(v))}
                keyboardType="number-pad"
                maxLength={14}
              />

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
                label="Unidade/Bloco"
                placeholder="Ex: Bloco A, Ap 101"
                value={unidade}
                onChangeText={setUnidade}
                autoCapitalize="words"
              />

              <Input
                label="Senha"
                placeholder="••••••••"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                autoComplete="new-password"
              />

              <Input
                label="Confirmar Senha"
                placeholder="••••••••"
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                secureTextEntry
                autoComplete="new-password"
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.buttonGroup}>
                <Button
                  title="Voltar"
                  onPress={() => setShowForm(false)}
                  variant="outline"
                  fullWidth
                  size="lg"
                />
                <Button
                  title="Criar Conta"
                  onPress={handleRegister}
                  loading={isLoading}
                  fullWidth
                  size="lg"
                />
              </View>
            </Card>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.mutedSlate,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    justifyContent: 'space-between',
  },
  content: {
    width: '100%',
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
  formCard: {
    marginBottom: spacing.lg,
  },
  manualEntry: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  manualText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  condominioList: {
    maxHeight: 300,
  },
  condominioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  condominioInfo: {
    flex: 1,
  },
  condominioName: {
    ...typography.bodyMedium,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  condominioAddress: {
    ...typography.bodySmall,
    color: colors.mutedSlate,
    marginTop: spacing.xs,
  },
  chevron: {
    fontSize: 20,
    color: colors.textMuted,
  },
  selectedCondominio: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '500' as const,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
