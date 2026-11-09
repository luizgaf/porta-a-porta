import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../constants/design';

// Estados comuns das abas da moderação: carregando, lista vazia e falha ao carregar.
// A falha aparece na tela com "Tentar de novo", em vez de console.error, que no app em
// desenvolvimento abre o aviso vermelho do React Native a cada tentativa.

export function Carregando() {
  return <ActivityIndicator size="large" color={colors.primary} style={styles.carregando} />;
}

interface VazioProps {
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  texto?: string;
  cor?: string;
}

export function Vazio({ icone, titulo, texto, cor = colors.textMuted }: VazioProps) {
  return (
    <View style={styles.vazio}>
      <Ionicons name={icone} size={44} color={cor} />
      <Text style={styles.vazioTitulo}>{titulo}</Text>
      {texto ? <Text style={styles.vazioTexto}>{texto}</Text> : null}
    </View>
  );
}

export function Falha({ mensagem, onTentar }: { mensagem: string; onTentar: () => void }) {
  return (
    <View style={styles.falha}>
      <Ionicons name="cloud-offline-outline" size={22} color="#B42318" />
      <Text style={styles.falhaTexto}>{mensagem}</Text>
      <TouchableOpacity onPress={onTentar} style={styles.falhaBotao} accessibilityRole="button">
        <Text style={styles.falhaBotaoTexto}>Tentar de novo</Text>
      </TouchableOpacity>
    </View>
  );
}

interface ChipsProps<T extends string> {
  opcoes: { id: T; nome: string; total?: number }[];
  valor: T;
  onChange: (id: T) => void;
}

// Filtros em forma de "pílula", com a contagem ao lado do nome
export function Chips<T extends string>({ opcoes, valor, onChange }: ChipsProps<T>) {
  return (
    <View style={styles.chips}>
      {opcoes.map((o) => {
        const ativo = o.id === valor;
        return (
          <TouchableOpacity
            key={o.id}
            style={[styles.chip, ativo && styles.chipAtivo]}
            onPress={() => onChange(o.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: ativo }}
          >
            <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>
              {o.nome}
              {o.total !== undefined ? ` · ${o.total}` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export const dataCurta = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

export const dataHora = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

const styles = StyleSheet.create({
  carregando: {
    paddingVertical: spacing.xl,
  },
  vazio: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  vazioTitulo: {
    fontFamily: typography.labelLarge.fontFamily,
    fontSize: 16,
    color: colors.textPrimary,
  },
  vazioTexto: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  falha: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECDCA',
    marginBottom: spacing.md,
  },
  falhaTexto: {
    flex: 1,
    minWidth: 160,
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 14,
    color: '#912018',
  },
  falhaBotao: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECDCA',
  },
  falhaBotaoTexto: {
    fontFamily: typography.labelMedium.fontFamily,
    fontSize: 13,
    color: '#B42318',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  chipAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipTexto: {
    fontFamily: typography.labelMedium.fontFamily,
    fontSize: 13,
    color: colors.textPrimary,
  },
  chipTextoAtivo: {
    color: colors.textOnPrimary,
  },
});
