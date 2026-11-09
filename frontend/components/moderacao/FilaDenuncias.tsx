import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../hooks/useApi';
import { Button, Input, AvisoQuarentena, ProductImage } from '../ui';
import { Carregando, Vazio, Falha, Chips, dataHora } from './Estado';
import { STATUS_LABELS } from '../../constants';
import { Denuncia, FilaDenuncias as Fila, Produto, ProdutoDenunciado } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../constants/design';

// Aba "Denúncias" da moderação: um cartão por anúncio denunciado (e não um por denúncia),
// com os em quarentena primeiro. Ao abrir, o síndico lê os motivos (sem saber quem denunciou)
// e decide: restaurar, manter ou colocar em quarentena. Toda decisão vai para a auditoria.

type Filtro = 'QUARENTENA' | 'VITRINE' | 'TODOS';
type Acao = 'QUARENTENA' | 'RESTAURAR';

interface Props {
  atualizar: number;
  onResumo?: (emQuarentena: number) => void;
}

const VERMELHO = '#B42318';

export function FilaDenuncias({ atualizar, onResumo }: Props) {
  const router = useRouter();
  const { getFilaDenuncias, getDenunciasProduto, getProduto, updateDenunciaStatus } = useApi();

  const [fila, setFila] = useState<Fila | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('TODOS');

  const [aberto, setAberto] = useState<ProdutoDenunciado | null>(null);
  const [produto, setProduto] = useState<Produto | null>(null);
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [acao, setAcao] = useState<Acao | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const resposta = await getFilaDenuncias();
      setFila(resposta);
      setErro(null);
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível carregar as denúncias.');
    }
  }, [getFilaDenuncias]);

  useEffect(() => {
    carregar();
  }, [carregar, atualizar]);

  // Avisa a tela (contador da aba) depois de renderizar, nunca durante
  useEffect(() => {
    if (fila) onResumo?.(fila.resumo.emQuarentena);
  }, [fila, onResumo]);

  const abrir = async (item: ProdutoDenunciado) => {
    setAberto(item);
    setProduto(null);
    setDenuncias([]);
    setAcao(null);
    setJustificativa('');
    setCarregandoDetalhe(true);
    try {
      const [d, p] = await Promise.all([getDenunciasProduto(item.produto.id), getProduto(item.produto.id)]);
      setDenuncias(d.denuncias);
      setProduto(p.produto);
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Não foi possível abrir o anúncio.');
    } finally {
      setCarregandoDetalhe(false);
    }
  };

  const fechar = () => {
    setAberto(null);
    setAcao(null);
  };

  const status = produto?.status ?? aberto?.produto.status;
  const emQuarentena = status === 'QUARENTENA';

  const confirmar = async () => {
    if (!aberto || !acao) return;
    // Motivo obrigatório só para tirar da vitrine; para manter, vale o motivo automático
    if (acao === 'QUARENTENA' && !emQuarentena && justificativa.trim().length < 5) {
      Alert.alert('Motivo obrigatório', 'Explique o motivo da quarentena (mínimo 5 caracteres). O vendedor vai ler este texto.');
      return;
    }
    setEnviando(true);
    try {
      await updateDenunciaStatus(aberto.produto.id, { acao, justificativa: justificativa.trim() || undefined });
      fechar();
      await carregar();
      Alert.alert(
        'Decisão registrada',
        acao === 'RESTAURAR'
          ? 'O anúncio voltou para a vitrine e o vendedor foi avisado.'
          : 'O anúncio está em quarentena e o vendedor recebeu o motivo.',
      );
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Não foi possível registrar a decisão.');
    } finally {
      setEnviando(false);
    }
  };

  if (!fila && !erro) return <Carregando />;

  const lista = (fila?.produtos ?? []).filter((p) =>
    filtro === 'TODOS' ? true : filtro === 'QUARENTENA' ? p.produto.status === 'QUARENTENA' : p.produto.status !== 'QUARENTENA',
  );

  return (
    <View>
      {erro ? <Falha mensagem={erro} onTentar={carregar} /> : null}

      {fila ? (
        <Chips<Filtro>
          valor={filtro}
          onChange={setFiltro}
          opcoes={[
            { id: 'TODOS', nome: 'Todos', total: fila.produtos.length },
            { id: 'QUARENTENA', nome: 'Em quarentena', total: fila.resumo.emQuarentena },
            { id: 'VITRINE', nome: 'Na vitrine', total: fila.resumo.naVitrine },
          ]}
        />
      ) : null}

      {fila && lista.length === 0 ? (
        <Vazio
          icone="shield-checkmark-outline"
          cor={colors.success}
          titulo={filtro === 'TODOS' ? 'Nenhuma denúncia' : 'Nada neste filtro'}
          texto={filtro === 'TODOS' ? 'Tudo tranquilo no condomínio.' : undefined}
        />
      ) : null}

      {lista.map((item) => {
        const suspenso = item.produto.status === 'QUARENTENA';
        return (
          <TouchableOpacity
            key={item.produto.id}
            style={[styles.card, suspenso && styles.cardSuspenso]}
            onPress={() => abrir(item)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`${item.produto.nome}, ${item.totalDenuncias} denúncias`}
          >
            <View style={styles.cardTopo}>
              <ProductImage url={item.produto.imagemUrl} style={styles.foto} iconSize={20} />
              <View style={styles.cardTexto}>
                <Text style={styles.nome} numberOfLines={1}>{item.produto.nome}</Text>
                <Text style={styles.vendedor} numberOfLines={1}>
                  {item.produto.vendedor ? `${item.produto.vendedor.nome} · ${item.produto.vendedor.unidade}` : 'Vendedor'}
                </Text>
                <View style={styles.selos}>
                  <View style={[styles.selo, { backgroundColor: corDoStatus(item.produto.status) }]}>
                    <Text style={styles.seloTexto}>{STATUS_LABELS[item.produto.status] ?? item.produto.status}</Text>
                  </View>
                  <View style={styles.contagem}>
                    <Ionicons name="flag" size={12} color={VERMELHO} />
                    <Text style={styles.contagemTexto}>
                      {item.totalDenuncias} {item.totalDenuncias === 1 ? 'denúncia' : 'denúncias'}
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>

            <Text style={styles.motivo} numberOfLines={2}>"{item.motivos[0]}"</Text>
            <Text style={styles.data}>
              {suspenso && item.totalDenuncias >= 3 ? 'Suspenso automaticamente · ' : ''}
              Última denúncia em {dataHora(item.ultimaDenuncia)}
            </Text>
          </TouchableOpacity>
        );
      })}

      <Modal visible={!!aberto} animationType="slide" transparent onRequestClose={fechar}>
        <View style={styles.fundo}>
          <TouchableOpacity style={styles.fundoToque} activeOpacity={1} onPress={fechar} accessibilityLabel="Fechar" />
          <View style={styles.modal}>
            <View style={styles.modalTopo}>
              <Text style={styles.modalTitulo} numberOfLines={2}>{aberto?.produto.nome}</Text>
              <TouchableOpacity onPress={fechar} accessibilityLabel="Fechar" hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.mutedSlate} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalCorpo} keyboardShouldPersistTaps="handled">
              {carregandoDetalhe ? (
                <ActivityIndicator color={colors.primary} style={{ paddingVertical: spacing.lg }} />
              ) : (
                <>
                  {emQuarentena && produto ? <AvisoQuarentena quarentena={produto.quarentena} para="sindico" /> : null}

                  <Text style={styles.rotulo}>Denúncias recebidas ({denuncias.length})</Text>
                  <Text style={styles.ajuda}>Quem denunciou não é identificado, nem para o síndico.</Text>
                  {denuncias.map((d) => (
                    <View key={d.id} style={styles.denuncia}>
                      <Text style={styles.denunciaMotivo}>"{d.motivo}"</Text>
                      <Text style={styles.data}>{dataHora(d.criadoEm)}</Text>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.verAnuncio}
                    onPress={() => {
                      const id = aberto?.produto.id;
                      fechar();
                      if (id) router.push(`/product/${id}`);
                    }}
                  >
                    <Ionicons name="open-outline" size={16} color={colors.accent} />
                    <Text style={styles.verAnuncioTexto}>Ver o anúncio</Text>
                  </TouchableOpacity>

                  {acao ? (
                    <View style={styles.acoes}>
                      <Input
                        label={
                          acao === 'RESTAURAR'
                            ? 'Justificativa (opcional)'
                            : emQuarentena
                              ? 'Motivo (opcional; o vendedor vai ler)'
                              : 'Motivo da quarentena (o vendedor vai ler)'
                        }
                        placeholder={acao === 'RESTAURAR' ? 'Ex.: denúncias sem fundamento' : 'Ex.: produto vencido, foto enganosa...'}
                        value={justificativa}
                        onChangeText={setJustificativa}
                        multiline
                        maxLength={500}
                      />
                      <Button
                        title={acao === 'RESTAURAR' ? 'Confirmar restauração' : 'Confirmar quarentena'}
                        onPress={confirmar}
                        variant={acao === 'RESTAURAR' ? 'primary' : 'danger'}
                        loading={enviando}
                        fullWidth
                      />
                      <Button title="Voltar" onPress={() => setAcao(null)} variant="ghost" fullWidth />
                    </View>
                  ) : emQuarentena ? (
                    <View style={styles.acoes}>
                      <Button title="Restaurar anúncio" onPress={() => setAcao('RESTAURAR')} fullWidth />
                      <Button title="Manter em quarentena" onPress={() => setAcao('QUARENTENA')} variant="danger" fullWidth />
                    </View>
                  ) : (
                    <View style={styles.acoes}>
                      <Button title="Colocar em quarentena" onPress={() => setAcao('QUARENTENA')} variant="danger" fullWidth />
                      <Text style={styles.ajuda}>
                        Se as denúncias não procedem, não é preciso fazer nada: o anúncio continua na vitrine.
                      </Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const corDoStatus = (status: string) =>
  ({ ATIVO: '#2E7D32', PAUSADO: colors.mutedSlate, QUARENTENA: VERMELHO })[status] ?? colors.mutedSlate;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm + 4,
    gap: spacing.sm,
  },
  cardSuspenso: {
    borderColor: '#FECDCA',
  },
  cardTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  foto: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
  },
  cardTexto: {
    flex: 1,
    gap: 2,
  },
  nome: {
    fontFamily: typography.labelLarge.fontFamily,
    fontSize: 16,
    color: colors.primary,
  },
  vendedor: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
  },
  selos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  selo: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  seloTexto: {
    fontFamily: typography.labelSmall.fontFamily,
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },
  contagem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contagemTexto: {
    fontFamily: typography.labelMedium.fontFamily,
    fontSize: 12,
    color: VERMELHO,
  },
  motivo: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    color: colors.textPrimary,
  },
  data: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 12,
    color: colors.textMuted,
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
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitulo: {
    flex: 1,
    fontFamily: typography.displaySmall.fontFamily,
    fontSize: 19,
    color: colors.primary,
  },
  modalCorpo: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm + 2,
  },
  rotulo: {
    fontFamily: typography.labelLarge.fontFamily,
    fontSize: 15,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  ajuda: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  denuncia: {
    padding: spacing.sm + 4,
    borderRadius: borderRadius.md,
    backgroundColor: colors.creamPaper,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  denunciaMotivo: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    color: colors.textPrimary,
  },
  verAnuncio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
  },
  verAnuncioTexto: {
    fontFamily: typography.labelMedium.fontFamily,
    fontSize: 14,
    color: colors.accent,
  },
  acoes: {
    gap: spacing.sm + 2,
    marginTop: spacing.xs,
  },
});
