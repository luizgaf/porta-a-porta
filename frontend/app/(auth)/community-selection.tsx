import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Modal, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Input, Button, Card } from '../../components/ui';
import { TipoUsuario, Condominio } from '../../types';
import { colors, spacing, typography, borderRadius, layout } from '../../constants/design';

export default function CommunitySelectionScreen() {
  const router = useRouter();
  const { isLoading } = useAuth();
  const { register, getCondominios } = useApi();
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
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const roleId = (role as TipoUsuario) || 'COMPRADOR';

  useEffect(() => {
    fetchCondominios();
  }, []);

  const fetchCondominios = async () => {
    try {
      const response = await getCondominios();
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
    setDropdownVisible(false);
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
            <View>
              <Card style={styles.formCard}>
                <Text style={styles.sectionLabel}>Condomínio</Text>
                <TouchableOpacity
                  style={[styles.dropdown, selectedCondominio ? styles.dropdownSelected : null]}
                  onPress={() => setDropdownVisible(true)}
                  disabled={loadingCondominios}
                >
                  <Text style={[styles.dropdownText, selectedCondominio ? null : styles.dropdownPlaceholder]}>
                    {loadingCondominios
                      ? 'Carregando...'
                      : selectedCondominio
                        ? condominios.find(c => c.id === selectedCondominio)?.nome || 'Selecione'
                        : 'Selecione um condomínio'}
                  </Text>
                </TouchableOpacity>

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

              <Modal
              transparent
              visible={dropdownVisible}
              animationType="fade"
              onRequestClose={() => setDropdownVisible(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setDropdownVisible(false)}
              >
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Selecione um Condomínio</Text>
                  <FlatList
                    data={condominios}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.modalItem}
                        onPress={() => handleSelectCondominio(item.id)}
                      >
                        <Text style={styles.modalItemText}>{item.nome}</Text>
                        <Text style={styles.modalItemSubtext}>{item.endereco}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
            </View>
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
  sectionLabel: {
    ...typography.bodySmall,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  manualEntry: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  manualText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  dropdown: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  dropdownSelected: {
    borderColor: colors.portaNavy,
  },
  dropdownText: {
    fontSize: 16,
    color: colors.portaNavy,
  },
  dropdownPlaceholder: {
    color: colors.mutedSlate,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    maxHeight: '60%',
    width: '100%',
    padding: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.portaNavy,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.portaNavy,
  },
  modalItemSubtext: {
    fontSize: 13,
    color: colors.mutedSlate,
    marginTop: 2,
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
