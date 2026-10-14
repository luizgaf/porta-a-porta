import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui';
import { colors, spacing, typography, borderRadius } from '../../constants/design';

const DESTAQUES: { icone: keyof typeof Ionicons.glyphMap; titulo: string; texto: string }[] = [
  { icone: 'storefront-outline', titulo: 'Vitrine dos vizinhos', texto: 'Produtos com foto e preço fixo, só do seu condomínio.' },
  { icone: 'bag-check-outline', titulo: 'Pedido na sua unidade', texto: 'Escolha o horário e receba na portaria ou na sua porta.' },
  { icone: 'shield-checkmark-outline', titulo: 'Comunidade moderada', texto: 'Denúncias anônimas analisadas pelo síndico.' },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
      <View>
        <View style={styles.marca}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.titulo}>Porta a Porta</Text>
        <Text style={styles.subtitulo}>O comércio do seu condomínio, organizado em um só lugar.</Text>

        <View style={styles.destaques}>
          {DESTAQUES.map((item) => (
            <View key={item.titulo} style={styles.destaque}>
              <View style={styles.destaqueIcone}>
                <Ionicons name={item.icone} size={22} color={colors.accent} />
              </View>
              <View style={styles.destaqueTexto}>
                <Text style={styles.destaqueTitulo}>{item.titulo}</Text>
                <Text style={styles.destaqueDescricao}>{item.texto}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.acoes}>
        <Button title="Criar conta" onPress={() => router.push('/(auth)/role-selection')} size="lg" fullWidth />
        <Button title="Já tenho conta" onPress={() => router.push('/(auth)/login')} variant="outline" size="lg" fullWidth />
        <Text style={styles.termos}>Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade.</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.xl,
  },
  marca: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  logo: {
    width: 64,
    height: 64,
  },
  titulo: {
    fontFamily: typography.displayLarge.fontFamily,
    fontSize: typography.displayLarge.fontSize,
    lineHeight: typography.displayLarge.lineHeight,
    letterSpacing: typography.displayLarge.letterSpacing,
    color: colors.primary,
  },
  subtitulo: {
    marginTop: spacing.sm,
    fontFamily: typography.bodyLarge.fontFamily,
    fontSize: 17,
    lineHeight: 26,
    color: colors.textSecondary,
  },
  destaques: {
    marginTop: spacing.xl,
    gap: spacing.lg,
  },
  destaque: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  destaqueIcone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6E7E1',
  },
  destaqueTexto: {
    flex: 1,
    gap: 2,
  },
  destaqueTitulo: {
    fontFamily: typography.labelLarge.fontFamily,
    fontSize: 15,
    color: colors.textPrimary,
  },
  destaqueDescricao: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.bodyMedium.fontSize,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  acoes: {
    gap: spacing.sm,
  },
  termos: {
    marginTop: spacing.xs,
    textAlign: 'center',
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: typography.bodySmall.fontSize,
    lineHeight: typography.bodySmall.lineHeight,
    color: colors.textMuted,
  },
});
