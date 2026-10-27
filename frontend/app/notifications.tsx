import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { Notificacao, TipoNotificacao } from '../types';
import { colors } from '../constants/design';

// Avisos internos do aplicativo (RNF01). Não há push: a lista é carregada ao abrir a tela
// e ao puxar para baixo.

const ICONES: Record<TipoNotificacao, keyof typeof Ionicons.glyphMap> = {
  NOVO_PEDIDO: 'bag-handle-outline',
  PEDIDO_VINCULO: 'person-add-outline',
  VINCULO_APROVADO: 'business-outline',
  VINCULO_RECUSADO: 'business-outline',
  STATUS_PEDIDO: 'cube-outline',
  PEDIDO_CANCELADO: 'close-circle-outline',
  ANUNCIO_QUARENTENA: 'alert-circle-outline',
  ANUNCIO_RESTAURADO: 'checkmark-circle-outline',
  DENUNCIA_PARA_ANALISE: 'shield-outline',
};

const quandoFoi = (data: string) => {
  const minutos = Math.floor((Date.now() - new Date(data).getTime()) / 60000);
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { isSindico } = useAuth();
  const { getNotificacoes, marcarNotificacaoLida, marcarTodasNotificacoesLidas } = useApi();

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const resposta = await getNotificacoes({ limite: 50 });
      setNotificacoes(resposta.notificacoes);
      setNaoLidas(resposta.naoLidas);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível carregar os avisos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getNotificacoes]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  const abrir = async (aviso: Notificacao) => {
    if (!aviso.lida) {
      setNotificacoes(prev => prev.map(n => (n.id === aviso.id ? { ...n, lida: true } : n)));
      setNaoLidas(n => Math.max(0, n - 1));
      marcarNotificacaoLida(aviso.id).catch(() => undefined);
    }

    if (aviso.entidadeTipo === 'PEDIDO' && aviso.entidadeId) {
      router.push(`/order/${aviso.entidadeId}`);
    } else if (aviso.tipo === 'DENUNCIA_PARA_ANALISE' && isSindico) {
      router.push('/(tabs)/moderator');
    } else if (aviso.tipo === 'PEDIDO_VINCULO' && isSindico) {
      router.push({ pathname: '/(tabs)/moderator', params: { aba: 'MORADORES' } });
    } else if (aviso.tipo === 'VINCULO_APROVADO' || aviso.tipo === 'VINCULO_RECUSADO') {
      router.push('/condominios');
    } else if (aviso.entidadeTipo === 'PRODUTO' && aviso.entidadeId) {
      router.push(`/product/${aviso.entidadeId}`);
    }
  };

  const marcarTodas = async () => {
    try {
      await marcarTodasNotificacoesLidas();
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
      setNaoLidas(0);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível marcar os avisos');
    }
  };

  const renderAviso = ({ item }: { item: Notificacao }) => (
    <TouchableOpacity
      style={[styles.aviso, !item.lida && styles.avisoNaoLido]}
      onPress={() => abrir(item)}
      activeOpacity={0.8}
      accessibilityLabel={`${item.lida ? '' : 'Não lido. '}${item.mensagem}`}
    >
      <View style={[styles.icone, !item.lida && styles.iconeNaoLido]}>
        <Ionicons name={ICONES[item.tipo] || 'notifications-outline'} size={22} color={item.lida ? colors.mutedSlate : colors.accent} />
      </View>
      <View style={styles.texto}>
        <Text style={[styles.mensagem, !item.lida && styles.mensagemNaoLida]}>{item.mensagem}</Text>
        <Text style={styles.data}>{quandoFoi(item.criadoEm)}</Text>
      </View>
      {!item.lida && <View style={styles.ponto} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Avisos</Text>
        {naoLidas > 0 ? (
          <TouchableOpacity onPress={marcarTodas}>
            <Text style={styles.marcarTodas}>Marcar todos</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notificacoes}
          keyExtractor={(item) => item.id}
          renderItem={renderAviso}
          contentContainerStyle={notificacoes.length === 0 ? styles.listaVazia : styles.lista}
          ItemSeparatorComponent={() => <View style={styles.separador} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.centro}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.borderStrong} />
              <Text style={styles.vazio}>Nenhum aviso por enquanto</Text>
              <Text style={styles.vazioSub}>Novos pedidos e mudanças de status aparecem aqui.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EFF5',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E3A5F' },
  marcarTodas: { fontSize: 14, fontWeight: '600', color: colors.accent },
  lista: { padding: 16 },
  listaVazia: { flexGrow: 1, padding: 16 },
  separador: { height: 8 },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avisoNaoLido: { borderColor: '#F0D3C8', backgroundColor: '#FFF9F6' },
  icone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.morningFog,
  },
  iconeNaoLido: { backgroundColor: '#FBE7DF' },
  texto: { flex: 1, gap: 4 },
  mensagem: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  mensagemNaoLida: { color: colors.textPrimary, fontWeight: '600' },
  data: { fontSize: 12, color: colors.textMuted },
  ponto: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 32 },
  vazio: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  vazioSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});
