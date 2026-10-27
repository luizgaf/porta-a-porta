import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Avatar, Button, Input } from '../ui';
import { PedidosParticipacao } from './PedidosParticipacao';
import { STATUS_LABELS } from '../../constants';
import { PainelUsuarios as Painel, Sancao, TipoSancao, UsuarioDoPainel } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../constants/design';

// Aba "Usuários" da moderação: resumo do condomínio, novos usuários, pedidos de participação
// e a lista de todos os usuários, com advertência, suspensão, banimento e reativação.
// Tudo vale só para o condomínio do síndico; as decisões vão para o log de auditoria.

interface Props {
  // Muda a cada "puxar para atualizar" da tela de moderação
  atualizar: number;
}

type Filtro = 'TODOS' | 'NOVOS' | 'COMPRADOR' | 'VENDEDOR' | 'SUSPENSO' | 'BANIDO' | 'ADVERTIDOS';
const FILTROS: { id: Filtro; nome: string }[] = [
  { id: 'TODOS', nome: 'Todos' },
  { id: 'NOVOS', nome: 'Novos' },
  { id: 'COMPRADOR', nome: 'Compradores' },
  { id: 'VENDEDOR', nome: 'Vendedores' },
  { id: 'SUSPENSO', nome: 'Suspensos' },
  { id: 'BANIDO', nome: 'Banidos' },
  { id: 'ADVERTIDOS', nome: 'Advertidos' },
];

const DIAS_SUSPENSAO = [1, 3, 7, 15, 30];

const TEXTO_SANCAO: Record<TipoSancao, { nome: string; cor: string; icone: keyof typeof Ionicons.glyphMap }> = {
  ADVERTENCIA: { nome: 'Advertência', cor: '#B54708', icone: 'alert-circle' },
  SUSPENSAO: { nome: 'Suspensão', cor: '#C4320A', icone: 'pause-circle' },
  BANIMENTO: { nome: 'Banimento', cor: '#B42318', icone: 'ban' },
};

const data = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
const dataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export function PainelUsuarios({ atualizar }: Props) {
  const { usuario: eu } = useAuth();
  const { getPainelUsuarios, getSancoes, aplicarSancao, reativarUsuario } = useApi();

  const [painel, setPainel] = useState<Painel | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const [busca, setBusca] = useState('');

  const [aberto, setAberto] = useState<UsuarioDoPainel | null>(null);
  const [historico, setHistorico] = useState<Sancao[] | null>(null);
  const [acao, setAcao] = useState<TipoSancao | 'REATIVAR' | null>(null);
  const [motivo, setMotivo] = useState('');
  const [dias, setDias] = useState(7);
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setPainel(await getPainelUsuarios());
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível carregar os usuários');
    } finally {
      setCarregando(false);
    }
  }, [getPainelUsuarios]);

  useEffect(() => {
    carregar();
  }, [carregar, atualizar]);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (painel?.usuarios ?? []).filter((u) => {
      if (termo && !u.nome.toLowerCase().includes(termo) && !u.unidade.toLowerCase().includes(termo)) return false;
      switch (filtro) {
        case 'NOVOS':
          return u.novo;
        case 'COMPRADOR':
        case 'VENDEDOR':
          return u.tipo === filtro;
        case 'SUSPENSO':
        case 'BANIDO':
          return u.situacao === filtro;
        case 'ADVERTIDOS':
          return u.advertencias > 0;
        default:
          return true;
      }
    });
  }, [painel, filtro, busca]);

  const abrir = async (u: UsuarioDoPainel) => {
    setAberto(u);
    setAcao(null);
    setMotivo('');
    setDias(7);
    setHistorico(null);
    try {
      setHistorico((await getSancoes(u.id)).sancoes);
    } catch {
      setHistorico([]);
    }
  };

  const fechar = () => {
    setAberto(null);
    setAcao(null);
  };

  const confirmar = async () => {
    if (!aberto || !acao) return;
    if (acao !== 'REATIVAR' && motivo.trim().length < 5) {
      Alert.alert('Motivo obrigatório', 'Explique o motivo (mínimo 5 caracteres). O usuário vai ler este texto.');
      return;
    }
    const executar = async () => {
      setEnviando(true);
      try {
        if (acao === 'REATIVAR') {
          await reativarUsuario(aberto.id, motivo.trim() || undefined);
        } else {
          await aplicarSancao(aberto.id, { tipo: acao, motivo: motivo.trim(), dias: acao === 'SUSPENSAO' ? dias : undefined });
        }
        fechar();
        carregar();
      } catch (error: any) {
        Alert.alert('Erro', error.message || 'Não foi possível concluir a ação');
      } finally {
        setEnviando(false);
      }
    };
    if (acao === 'BANIMENTO') {
      Alert.alert('Banir usuário', `${aberto.nome} perde o acesso a este condomínio até você reativá-lo. Continuar?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Banir', style: 'destructive', onPress: executar },
      ]);
    } else {
      executar();
    }
  };

  if (carregando) {
    return <ActivityIndicator size="large" color={colors.primary} style={styles.carregando} />;
  }
  if (!painel) return null;

  const { resumo } = painel;
  const novos = painel.usuarios.filter((u) => u.novo).slice(0, 10);
  const podeModerar = (u: UsuarioDoPainel) => u.id !== eu?.id && u.tipo !== 'SINDICO';

  const indicadores: { rotulo: string; valor: number; filtro: Filtro; destaque?: boolean }[] = [
    { rotulo: 'Usuários', valor: resumo.total, filtro: 'TODOS' },
    { rotulo: `Novos (${resumo.diasNovo} dias)`, valor: resumo.novos, filtro: 'NOVOS', destaque: resumo.novos > 0 },
    { rotulo: 'Vendedores', valor: resumo.vendedores, filtro: 'VENDEDOR' },
    { rotulo: 'Suspensos', valor: resumo.suspensos, filtro: 'SUSPENSO' },
    { rotulo: 'Banidos', valor: resumo.banidos, filtro: 'BANIDO' },
    { rotulo: 'Com advertência', valor: resumo.comAdvertencia, filtro: 'ADVERTIDOS' },
  ];

  return (
    <View>
      {/* Resumo: cada número filtra a lista */}
      <View style={styles.grade}>
        {indicadores.map((i) => (
          <TouchableOpacity
            key={i.rotulo}
            style={[styles.indicador, filtro === i.filtro && styles.indicadorAtivo]}
            onPress={() => setFiltro(i.filtro)}
            activeOpacity={0.8}
            accessibilityLabel={`${i.rotulo}: ${i.valor}`}
          >
            <Text style={[styles.indicadorValor, i.destaque && styles.indicadorDestaque]}>{i.valor}</Text>
            <Text style={styles.indicadorRotulo} numberOfLines={1}>
              {i.rotulo}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {resumo.pedidosParticipacao > 0 && (
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Pedidos para participar ({resumo.pedidosParticipacao})</Text>
          <PedidosParticipacao atualizar={atualizar} onContagem={(n) => n !== resumo.pedidosParticipacao && carregar()} />
        </View>
      )}

      {novos.length > 0 && (
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Chegaram nos últimos {resumo.diasNovo} dias</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.novos}>
            {novos.map((u) => (
              <TouchableOpacity key={u.id} style={styles.novo} onPress={() => abrir(u)} activeOpacity={0.8}>
                <Avatar name={u.nome} foto={u.fotoUrl} size="lg" />
                <Text style={styles.novoNome} numberOfLines={1}>
                  {u.nome.split(' ')[0]}
                </Text>
                <Text style={styles.novoData}>{data(u.entrouEm)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Todos os usuários</Text>
        <Input
          placeholder="Buscar por nome ou unidade"
          value={busca}
          onChangeText={setBusca}
          leftIcon={<Ionicons name="search" size={18} color={colors.mutedSlate} />}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros}>
          {FILTROS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filtro, filtro === f.id && styles.filtroAtivo]}
              onPress={() => setFiltro(f.id)}
              accessibilityState={{ selected: filtro === f.id }}
            >
              <Text style={[styles.filtroTexto, filtro === f.id && styles.filtroTextoAtivo]}>{f.nome}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {lista.length === 0 ? (
          <Text style={styles.vazio}>Nenhum usuário neste filtro.</Text>
        ) : (
          lista.map((u) => (
            <TouchableOpacity key={u.id} style={styles.linha} onPress={() => abrir(u)} activeOpacity={0.8}>
              <Avatar name={u.nome} foto={u.fotoUrl} size="md" />
              <View style={styles.linhaTexto}>
                <Text style={styles.linhaNome} numberOfLines={1}>
                  {u.nome}
                </Text>
                <Text style={styles.linhaDetalhe} numberOfLines={1}>
                  {u.unidade} · {STATUS_LABELS[u.tipo]}
                  {u.origem === 'PARTICIPANTE' ? ` · mora no ${u.condominioOrigem}` : ''}
                </Text>
                <View style={styles.selos}>
                  {u.novo && <Selo texto="Novo" cor={colors.accent} />}
                  {u.situacao === 'SUSPENSO' && (
                    <Selo texto={`Suspenso${u.bloqueio?.ate ? ` até ${data(u.bloqueio.ate)}` : ''}`} cor="#C4320A" />
                  )}
                  {u.situacao === 'BANIDO' && <Selo texto="Banido" cor="#B42318" />}
                  {u.advertencias > 0 && (
                    <Selo texto={`${u.advertencias} ${u.advertencias === 1 ? 'advertência' : 'advertências'}`} cor="#B54708" />
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Detalhe do usuário e ações do síndico */}
      {aberto && (
        <Modal visible animationType="slide" transparent onRequestClose={fechar}>
          <TouchableOpacity style={styles.overlay} onPress={fechar} activeOpacity={1}>
            <View style={styles.modal} onStartShouldSetResponder={() => true}>
              <ScrollView contentContainerStyle={styles.modalCorpo} keyboardShouldPersistTaps="handled">
                <View style={styles.modalTopo}>
                  <Avatar name={aberto.nome} foto={aberto.fotoUrl} size="lg" />
                  <View style={styles.linhaTexto}>
                    <Text style={styles.modalNome}>{aberto.nome}</Text>
                    <Text style={styles.linhaDetalhe}>
                      {aberto.unidade} · {STATUS_LABELS[aberto.tipo]}
                    </Text>
                    <Text style={styles.linhaDetalhe}>
                      {aberto.origem === 'PARTICIPANTE' ? `Participa desde ${data(aberto.entrouEm)} · mora no ${aberto.condominioOrigem}` : `Cadastrado em ${data(aberto.entrouEm)}`}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={fechar} accessibilityLabel="Fechar">
                    <Ionicons name="close" size={24} color={colors.mutedSlate} />
                  </TouchableOpacity>
                </View>

                {aberto.bloqueio && (
                  <View style={styles.bloqueio}>
                    <Text style={styles.bloqueioTitulo}>
                      {aberto.situacao === 'BANIDO'
                        ? 'Banido deste condomínio'
                        : `Suspenso até ${aberto.bloqueio.ate ? dataHora(aberto.bloqueio.ate) : '—'}`}
                    </Text>
                    <Text style={styles.bloqueioMotivo}>Motivo: {aberto.bloqueio.motivo}</Text>
                  </View>
                )}

                <Text style={styles.rotulo}>Histórico de sanções</Text>
                {historico === null ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : historico.length === 0 ? (
                  <Text style={styles.linhaDetalhe}>Nenhuma sanção registrada.</Text>
                ) : (
                  historico.map((s) => (
                    <View key={s.id} style={styles.historico}>
                      <Ionicons name={TEXTO_SANCAO[s.tipo].icone} size={16} color={TEXTO_SANCAO[s.tipo].cor} />
                      <View style={styles.linhaTexto}>
                        <Text style={styles.historicoTitulo}>
                          {TEXTO_SANCAO[s.tipo].nome} · {data(s.criadoEm)}
                          {s.tipo === 'SUSPENSAO' && s.ate ? ` até ${data(s.ate)}` : ''}
                          {s.revogadaEm ? ` (encerrada em ${data(s.revogadaEm)})` : ''}
                        </Text>
                        <Text style={styles.linhaDetalhe}>{s.motivo}</Text>
                      </View>
                    </View>
                  ))
                )}

                {!podeModerar(aberto) ? (
                  <Text style={styles.aviso}>
                    {aberto.id === eu?.id ? 'Você não pode aplicar sanções a si mesmo.' : 'Síndicos não recebem sanções pelo painel.'}
                  </Text>
                ) : acao ? (
                  <View style={styles.form}>
                    <Text style={styles.rotulo}>
                      {acao === 'REATIVAR' ? 'Reativar acesso' : TEXTO_SANCAO[acao].nome}
                    </Text>
                    {acao === 'SUSPENSAO' && (
                      <View style={styles.dias}>
                        {DIAS_SUSPENSAO.map((d) => (
                          <TouchableOpacity
                            key={d}
                            style={[styles.filtro, dias === d && styles.filtroAtivo]}
                            onPress={() => setDias(d)}
                            accessibilityState={{ selected: dias === d }}
                          >
                            <Text style={[styles.filtroTexto, dias === d && styles.filtroTextoAtivo]}>
                              {d} {d === 1 ? 'dia' : 'dias'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    <Input
                      label={acao === 'REATIVAR' ? 'Justificativa (opcional)' : 'Motivo (o usuário vai ler este texto)'}
                      placeholder={acao === 'REATIVAR' ? 'Por que reativar?' : 'Explique o que aconteceu'}
                      value={motivo}
                      onChangeText={setMotivo}
                      multiline
                    />
                    {acao !== 'ADVERTENCIA' && acao !== 'REATIVAR' && (
                      <Text style={styles.ajuda}>Os anúncios ativos dele são pausados e ele não acessa este condomínio enquanto durar.</Text>
                    )}
                    <Button
                      title={
                        acao === 'REATIVAR'
                          ? 'Reativar acesso'
                          : acao === 'ADVERTENCIA'
                            ? 'Registrar advertência'
                            : acao === 'SUSPENSAO'
                              ? `Suspender por ${dias} ${dias === 1 ? 'dia' : 'dias'}`
                              : 'Banir do condomínio'
                      }
                      variant={acao === 'BANIMENTO' ? 'danger' : 'primary'}
                      onPress={confirmar}
                      loading={enviando}
                      fullWidth
                    />
                    <Button title="Voltar" variant="ghost" onPress={() => setAcao(null)} fullWidth />
                  </View>
                ) : (
                  <View style={styles.acoes}>
                    {aberto.situacao !== 'ATIVO' && (
                      <Button title="Reativar acesso" onPress={() => setAcao('REATIVAR')} fullWidth />
                    )}
                    <Button title="Advertir" variant="outline" onPress={() => setAcao('ADVERTENCIA')} fullWidth />
                    {aberto.situacao === 'ATIVO' && (
                      <Button title="Suspender" variant="secondary" onPress={() => setAcao('SUSPENSAO')} fullWidth />
                    )}
                    {aberto.situacao !== 'BANIDO' && (
                      <Button title="Banir" variant="danger" onPress={() => setAcao('BANIMENTO')} fullWidth />
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const Selo = ({ texto, cor }: { texto: string; cor: string }) => (
  <View style={[styles.selo, { borderColor: cor }]}>
    <Text style={[styles.seloTexto, { color: cor }]}>{texto}</Text>
  </View>
);

const styles = StyleSheet.create({
  carregando: { marginTop: spacing.xl },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  indicador: {
    width: '31.5%',
    padding: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  indicadorAtivo: { borderColor: colors.accent },
  indicadorValor: { fontFamily: typography.displaySmall.fontFamily, fontSize: 22, color: colors.primary },
  indicadorDestaque: { color: colors.accent },
  indicadorRotulo: { fontFamily: typography.bodySmall.fontFamily, fontSize: 12, color: colors.textSecondary },
  secao: {
    marginTop: spacing.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secaoTitulo: { fontFamily: typography.labelLarge.fontFamily, fontSize: 15, color: colors.primary },
  novos: { gap: spacing.md },
  novo: { alignItems: 'center', width: 64 },
  novoNome: { fontFamily: typography.labelSmall.fontFamily, fontSize: 12, color: colors.textPrimary, marginTop: 4 },
  novoData: { fontFamily: typography.bodySmall.fontFamily, fontSize: 11, color: colors.textMuted },
  filtros: { gap: spacing.xs },
  filtro: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filtroAtivo: { backgroundColor: colors.accent, borderColor: colors.accent },
  filtroTexto: { fontFamily: typography.labelSmall.fontFamily, fontSize: 13, color: colors.textSecondary },
  filtroTextoAtivo: { color: colors.textOnAccent },
  vazio: { fontFamily: typography.bodyMedium.fontFamily, fontSize: 14, color: colors.textSecondary, paddingVertical: spacing.md },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  linhaTexto: { flex: 1, gap: 2 },
  linhaNome: { fontFamily: typography.labelMedium.fontFamily, fontSize: 15, color: colors.textPrimary },
  linhaDetalhe: { fontFamily: typography.bodySmall.fontFamily, fontSize: 13, color: colors.textSecondary },
  selos: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  selo: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: borderRadius.full, borderWidth: 1 },
  seloTexto: { fontFamily: typography.labelSmall.fontFamily, fontSize: 11 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modal: {
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  modalCorpo: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  modalTopo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  modalNome: { fontFamily: typography.displaySmall.fontFamily, fontSize: 20, color: colors.primary },
  bloqueio: { padding: spacing.sm + 4, borderRadius: borderRadius.md, backgroundColor: '#FEF3F2', borderWidth: 1, borderColor: '#FECDCA' },
  bloqueioTitulo: { fontFamily: typography.labelMedium.fontFamily, fontSize: 14, color: '#B42318' },
  bloqueioMotivo: { fontFamily: typography.bodySmall.fontFamily, fontSize: 13, color: colors.textPrimary, marginTop: 2 },
  rotulo: {
    fontFamily: typography.labelSmall.fontFamily,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  historico: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: 4 },
  historicoTitulo: { fontFamily: typography.labelSmall.fontFamily, fontSize: 13, color: colors.textPrimary },
  aviso: { fontFamily: typography.bodyMedium.fontFamily, fontSize: 14, color: colors.textSecondary, marginTop: spacing.md },
  form: { gap: spacing.sm, marginTop: spacing.sm },
  dias: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  ajuda: { fontFamily: typography.bodySmall.fontFamily, fontSize: 12, color: colors.textSecondary },
  acoes: { gap: spacing.sm, marginTop: spacing.md },
});
