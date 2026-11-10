import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { FilaDenuncias } from '../../components/moderacao/FilaDenuncias';
import { AvaliacoesModeracao } from '../../components/moderacao/AvaliacoesModeracao';
import { PainelUsuarios } from '../../components/moderacao/PainelUsuarios';
import { HistoricoModeracao } from '../../components/moderacao/HistoricoModeracao';
import { colors, spacing, typography, borderRadius } from '../../constants/design';

// Painel de moderação do síndico. Cada aba é um componente próprio (components/moderacao);
// a tela só cuida das abas, do "puxar para atualizar" e dos contadores.
// Uma aba visitada continua montada (só fica escondida), para não recarregar a cada troca.

type Aba = 'DENUNCIAS' | 'AVALIACOES' | 'USUARIOS' | 'HISTORICO';

const ABAS: { id: Aba; nome: string; icone: keyof typeof Ionicons.glyphMap; subtitulo: string }[] = [
  { id: 'DENUNCIAS', nome: 'Denúncias', icone: 'flag-outline', subtitulo: 'Anúncios denunciados pelos moradores' },
  { id: 'AVALIACOES', nome: 'Avaliações', icone: 'star-outline', subtitulo: 'Notas e comentários dos pedidos entregues' },
  { id: 'USUARIOS', nome: 'Usuários', icone: 'people-outline', subtitulo: 'Moradores, participantes e pedidos para participar' },
  { id: 'HISTORICO', nome: 'Histórico', icone: 'time-outline', subtitulo: 'Decisões registradas na auditoria' },
];

export default function ModeratorScreen() {
  const { isSindico } = useAuth();
  // Um aviso de pedido de participação abre direto na aba de usuários
  const params = useLocalSearchParams<{ aba?: string }>();
  const inicial: Aba = params.aba === 'USUARIOS' || params.aba === 'MORADORES' ? 'USUARIOS' : 'DENUNCIAS';

  const [aba, setAba] = useState<Aba>(inicial);
  const [visitadas, setVisitadas] = useState<Aba[]>([inicial]);
  const [atualizar, setAtualizar] = useState(0);
  const [atualizando, setAtualizando] = useState(false);
  const [emQuarentena, setEmQuarentena] = useState<number | null>(null);
  const [pendentes, setPendentes] = useState<number | null>(null);

  const trocarAba = (nova: Aba) => {
    setAba(nova);
    setVisitadas((v) => (v.includes(nova) ? v : [...v, nova]));
  };

  const aoPuxar = () => {
    setAtualizando(true);
    setAtualizar((n) => n + 1);
    // As abas recarregam sozinhas ao perceber a mudança; o indicador some logo
    setTimeout(() => setAtualizando(false), 600);
  };

  // Funções estáveis: as abas avisam os contadores dentro de efeitos, nunca durante a renderização
  const aoResumoDenuncias = useCallback((n: number) => setEmQuarentena(n), []);
  const aoPendentes = useCallback((n: number) => setPendentes(n), []);

  if (!isSindico) {
    return (
      <View style={styles.restrito}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.borderStrong} />
        <Text style={styles.restritoTexto}>Acesso restrito ao síndico</Text>
      </View>
    );
  }

  const contador = (id: Aba) => (id === 'DENUNCIAS' ? emQuarentena : id === 'USUARIOS' ? pendentes : null);
  const atual = ABAS.find((a) => a.id === aba)!;

  return (
    <ScrollView
      style={styles.tela}
      contentContainerStyle={styles.conteudo}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoPuxar} colors={[colors.primary]} />}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.titulo}>Moderação</Text>
      <Text style={styles.subtitulo}>{atual.subtitulo}</Text>

      <View style={styles.abas} accessibilityRole="tablist">
        {ABAS.map((a) => {
          const ativa = a.id === aba;
          const n = contador(a.id);
          return (
            <TouchableOpacity
              key={a.id}
              style={[styles.aba, ativa && styles.abaAtiva]}
              onPress={() => trocarAba(a.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: ativa }}
              accessibilityLabel={n ? `${a.nome}, ${n} pendentes` : a.nome}
            >
              <View>
                <Ionicons name={a.icone} size={18} color={ativa ? colors.primary : colors.mutedSlate} />
                {n ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeTexto}>{n > 9 ? '9+' : n}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.abaTexto, ativa && styles.abaTextoAtivo]} numberOfLines={1}>
                {a.nome}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {visitadas.includes('DENUNCIAS') ? (
        <View style={aba !== 'DENUNCIAS' && styles.escondida}>
          <FilaDenuncias atualizar={atualizar} onResumo={aoResumoDenuncias} />
        </View>
      ) : null}
      {visitadas.includes('AVALIACOES') ? (
        <View style={aba !== 'AVALIACOES' && styles.escondida}>
          <AvaliacoesModeracao atualizar={atualizar} />
        </View>
      ) : null}
      {visitadas.includes('USUARIOS') ? (
        <View style={aba !== 'USUARIOS' && styles.escondida}>
          <PainelUsuarios atualizar={atualizar} onPendentes={aoPendentes} />
        </View>
      ) : null}
      {visitadas.includes('HISTORICO') ? (
        <View style={aba !== 'HISTORICO' && styles.escondida}>
          <HistoricoModeracao atualizar={atualizar} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: colors.background,
  },
  conteudo: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 110,
  },
  titulo: {
    fontFamily: typography.displayMedium.fontFamily,
    fontSize: 26,
    color: colors.primary,
  },
  subtitulo: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  abas: {
    flexDirection: 'row',
    backgroundColor: colors.morningFog,
    borderRadius: borderRadius.md + 2,
    padding: 4,
    marginBottom: spacing.md,
  },
  aba: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  abaAtiva: {
    backgroundColor: colors.surface,
  },
  abaTexto: {
    fontFamily: typography.labelMedium.fontFamily,
    fontSize: 12,
    color: colors.mutedSlate,
  },
  abaTextoAtivo: {
    color: colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -12,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTexto: {
    fontFamily: typography.labelSmall.fontFamily,
    fontSize: 10,
    color: '#FFFFFF',
  },
  escondida: {
    display: 'none',
  },
  restrito: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  restritoTexto: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 16,
    color: colors.textSecondary,
  },
});
