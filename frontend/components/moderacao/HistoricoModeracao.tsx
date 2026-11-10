import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../hooks/useApi';
import { Button } from '../ui';
import { Carregando, Vazio, Falha, dataHora } from './Estado';
import { LogAuditoria } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../constants/design';

// Aba "Histórico" da moderação: as decisões do síndico registradas no log de auditoria
// (quarentenas, restaurações, avaliações removidas, sanções e pedidos de participação),
// com a justificativa de cada uma. As simples consultas de denúncias ficam de fora.

interface Props {
  atualizar: number;
}

type Icone = keyof typeof Ionicons.glyphMap;

const ACOES: Record<string, { texto: string; icone: Icone; cor: string }> = {
  APLICAR_QUARENTENA: { texto: 'Anúncio em quarentena', icone: 'shield', cor: '#B42318' },
  RESTAURAR_PRODUTO: { texto: 'Anúncio restaurado', icone: 'shield-checkmark', cor: '#2E7D32' },
  REMOVER_AVALIACAO: { texto: 'Avaliação removida', icone: 'star-half', cor: '#B54708' },
  ADVERTIR_USUARIO: { texto: 'Advertência', icone: 'alert-circle', cor: '#B54708' },
  SUSPENDER_USUARIO: { texto: 'Suspensão', icone: 'pause-circle', cor: '#C4320A' },
  BANIR_USUARIO: { texto: 'Banimento', icone: 'ban', cor: '#B42318' },
  REATIVAR_USUARIO: { texto: 'Usuário reativado', icone: 'refresh-circle', cor: '#2E7D32' },
  APROVAR_VINCULO: { texto: 'Participação aprovada', icone: 'person-add', cor: '#2E7D32' },
  RECUSAR_VINCULO: { texto: 'Participação recusada', icone: 'person-remove', cor: '#B42318' },
  VISUALIZAR_DENUNCIAS: { texto: 'Consulta de denúncias', icone: 'eye', cor: colors.mutedSlate },
};

const descrever = (acao: string) =>
  ACOES[acao] ?? { texto: acao.replace(/_/g, ' ').toLowerCase(), icone: 'document-text' as Icone, cor: colors.mutedSlate };

export function HistoricoModeracao({ atualizar }: Props) {
  const { getHistoricoModeracao } = useApi();
  const [logs, setLogs] = useState<LogAuditoria[] | null>(null);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(
    async (paginaPedida = 1) => {
      try {
        const r = await getHistoricoModeracao(paginaPedida);
        setLogs((atual) => (paginaPedida === 1 ? r.logs : [...(atual ?? []), ...r.logs]));
        setPagina(r.paginacao.pagina);
        setTotalPaginas(r.paginacao.totalPaginas);
        setErro(null);
      } catch (e: any) {
        setErro(e?.message || 'Não foi possível carregar o histórico.');
      }
    },
    [getHistoricoModeracao],
  );

  useEffect(() => {
    carregar(1);
  }, [carregar, atualizar]);

  const carregarMais = async () => {
    setCarregandoMais(true);
    await carregar(pagina + 1);
    setCarregandoMais(false);
  };

  if (!logs && !erro) return <Carregando />;

  return (
    <View>
      {erro ? <Falha mensagem={erro} onTentar={() => carregar(1)} /> : null}

      <Text style={styles.intro}>
        Cada decisão de moderação fica registrada com a justificativa. O registro não pode ser apagado.
      </Text>

      {logs && logs.length === 0 ? (
        <Vazio icone="time-outline" titulo="Nenhuma decisão ainda" texto="Quarentenas, remoções e sanções aparecem aqui." />
      ) : null}

      {(logs ?? []).map((l, i) => {
        const acao = descrever(l.acao);
        const ultimo = i === (logs?.length ?? 0) - 1;
        return (
          <View key={l.id} style={styles.item}>
            <View style={styles.trilho}>
              <View style={[styles.icone, { backgroundColor: `${acao.cor}1A` }]}>
                <Ionicons name={acao.icone} size={16} color={acao.cor} />
              </View>
              {!ultimo ? <View style={styles.linha} /> : null}
            </View>
            <View style={styles.conteudo}>
              <Text style={styles.titulo}>{acao.texto}</Text>
              {l.entidadeNome ? <Text style={styles.entidade} numberOfLines={2}>{l.entidadeNome}</Text> : null}
              {l.justificativa ? <Text style={styles.justificativa}>"{l.justificativa}"</Text> : null}
              <Text style={styles.meta}>
                {dataHora(l.criadoEm)}
                {l.sindico?.nome ? ` · ${l.sindico.nome}` : ''}
              </Text>
            </View>
          </View>
        );
      })}

      {pagina < totalPaginas ? (
        <Button title="Carregar mais" onPress={carregarMais} loading={carregandoMais} variant="outline" fullWidth />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  item: {
    flexDirection: 'row',
    gap: spacing.sm + 4,
  },
  trilho: {
    alignItems: 'center',
    width: 32,
  },
  icone: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linha: {
    flex: 1,
    width: 2,
    marginVertical: 4,
    backgroundColor: colors.border,
  },
  conteudo: {
    flex: 1,
    paddingBottom: spacing.lg,
    gap: 2,
  },
  titulo: {
    fontFamily: typography.labelLarge.fontFamily,
    fontSize: 15,
    color: colors.primary,
    marginTop: 6,
  },
  entidade: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    color: colors.textPrimary,
  },
  justificativa: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    color: colors.textSecondary,
  },
  meta: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});
