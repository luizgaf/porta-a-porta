import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/design';

const PERFIS: { id: 'COMPRADOR' | 'VENDEDOR'; titulo: string; texto: string; icone: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'COMPRADOR', titulo: 'Quero comprar', texto: 'Ver a vitrine e fazer pedidos aos vizinhos.', icone: 'bag-handle-outline' },
  { id: 'VENDEDOR', titulo: 'Quero vender', texto: 'Anunciar até 15 produtos e receber pedidos.', icone: 'storefront-outline' },
];

export default function RoleSelectionScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
      <AuthHeader
        titulo="Como você vai usar o app?"
        subtitulo="Escolha o perfil da sua conta neste condomínio."
        etapa={{ atual: 1, total: 3 }}
        onVoltar={() => router.back()}
      />

      <View style={styles.opcoes}>
        {PERFIS.map((perfil) => (
          <TouchableOpacity
            key={perfil.id}
            style={styles.opcao}
            onPress={() => router.push(`/(auth)/community-selection?role=${perfil.id}`)}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <View style={styles.opcaoIcone}>
              <Ionicons name={perfil.icone} size={26} color={colors.primary} />
            </View>
            <View style={styles.opcaoTexto}>
              <Text style={styles.opcaoTitulo}>{perfil.titulo}</Text>
              <Text style={styles.opcaoDescricao}>{perfil.texto}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
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
  opcoes: {
    gap: spacing.md,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  opcaoIcone: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.morningFog,
  },
  opcaoTexto: {
    flex: 1,
    gap: 2,
  },
  opcaoTitulo: {
    fontFamily: typography.labelLarge.fontFamily,
    fontSize: 16,
    color: colors.textPrimary,
  },
  opcaoDescricao: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.bodyMedium.fontSize,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
