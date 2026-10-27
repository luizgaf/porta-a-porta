import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../../hooks/useApi';
import { Button, Input } from '../ui';
import { STATUS_LABELS } from '../../constants';
import { PedidoVinculo } from '../../types';
import { colors, spacing, typography, borderRadius } from '../../constants/design';

// Aba "Moradores" do painel do síndico: pedidos de pessoas de outros condomínios para participar
// deste. O síndico aprova escolhendo o perfil (só comprar ou também vender) ou recusa com motivo.
// As decisões vão para o log de auditoria.

interface Props {
  // Muda a cada "puxar para atualizar" da tela de moderação
  atualizar: number;
  onContagem?: (total: number) => void;
}

export function PedidosParticipacao({ atualizar, onContagem }: Props) {
  const { getPedidosParticipacao, decidirParticipacao } = useApi();
  const [pedidos, setPedidos] = useState<PedidoVinculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState<string | null>(null);
  const [recusando, setRecusando] = useState<PedidoVinculo | null>(null);
  const [motivo, setMotivo] = useState('');

  const carregar = useCallback(async () => {
    try {
      const resposta = await getPedidosParticipacao();
      setPedidos(resposta.pedidos);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível carregar os pedidos');
    } finally {
      setCarregando(false);
    }
  }, [getPedidosParticipacao]);

  useEffect(() => {
    carregar();
  }, [carregar, atualizar]);

  // Avisa a tela de moderação depois que a lista muda. Chamar onContagem dentro do setPedidos
  // atualizava a outra tela durante a renderização (erro "Cannot update a component while rendering")
  useEffect(() => {
    if (!carregando) onContagem?.(pedidos.length);
  }, [pedidos, carregando, onContagem]);

  const remover = (id: string) => {
    setPedidos((lista) => lista.filter((p) => p.id !== id));
  };

  const aprovar = async (pedido: PedidoVinculo, tipo: 'COMPRADOR' | 'VENDEDOR') => {
    setProcessando(pedido.id);
    try {
      await decidirParticipacao(pedido.id, { aprovar: true, tipo });
      remover(pedido.id);
      Alert.alert('Participação aprovada', `${pedido.nome} agora participa como ${STATUS_LABELS[tipo].toLowerCase()}.`);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível aprovar');
    } finally {
      setProcessando(null);
    }
  };

  const confirmarRecusa = async () => {
    if (!recusando) return;
    if (motivo.trim().length < 5) {
      Alert.alert('Motivo obrigatório', 'Explique o motivo da recusa (mínimo 5 caracteres).');
      return;
    }
    setProcessando(recusando.id);
    try {
      await decidirParticipacao(recusando.id, { aprovar: false, justificativa: motivo.trim() });
      remover(recusando.id);
      setRecusando(null);
      setMotivo('');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível recusar');
    } finally {
      setProcessando(null);
    }
  };

  if (carregando) {
    return <ActivityIndicator size="large" color={colors.primary} style={styles.carregando} />;
  }

  if (pedidos.length === 0) {
    return (
      <View style={styles.vazio}>
        <Ionicons name="people-outline" size={48} color={colors.textMuted} />
        <Text style={styles.vazioTitulo}>Nenhum pedido pendente</Text>
        <Text style={styles.vazioTexto}>Pessoas de outros condomínios que pedirem para participar deste aparecem aqui.</Text>
      </View>
    );
  }

  return (
    <View style={styles.lista}>
      {pedidos.map((p) => (
        <View key={p.id} style={styles.card}>
          <View style={styles.topo}>
            <Text style={styles.nome}>{p.nome}</Text>
            <Text style={styles.data}>{new Date(p.criadoEm).toLocaleDateString('pt-BR')}</Text>
          </View>
          <Text style={styles.detalhe}>
            Unidade aqui: <Text style={styles.destaque}>{p.unidade}</Text>
          </Text>
          <Text style={styles.detalhe}>Mora em: {p.condominioOrigem}</Text>
          <Text style={styles.detalhe}>
            Pediu para: <Text style={styles.destaque}>{p.tipoSolicitado === 'VENDEDOR' ? 'comprar e vender' : 'comprar'}</Text>
          </Text>

          {processando === p.id ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.carregandoAcao} />
          ) : (
            <View style={styles.acoes}>
              <Button title="Aprovar como comprador" size="sm" variant="outline" onPress={() => aprovar(p, 'COMPRADOR')} fullWidth />
              <Button title="Aprovar como vendedor" size="sm" onPress={() => aprovar(p, 'VENDEDOR')} fullWidth />
              <TouchableOpacity onPress={() => setRecusando(p)} style={styles.recusar}>
                <Text style={styles.recusarTexto}>Recusar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}

      {recusando && (
        <Modal visible animationType="slide" transparent onRequestClose={() => setRecusando(null)}>
          <TouchableOpacity style={styles.overlay} onPress={() => setRecusando(null)} activeOpacity={1}>
            <View style={styles.modal} onStartShouldSetResponder={() => true}>
              <View style={styles.modalTopo}>
                <Text style={styles.modalTitulo}>Recusar pedido de {recusando.nome}</Text>
                <TouchableOpacity onPress={() => setRecusando(null)} accessibilityLabel="Fechar">
                  <Ionicons name="close" size={24} color={colors.mutedSlate} />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={styles.modalCorpo} keyboardShouldPersistTaps="handled">
                <Input
                  label="Motivo (a pessoa recebe este texto)"
                  placeholder="Ex.: unidade não encontrada no cadastro do condomínio"
                  value={motivo}
                  onChangeText={setMotivo}
                  multiline
                />
                <Button title="Recusar pedido" variant="danger" onPress={confirmarRecusa} loading={!!processando} fullWidth />
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  carregando: { marginTop: spacing.xl },
  lista: { gap: spacing.sm },
  card: {
    gap: 4,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  nome: { fontFamily: typography.labelLarge.fontFamily, fontSize: 16, color: colors.textPrimary },
  data: { fontFamily: typography.bodySmall.fontFamily, fontSize: 12, color: colors.textMuted },
  detalhe: { fontFamily: typography.bodySmall.fontFamily, fontSize: 13, color: colors.textSecondary },
  destaque: { fontFamily: typography.labelMedium.fontFamily, color: colors.textPrimary },
  acoes: { gap: spacing.sm, marginTop: spacing.sm },
  carregandoAcao: { marginTop: spacing.sm },
  recusar: { alignItems: 'center', paddingVertical: spacing.xs },
  recusarTexto: { fontFamily: typography.labelMedium.fontFamily, fontSize: 14, color: colors.error },
  vazio: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  vazioTitulo: { fontFamily: typography.labelLarge.fontFamily, fontSize: 16, color: colors.textPrimary },
  vazioTexto: { fontFamily: typography.bodyMedium.fontFamily, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl },
  modalTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitulo: { flex: 1, fontFamily: typography.labelLarge.fontFamily, fontSize: 16, color: colors.primary },
  modalCorpo: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
});
