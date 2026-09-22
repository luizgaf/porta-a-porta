import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Input, Button, Card } from '../../components/ui';
import { api } from '../../utils/api';
import { TipoUsuario } from '../../types';

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
    if (!selectedCondominio || !nome || !cpf || !email || !senha || !confirmarSenha || !unidade) {
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

    const tipo = (role as TipoUsuario) || 'COMPRADOR';

    setError('');
    try {
      await register({
        condominioId: selectedCondominio,
        nome,
        cpf: formatCPF(cpf),
        email,
        senha,
        unidade,
        tipo,
      });
      router.replace('/(tabs)/home');
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar');
    }
  };

  if (loadingCondominios) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.loadingText}>Carregando condomínios...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
              <Input
                label="Buscar Condomínio"
                placeholder="Digite o nome ou ID"
                onChangeText={(text) => {
                  // Filtro local simples
                }}
                style={styles.input}
              />

              {condominios.length === 0 ? (
                <View style={styles.manualEntry}>
                  <Text style={styles.manualText}>Condomínio não encontrado?</Text>
                  <Input
                    label="ID do Condomínio"
                    placeholder="Fornecido pelo síndico"
                    value={selectedCondominio}
                    onChangeText={setSelectedCondominio}
                    autoCapitalize="none"
                    style={styles.input}
                  />
                  <Button
                    title="Continuar com ID Manual"
                    onPress={() => selectedCondominio && setShowForm(true)}
                    disabled={!selectedCondominio}
                    fullWidth
                    variant="outline"
                    style={styles.manualButton}
                  />
                </View>
              ) : (
                <View style={styles.condominioList}>
                  {condominios.map((cond) => (
                    <TouchableOpacity
                      key={cond.id}
                      style={styles.condominioItem}
                      onPress={() => handleSelectCondominio(cond.id)}
                    >
                      <View style={styles.condominioInfo}>
                        <Text style={styles.condominioName}>{cond.nome}</Text>
                        <Text style={styles.condominioAddress}>{cond.endereco}</Text>
                      </View>
                      <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Card>
          )}

          {showForm && (
            <Card style={styles.formCard}>
              <Text style={styles.selectedCondominio}>
                Condomínio: {condominios.find(c => c.id === selectedCondominio)?.nome || 'ID Manual'}
              </Text>

              <Input
                label="Nome Completo"
                placeholder="João da Silva"
                value={nome}
                onChangeText={setNome}
                autoCapitalize="words"
                style={styles.input}
              />

              <Input
                label="CPF"
                placeholder="000.000.000-00"
                value={cpf}
                onChangeText={(v) => setCpf(formatCPF(v))}
                keyboardType="number-pad"
                maxLength={14}
                style={styles.input}
              />

              <Input
                label="E-mail"
                placeholder="seu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
              />

              <Input
                label="Unidade/Bloco"
                placeholder="Ex: Bloco A, Ap 101"
                value={unidade}
                onChangeText={setUnidade}
                autoCapitalize="words"
                style={styles.input}
              />

              <Input
                label="Senha"
                placeholder="••••••••"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                autoComplete="new-password"
                style={styles.input}
              />

              <Input
                label="Confirmar Senha"
                placeholder="••••••••"
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                secureTextEntry
                autoComplete="new-password"
                style={styles.input}
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

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
    backgroundColor: '#F5F8FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6C7A8A',
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
    fontSize: 26,
    fontWeight: '700',
    color: '#1E3A5F',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6C7A8A',
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  manualEntry: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8EFF5',
    alignItems: 'center',
    gap: 12,
  },
  manualText: {
    fontSize: 14,
    color: '#6C7A8A',
  },
  manualButton: {
    width: '100%',
  },
  condominioList: {
    maxHeight: 300,
  },
  condominioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8EFF5',
  },
  condominioInfo: {
    flex: 1,
  },
  condominioName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  condominioAddress: {
    fontSize: 13,
    color: '#6C7A8A',
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: '#9AA8B8',
  },
  selectedCondominio: {
    fontSize: 14,
    color: '#1E3A5F',
    fontWeight: '500',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EFF5',
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});