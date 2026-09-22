import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Button } from '../../components/ui';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/(auth)/community-selection');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Porta a Porta</Text>
        <Text style={styles.subtitle}>
          Comércio interno do seu condomínio,\norganizado e seguro.
        </Text>
        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🛍️</Text>
            <Text style={styles.featureText}>Vitrine de produtos dos vizinhos</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🚪</Text>
            <Text style={styles.featureText}>Entrega na portaria ou unidade</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🛡️</Text>
            <Text style={styles.featureText}>Moderação pelo síndico</Text>
          </View>
        </View>
      </View>
      <View style={styles.bottom}>
        <Button title="Começar" onPress={handleGetStarted} size="lg" fullWidth />
        <Text style={styles.footerText}>
          Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E3A5F',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C7A8A',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  features: {
    gap: 16,
    marginBottom: 40,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 15,
    color: '#3D4A5A',
    fontWeight: '500',
  },
  bottom: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    gap: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#9AA8B8',
    textAlign: 'center',
    lineHeight: 18,
  },
});