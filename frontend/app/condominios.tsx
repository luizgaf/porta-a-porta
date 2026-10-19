import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Switch, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../hooks/useApi';
import { Button, Input } from '../components/ui';
import { STATUS_LABELS } from '../constants';
import { Condominio, MeuCondominio } from '../types';
import { colors, spacing, typography, borderRadius, layout } from '../constants/design';

// Condomínios do usuário: troca do condomínio ativo e pedido para participar de outro.
// O síndico do outro condomínio aprova o pedido e define se a pessoa só compra ou também vende lá.

const SITUACAO: Record<string, { texto: string; cor: string; fundo: string }> = {
  PENDENTE: { texto: 'Aguardando o síndico', cor: '#8A5A00', fundo: '#FFF4D6' },
  RECUSADO: { texto: 'Pedido recusado', cor: colors.error, fundo: colors.errorLight },
};

export default function CondominiosScreen() {
  const router = useRouter();
  const { getMeusCondominios, getCondominios, pedirParticipacao, trocarCondominio } = useApi();

  const [meus, setMeus] = useState<MeuCondominio[]>([]);
  const [ativoId, setAtivoId] = useState('');
  const [todos, setTodos] = useState<Condominio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [trocandoPara, setTrocandoPara] = useState<string | null>(null);

  const [formAberto, setFormAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [unidade, setUnidade] = useState('');
  const [querVender, setQuerVender] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const [resposta, lista] = await Promise.all([getMeusCondominios(), getCondominios()]);
      setMeus(resposta.condominios);
      setAtivoId(resposta.condominioAtivoId);
      setTodos(lista.condominios || []);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível carregar os condomínios');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [getMeusCondominios, getCondominios]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  // Pode pedir para os condomínios em que ainda não participa (ou cujo pedido foi recusado)
  const disponiveis = useMemo(() => {
    const ocupados = new Set(meus.filter((m) => m.status !== 'RECUSADO').map((m) => m.condominio.id));
    const termo = busca.trim().toLowerCase();
    return todos
      .filter((c) => !ocupados.has(c.id))
      .filter((c) => !termo || c.nome.toLowerCase().includes(termo) || c.endereco?.toLowerCase().includes(termo));
  }, [meus, todos, busca]);

  const trocar = async (item: MeuCondominio) => {
    if (item.condominio.id === ativoId || item.status !== 'APROVADO') return;
    setTrocandoPara(item.condominio.id);
    try {
      await trocarCondominio(item.condominio.id);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Não foi possível trocar', error.message || 'Tente novamente.');
    } finally {
      setTrocandoPara(null);
    }
  };

  const abrirFormulario = (condominioId?: string) => {
    setFormAberto(true);
    setEscolhido(condominioId ?? null);
  };

  const enviar = async () => {
    if (!escolhido) {
      Alert.alert('Escolha o condomínio', 'Toque no condomínio em que você quer participar.');
      return;
    }
    if (!unidade.trim()) {
      Alert.alert('Informe a unidade', 'Diga em qual unidade você mora ou atende naquele condomínio.');
      return;
    }
    setEnviando(true);
    try {
      const resposta = await pedirParticipacao({ condominioId: escolhido, unidade: unidade.trim(), querVender });
      setFormAberto(false);
      setEscolhido(null);
      setUnidade('');
      setQuerVender(false);
      setBusca('');
      Alert.alert('Pedido enviado', resposta.message);
      carregar();
    } catch (error: any) {
      Alert.alert('Não foi possível enviar', error.message || 'Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const renderMeu = (item: MeuCondominio) => {
    const ativo = item.condominio.id === ativoId;
    const podeTrocar = item.status === 'APROVADO' && !ativo;
    const situacao = SITUACAO[item.status];

    return (
      <TouchableOpacity
        key={item.condominio.id}
        style={[styles.card, ativo && styles.cardAtivo]}
        onPress={() => (item.status === 'RECUSADO' ? abrirFormulario(item.condominio.id) : trocar(item))}
        disabled={!podeTrocar && item.status !== 'RECUSADO'}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`${item.condominio.nome}${ativo ? ', condomínio ativo' : ''}`}
      >
        <View style={[styles.cardIcone, ativo && styles.cardIconeAtivo]}>
          <Ionicons name="business" size={20} color={ativo ? colors.textOnAccent : colors.primary} />
        </View>
        <View style={styles.cardTexto}>
          <Text style={styles.cardNome} numberOfLines={1}>
            {item.condominio.nome}
          </Text>
          <Text style={styles.cardDetalhe} numberOfLines={1}>
            {item.unidade} · {item.status === 'APROVADO' ? STATUS_LABELS[item.tipo] : `pediu como ${STATUS_LABELS[item.tipo].toLowerCase()}`}
            {item.origem ? ' · origem' : ''}
          </Text>
          {situacao ? (
            <View style={[styles.selo, { backgroundColor: situacao.fundo }]}>
              <Text style={[styles.seloTexto, { color: situacao.cor }]}>
                {situacao.texto}
                {item.status === 'RECUSADO' ? ' · toque para pedir de novo' : ''}
              </Text>
            </View>
          ) : null}
        </View>
        {trocandoPara === item.condominio.id ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : ativo ? (
          <View style={styles.ativoTag}>
            <Text style={styles.ativoTexto}>Ativo</Text>
          </View>
        ) : podeTrocar ? (
          <Text style={styles.trocarTexto}>Entrar</Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Condomínios</Text>
        <View style={{ width: 28 }} />
      </View>

      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={atualizando} onRefresh={() => { setAtualizando(true); carregar(); }} colors={[colors.primary]} />
          }
        >
          <Text style={styles.intro}>
            A vitrine mostra os produtos do condomínio ativo. Para ver os produtos de outro condomínio, peça para participar:
            o síndico de lá analisa o pedido.
          </Text>

          <Text style={styles.secao}>Seus condomínios</Text>
          <View style={styles.lista}>{meus.map(renderMeu)}</View>

          <Text style={styles.secao}>Participar de outro condomínio</Text>
          {!formAberto ? (
            <Button
              title="Pedir para participar"
              variant="outline"
              onPress={() => abrirFormulario()}
              leftIcon={<Ionicons name="add" size={18} color={colors.primary} />}
              fullWidth
            />
          ) : (
            <View style={styles.form}>
              {todos.length > 6 && (
                <Input
                  placeholder="Buscar condomínio"
                  value={busca}
                  onChangeText={setBusca}
                  leftIcon={<Ionicons name="search" size={18} color={colors.mutedSlate} />}
                />
              )}

              {disponiveis.length === 0 ? (
                <Text style={styles.vazio}>Nenhum outro condomínio disponível.</Text>
              ) : (
                <View style={styles.opcoes}>
                  {disponiveis.map((c) => {
                    const selecionado = escolhido === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.opcao, selecionado && styles.opcaoSelecionada]}
                        onPress={() => setEscolhido(c.id)}
                        accessibilityState={{ selected: selecionado }}
                      >
                        <Ionicons
                          name={selecionado ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={selecionado ? colors.accent : colors.mutedSlate}
                        />
                        <View style={styles.opcaoTexto}>
                          <Text style={styles.opcaoNome}>{c.nome}</Text>
                          {c.endereco ? <Text style={styles.opcaoEndereco}>{c.endereco}</Text> : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <Input label="Sua unidade nesse condomínio" placeholder="Ex.: Bloco B, Apto 905" value={unidade} onChangeText={setUnidade} />

              <View style={styles.vender}>
                <View style={styles.venderTexto}>
                  <Text style={styles.venderTitulo}>Também quero vender lá</Text>
                  <Text style={styles.venderAjuda}>O síndico decide se você poderá anunciar ou só comprar.</Text>
                </View>
                <Switch
                  value={querVender}
                  onValueChange={setQuerVender}
                  trackColor={{ false: colors.borderStrong, true: colors.accentLight }}
                  thumbColor={querVender ? colors.accent : colors.surface}
                />
              </View>

              <Button title="Enviar pedido" onPress={enviar} loading={enviando} disabled={enviando} fullWidth />
              <Button title="Cancelar" variant="ghost" onPress={() => setFormAberto(false)} fullWidth />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontFamily: typography.displaySmall.fontFamily, fontSize: 20, color: colors.primary },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  conteudo: { padding: layout.screenPadding, paddingBottom: spacing.xxl },
  intro: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  secao: {
    fontFamily: typography.labelSmall.fontFamily,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  lista: { gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardAtivo: { borderColor: colors.accent },
  cardIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.morningFog,
  },
  cardIconeAtivo: { backgroundColor: colors.accent },
  cardTexto: { flex: 1, gap: 2 },
  cardNome: { fontFamily: typography.labelLarge.fontFamily, fontSize: 15, color: colors.textPrimary },
  cardDetalhe: { fontFamily: typography.bodySmall.fontFamily, fontSize: 13, color: colors.textSecondary },
  selo: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  seloTexto: { fontFamily: typography.labelSmall.fontFamily, fontSize: 11 },
  ativoTag: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full, backgroundColor: '#FBE7DF' },
  ativoTexto: { fontFamily: typography.labelSmall.fontFamily, fontSize: 12, color: colors.accent },
  trocarTexto: { fontFamily: typography.labelMedium.fontFamily, fontSize: 14, color: colors.accent },
  form: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vazio: { fontFamily: typography.bodyMedium.fontFamily, fontSize: 14, color: colors.textSecondary },
  opcoes: { gap: spacing.xs },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  opcaoSelecionada: { borderColor: colors.accent, backgroundColor: '#FDF3EF' },
  opcaoTexto: { flex: 1 },
  opcaoNome: { fontFamily: typography.labelMedium.fontFamily, fontSize: 14, color: colors.textPrimary },
  opcaoEndereco: { fontFamily: typography.bodySmall.fontFamily, fontSize: 12, color: colors.textSecondary },
  vender: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  venderTexto: { flex: 1 },
  venderTitulo: { fontFamily: typography.labelMedium.fontFamily, fontSize: 14, color: colors.textPrimary },
  venderAjuda: { fontFamily: typography.bodySmall.fontFamily, fontSize: 12, color: colors.textSecondary },
});
