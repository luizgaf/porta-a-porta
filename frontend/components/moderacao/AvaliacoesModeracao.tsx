import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../hooks/useApi';
import { Button, Input, Estrelas } from '../ui';
import { Carregando, Vazio, Falha, Chips, dataHora } from './Estado';
import { Avaliacao } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../constants/design';

// Aba "Avaliações" da moderação: todas as avaliações do condomínio, sem identificar quem avaliou.
// O síndico remove as abusivas com justificativa (vai para a auditoria); a avaliação some do
// anúncio e da média, mas continua aqui na lista de removidas.

type Filtro = 'VISIVEIS' | 'REMOVIDAS' | 'BAIXAS';

interface Props {
  atualizar: number;
}

const POR_PAGINA = 20;

export function AvaliacoesModeracao({ atualizar }: Props) {
  const { getAvaliacoes, deleteAvaliacao } = useApi();

  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[] | null>(null);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('VISIVEIS');

  const [removendo, setRemovendo] = useState<Avaliacao | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(
    async (paginaPedida = 1) => {
      try {
        const r = await getAvaliacoes({ pagina: paginaPedida, limite: POR_PAGINA });
        const novas = r.avaliacoes ?? [];
        setAvaliacoes((atual) => (paginaPedida === 1 ? novas : [...(atual ?? []), ...novas]));
        setPagina(r.paginacao.pagina);
        setTotalPaginas(r.paginacao.totalPaginas);
        setErro(null);
      } catch (e: any) {
        setErro(e?.message || 'Não foi possível carregar as avaliações.');
      }
    },
    [getAvaliacoes],
  );

  useEffect(() => {
    carregar(1);
  }, [carregar, atualizar]);

  const carregarMais = async () => {
    setCarregandoMais(true);
    await carregar(pagina + 1);
    setCarregandoMais(false);
  };

  const fechar = () => {
    setRemovendo(null);
    setJustificativa('');
  };

  const confirmarRemocao = async () => {
    if (!removendo) return;
    if (justificativa.trim().length < 5) {
      Alert.alert('Justificativa obrigatória', 'Explique o motivo da remoção (mínimo 5 caracteres).');
      return;
    }
    setEnviando(true);
    try {
      await deleteAvaliacao(removendo.id, justificativa.trim());
      const id = removendo.id;
      setAvaliacoes((lista) => (lista ?? []).map((a) => (a.id === id ? { ...a, removidaPor: 'sindico' } : a)));
      fechar();
      Alert.alert('Avaliação removida', 'Ela saiu do anúncio e da média. A remoção foi registrada no histórico.');
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Não foi possível remover a avaliação.');
    } finally {
      setEnviando(false);
    }
  };

  if (!avaliacoes && !erro) return <Carregando />;

  const todas = avaliacoes ?? [];
  const visiveis = todas.filter((a) => !a.removidaPor);
  const lista =
    filtro === 'REMOVIDAS'
      ? todas.filter((a) => a.removidaPor)
      : filtro === 'BAIXAS'
        ? visiveis.filter((a) => a.nota <= 2)
        : visiveis;
  const media = visiveis.length ? visiveis.reduce((s, a) => s + a.nota, 0) / visiveis.length : 0;

  return (
    <View>
      {erro ? <Falha mensagem={erro} onTentar={() => carregar(1)} /> : null}

      {visiveis.length > 0 ? (
        <View style={styles.resumo}>
          <Text style={styles.resumoMedia}>{media.toFixed(1).replace('.', ',')}</Text>
          <View style={styles.resumoTexto}>
            <Estrelas nota={media} tamanho={14} />
            <Text style={styles.resumoLegenda}>
              Média das {visiveis.length} avaliações visíveis do condomínio
            </Text>
          </View>
        </View>
      ) : null}

      {avaliacoes ? (
        <Chips<Filtro>
          valor={filtro}
          onChange={setFiltro}
          opcoes={[
            { id: 'VISIVEIS', nome: 'Visíveis', total: visiveis.length },
            { id: 'BAIXAS', nome: '1 e 2 estrelas', total: visiveis.filter((a) => a.nota <= 2).length },
            { id: 'REMOVIDAS', nome: 'Removidas', total: todas.length - visiveis.length },
          ]}
        />
      ) : null}

      {avaliacoes && lista.length === 0 ? (
        <Vazio
          icone="star-outline"
          titulo={filtro === 'REMOVIDAS' ? 'Nenhuma avaliação removida' : 'Nenhuma avaliação aqui'}
          texto={filtro === 'VISIVEIS' ? 'As avaliações dos pedidos entregues aparecem aqui.' : undefined}
        />
      ) : null}

      {lista.map((a) => {
        const removida = !!a.removidaPor;
        return (
          <View key={a.id} style={[styles.card, removida && styles.cardRemovido]}>
            <View style={styles.topo}>
              <Estrelas nota={a.nota} tamanho={16} />
              <Text style={styles.data}>{dataHora(a.criadoEm)}</Text>
            </View>
            <Text style={styles.produto} numberOfLines={1}>{a.produto?.nome ?? 'Produto'}</Text>
            {a.comentario ? (
              <Text style={styles.comentario}>"{a.comentario}"</Text>
            ) : (
              <Text style={styles.semComentario}>Sem comentário</Text>
            )}
            <View style={styles.rodape}>
              <Text style={styles.anonimo}>Avaliação anônima</Text>
              {removida ? (
                <View style={styles.removida}>
                  <Ionicons name="eye-off-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.removidaTexto}>Removida</Text>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setRemovendo(a)} style={styles.remover} accessibilityRole="button">
                  <Ionicons name="trash-outline" size={14} color="#B42318" />
                  <Text style={styles.removerTexto}>Remover</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}

      {pagina < totalPaginas ? (
        <Button title="Carregar mais" onPress={carregarMais} loading={carregandoMais} variant="outline" fullWidth />
      ) : null}

      <Modal visible={!!removendo} animationType="slide" transparent onRequestClose={fechar}>
        <View style={styles.fundo}>
          <TouchableOpacity style={styles.fundoToque} activeOpacity={1} onPress={fechar} accessibilityLabel="Fechar" />
          <View style={styles.modal}>
            <View style={styles.modalTopo}>
              <Text style={styles.modalTitulo}>Remover avaliação</Text>
              <TouchableOpacity onPress={fechar} accessibilityLabel="Fechar" hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.mutedSlate} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalCorpo} keyboardShouldPersistTaps="handled">
              {removendo ? (
                <View style={styles.citacao}>
                  <Estrelas nota={removendo.nota} tamanho={14} />
                  <Text style={styles.produto}>{removendo.produto?.nome}</Text>
                  {removendo.comentario ? <Text style={styles.comentario}>"{removendo.comentario}"</Text> : null}
                </View>
              ) : null}
              <Text style={styles.ajuda}>
                A avaliação sai do anúncio e da média do produto. A remoção não pode ser desfeita e fica no histórico.
              </Text>
              <Input
                label="Justificativa *"
                placeholder="Ex.: comentário ofensivo, conteúdo sem relação com o produto..."
                value={justificativa}
                onChangeText={setJustificativa}
                multiline
                maxLength={500}
              />
              <Button title="Confirmar remoção" onPress={confirmarRemocao} variant="danger" loading={enviando} fullWidth />
              <Button title="Cancelar" onPress={fechar} variant="ghost" fullWidth />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  resumo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  resumoMedia: {
    fontFamily: typography.displayMedium.fontFamily,
    fontSize: 32,
    color: colors.textPrimary,
  },
  resumoTexto: {
    flex: 1,
    gap: 4,
  },
  resumoLegenda: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm + 4,
    gap: 6,
  },
  cardRemovido: {
    opacity: 0.6,
  },
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  data: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 12,
    color: colors.textMuted,
  },
  produto: {
    fontFamily: typography.labelLarge.fontFamily,
    fontSize: 15,
    color: colors.primary,
  },
  comentario: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    color: colors.textPrimary,
  },
  semComentario: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 13,
    color: colors.textMuted,
  },
  rodape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  anonimo: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
  },
  removida: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removidaTexto: {
    fontFamily: typography.labelMedium.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
  },
  remover: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#FECDCA',
  },
  removerTexto: {
    fontFamily: typography.labelMedium.fontFamily,
    fontSize: 13,
    color: '#B42318',
  },
  fundo: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  fundoToque: {
    flex: 1,
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
  },
  modalTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitulo: {
    fontFamily: typography.displaySmall.fontFamily,
    fontSize: 19,
    color: colors.primary,
  },
  modalCorpo: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm + 4,
  },
  citacao: {
    padding: spacing.sm + 4,
    borderRadius: borderRadius.md,
    backgroundColor: colors.creamPaper,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  ajuda: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});
