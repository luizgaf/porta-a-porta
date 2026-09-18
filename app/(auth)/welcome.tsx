'use client';

import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>🏪</Text>
        </View>
        <Text style={styles.title}>Porta a Porta</Text>
        <Text style={styles.subtitle}>
          O iFood das comunidades brasileiras
        </Text>
        <Text style={styles.description}>
          Conecte-se com vendedores locais, descubra sabores da sua vizinhança
          e fortaleça o comércio da sua comunidade.
        </Text>
      </View>
      <View style={styles.buttons}>
        <Button
          title="Começar agora"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => router.push('/(auth)/login')}
        />
        <Button
          title="Entrar como visitante"
          variant="ghost"
          size="lg"
          fullWidth
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    fontSize: 56,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1D1D1F',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttons: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    gap: 16,
  },
});