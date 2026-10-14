import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Input, Button } from '../../components/ui';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { MensagemErro } from '../../components/auth/MensagemErro';
import { TipoUsuario, Condominio } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../constants/design';

// Cadastro em duas etapas (2 e 3 do fluxo; a 1 é a escolha do perfil):
// escolher o condomínio e depois preencher os dados do morador.

const apenasDigitos = (valor: string) => valor.replace(/\D/g, '').slice(0, 11);

// 12345678901 -> 123.456.789-01 (só para exibição; a API recebe os 11 dígitos)
const mascararCPF = (digitos: string) =>
  digitos
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');

const icone = (nome: keyof typeof Ionicons.glyphMap) => <Ionicons name={nome} size={20} color={colors.mutedSlate} />;

export default function CommunitySelectionScreen() {
  const router = useRouter();
  const { isLoading } = useAuth();
  const { register, getCondominios } = useApi();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const perfil: TipoUsuario = role === 'VENDEDOR' ? 'VENDEDOR' : 'COMPRADOR';

  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [carregandoCondominios, setCarregandoCondominios] = useState(true);
  const [busca, setBusca] = useState('');
  const [condominioId, setCondominioId] = useState('');
  const [codigoManual, setCodigoManual] = useState('');
  const [mostrarCodigo, setMostrarCodigo] = useState(false);
  const [etapa, setEtapa] = useState<'CONDOMINIO' | 'DADOS'>('CONDOMINIO');

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [unidade, setUnidade] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCondominios()
      .then((resposta) => setCondominios(resposta.condominios || []))
      .catch(() => setMostrarCodigo(true))
      .finally(() => setCarregandoCondominios(false));
  }, [getCondominios]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return condominios;
    return condominios.filter((c) => `${c.nome} ${c.endereco}`.toLowerCase().includes(termo));
  }, [busca, condominios]);

  const condominioEscolhido = condominios.find((c) => c.id === condominioId);
  const idFinal = mostrarCodigo && codigoManual.trim() ? codigoManual.trim() : condominioId;

  const avancar = () => {
    if (!idFinal) {
      setError('Escolha o seu condomínio para continuar.');
      return;
    }
    setError('');
    setEtapa('DADOS');
  };

  const handleRegister = async () => {
    const emailLimpo = email.trim().toLowerCase();
    if (!nome.trim() || !emailLimpo || !unidade.trim() || !senha) {
      setError('Preencha todos os campos.');
      return;
    }
    if (apenasDigitos(cpf).length !== 11) {
      setError('O CPF precisa ter 11 dígitos.');
      return;
    }
    if (senha.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      setError('As senhas não conferem.');
      return;
    }
    setError('');
    setEnviando(true);
    try {
      await register({
        condominioId: idFinal,
        nome: nome.trim(),
        cpf: apenasDigitos(cpf),
        email: emailLimpo,
        senha,
        unidade: unidade.trim(),
        tipo: perfil,
      });
      router.replace('/(tabs)/home');
    } catch (err: any) {
      setError(err.message || 'Não foi possível criar a conta.');
    } finally {
      setEnviando(false);
    }
  };

  const voltar = () => {
    setError('');
    if (etapa === 'DADOS') setEtapa('CONDOMINIO');
    else router.back();
  };

  const olhoSenha = (
    <TouchableOpacity onPress={() => setMostrarSenha((v) => !v)} accessibilityLabel={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'} hitSlop={8}>
      <Ionicons name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.mutedSlate} />
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {etapa === 'CONDOMINIO' ? (
          <>
            <AuthHeader
              titulo="Qual é o seu condomínio?"
              subtitulo="Você só verá produtos e pedidos dos moradores dele."
              etapa={{ atual: 2, total: 3 }}
              onVoltar={voltar}
            />

            {carregandoCondominios ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.carregando} />
            ) : (
              <View style={styles.secao}>
                {condominios.length > 5 && (
                  <Input
                    placeholder="Buscar pelo nome ou endereço"
                    value={busca}
                    onChangeText={setBusca}
                    leftIcon={icone('search-outline')}
                    autoCorrect={false}
                  />
                )}

                {filtrados.map((c) => {
                  const selecionado = condominioId === c.id && !mostrarCodigo;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.condominio, selecionado && styles.condominioSelecionado]}
                      onPress={() => {
                        setCondominioId(c.id);
                        setMostrarCodigo(false);
                        setError('');
                      }}
                      activeOpacity={0.85}
                      accessibilityState={{ selected: selecionado }}
                    >
                      <View style={[styles.condominioIcone, selecionado && styles.condominioIconeSelecionado]}>
                        <Ionicons name="business-outline" size={20} color={selecionado ? colors.textOnPrimary : colors.primary} />
                      </View>
                      <View style={styles.condominioTexto}>
                        <Text style={styles.condominioNome}>{c.nome}</Text>
                        <Text style={styles.condominioEndereco} numberOfLines={2}>{c.endereco}</Text>
                      </View>
                      <Ionicons
                        name={selecionado ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={selecionado ? colors.accent : colors.borderStrong}
                      />
                    </TouchableOpacity>
                  );
                })}

                {condominios.length > 0 && filtrados.length === 0 && (
                  <Text style={styles.vazio}>Nenhum condomínio encontrado para "{busca}".</Text>
                )}

                <TouchableOpacity onPress={() => setMostrarCodigo((v) => !v)} style={styles.linkCodigo} hitSlop={8}>
                  <Text style={styles.link}>
                    {mostrarCodigo ? 'Escolher da lista' : 'Meu condomínio não aparece'}
                  </Text>
                </TouchableOpacity>

                {mostrarCodigo && (
                  <Input
                    label="Código do condomínio"
                    placeholder="Informado pelo síndico"
                    value={codigoManual}
                    onChangeText={setCodigoManual}
                    autoCapitalize="none"
                    autoCorrect={false}
                    leftIcon={icone('key-outline')}
                  />
                )}
              </View>
            )}

            <View style={styles.rodape}>
              <MensagemErro texto={error} />
              <Button title="Continuar" onPress={avancar} fullWidth size="lg" disabled={carregandoCondominios} />
            </View>
          </>
        ) : (
          <>
            <AuthHeader
              titulo="Seus dados"
              subtitulo={condominioEscolhido ? `Cadastro no ${condominioEscolhido.nome}.` : 'Cadastro com o código informado.'}
              etapa={{ atual: 3, total: 3 }}
              onVoltar={voltar}
            />

            <View style={styles.perfil}>
              <Ionicons name={perfil === 'VENDEDOR' ? 'storefront-outline' : 'bag-handle-outline'} size={16} color={colors.primary} />
              <Text style={styles.perfilTexto}>{perfil === 'VENDEDOR' ? 'Conta de vendedor' : 'Conta de comprador'}</Text>
            </View>

            <View style={styles.secao}>
              <Input label="Nome completo" placeholder="Como os vizinhos vão te ver" value={nome} onChangeText={setNome} autoCapitalize="words" leftIcon={icone('person-outline')} />
              <Input
                label="Unidade"
                placeholder="Ex.: Bloco A, Apto 101"
                value={unidade}
                onChangeText={setUnidade}
                autoCapitalize="words"
                leftIcon={icone('home-outline')}
                helperText="Usada para entregas. Só aparece para quem negocia com você."
              />
              <Input
                label="CPF"
                placeholder="000.000.000-00"
                value={mascararCPF(apenasDigitos(cpf))}
                onChangeText={(v) => setCpf(apenasDigitos(v))}
                keyboardType="number-pad"
                maxLength={14}
                leftIcon={icone('card-outline')}
                helperText="Não é exibido a outros moradores."
              />
              <Input
                label="E-mail"
                placeholder="seu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                leftIcon={icone('mail-outline')}
              />
              <Input
                label="Senha"
                placeholder="Mínimo de 6 caracteres"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!mostrarSenha}
                autoComplete="new-password"
                leftIcon={icone('lock-closed-outline')}
                rightIcon={olhoSenha}
              />
              <Input
                label="Confirmar senha"
                placeholder="Repita a senha"
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                secureTextEntry={!mostrarSenha}
                autoComplete="new-password"
                leftIcon={icone('lock-closed-outline')}
              />
            </View>

            <View style={styles.rodape}>
              <MensagemErro texto={error} />
              <Button title="Criar conta" onPress={handleRegister} loading={enviando || isLoading} fullWidth size="lg" />
            </View>
          </>
        )}
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
  carregando: {
    marginTop: spacing.xl,
  },
  secao: {
    gap: spacing.md,
  },
  condominio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  condominioSelecionado: {
    borderColor: colors.accent,
    borderWidth: 2,
    backgroundColor: '#FFF9F6',
  },
  condominioIcone: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.morningFog,
  },
  condominioIconeSelecionado: {
    backgroundColor: colors.primary,
  },
  condominioTexto: {
    flex: 1,
    gap: 2,
  },
  condominioNome: {
    fontFamily: typography.labelLarge.fontFamily,
    fontSize: 15,
    color: colors.textPrimary,
  },
  condominioEndereco: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  vazio: {
    textAlign: 'center',
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.textSecondary,
  },
  linkCodigo: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
  },
  link: {
    fontFamily: typography.labelLarge.fontFamily,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.accent,
  },
  perfil: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.morningFog,
    marginBottom: spacing.lg,
  },
  perfilTexto: {
    fontFamily: typography.labelMedium.fontFamily,
    fontSize: 13,
    color: colors.primary,
  },
  rodape: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
});
