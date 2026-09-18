'use client';

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/components/ui';

export default function SellerDashboardScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Painel do Vendedor</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Em desenvolvimento</Text>
        <Text style={styles.description}>
          O painel completo do vendedor incluirá:
        </Text>
        <View style={styles.featureList}>
          {[
            'Gestão de produtos e cardápio',
            'Pedidos em tempo real',
            'Analytics de vendas',
            'Gestão de pagamentos e saques',
            'Configurações da loja',
            'Horários de funcionamento',
            'Promoções e cupons',
            'Avaliações e respostas',
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" style={{ marginRight: 12 }} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
        <Button
          title="Voltar ao resumo"
          variant="primary"
          onPress={() => router.back()}
          style={{ marginTop: 24, width: '100%' }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 16,
    lineHeight: 22,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 15,
    color: '#1D1D1F',
  },
});