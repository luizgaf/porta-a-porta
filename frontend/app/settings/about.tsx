import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui';

interface Feature {
  icon: 'bag-outline' | 'cart-outline' | 'shield-outline' | 'star-outline' | 'notifications-outline' | 'person-outline';
  title: string;
  desc: string;
}

const features: Feature[] = [
  { icon: 'bag-outline', title: 'Vitrine Comunitária', desc: 'Produtos dos vizinhos organizados por categoria' },
  { icon: 'cart-outline', title: 'Carrinho e Pedidos', desc: 'Compra simples com entrega agendada' },
  { icon: 'shield-outline', title: 'Moderação do Síndico', desc: 'Denúncias, quarentena e auditoria' },
  { icon: 'star-outline', title: 'Sistema de Avaliações', desc: 'Confiança baseada em experiências reais' },
  { icon: 'notifications-outline', title: 'Notificações Push', desc: 'Acompanhe status dos pedidos em tempo real' },
  { icon: 'person-outline', title: 'Perfil por Unidade', desc: 'Identificação vinculada ao apartamento/bloco' },
];

const techStack = [
  'React Native + Expo',
  'TypeScript',
  'Node.js + Express',
  'PostgreSQL + Prisma ORM',
  'JWT Authentication',
  'Zustand (State Management)',
  'Expo Router (Navigation)',
];

export default function AboutScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sobre o App</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoSection}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Porta a Porta</Text>
          <Text style={styles.version}>Versão 1.0.0</Text>
          <Text style={styles.tagline}>Comércio interno do seu condomínio,\norganizado e seguro.</Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>O que é o Porta a Porta?</Text>
          <Text style={styles.description}>
            O Porta a Porta é uma plataforma digital que conecta moradores de um mesmo condomínio
            para compra e venda de produtos caseiros, artesanais, alimentos, serviços e muito mais.
            Tudo com a segurança e moderação do síndico, entrega na portaria ou na sua unidade.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Principais Funcionalidades</Text>
          <View style={styles.features}>
            {features.map((feature, index) => (
              <View key={index} style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon} size={24} color="#1E3A5F" />
                </View>
                <View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Tecnologia</Text>
          <View style={styles.techStack}>
            {techStack.map((tech, index) => (
              <Text key={index} style={styles.techItem}>
                • {tech}
              </Text>
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Links Úteis</Text>
          <View style={styles.links}>
            <TouchableOpacity onPress={() => Linking.openURL('https://porta-a-porta.com/termos')}>
              <Text style={styles.linkText}>Termos de Uso</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('https://porta-a-porta.com/privacidade')}>
              <Text style={styles.linkText}>Política de Privacidade</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('https://github.com/porta-a-porta')}>
              <Text style={styles.linkText}>Repositório no GitHub</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:contato@porta-a-porta.com')}>
              <Text style={styles.linkText}>Contato</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={styles.credits}>
          <Text style={styles.creditsText}>
            Feito com ❤️ para comunidades residenciais
            {'\n'}© 2024 Porta a Porta. Todos os direitos reservados.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EFF5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  version: {
    fontSize: 14,
    color: '#9AA8B8',
  },
  tagline: {
    fontSize: 14,
    color: '#6C7A8A',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E8EFF5',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  description: {
    fontSize: 14,
    color: '#3D4A5A',
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  features: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    gap: 12,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E6F4FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  featureDesc: {
    fontSize: 13,
    color: '#6C7A8A',
    marginTop: 2,
  },
  techStack: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 6,
  },
  techItem: {
    fontSize: 13,
    color: '#3D4A5A',
    paddingHorizontal: 16,
  },
  links: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  linkText: {
    fontSize: 15,
    color: '#1E3A5F',
    fontWeight: '500',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  credits: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  creditsText: {
    fontSize: 12,
    color: '#9AA8B8',
    textAlign: 'center',
    lineHeight: 18,
  },
});