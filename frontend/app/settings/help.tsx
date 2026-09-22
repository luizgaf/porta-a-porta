import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui';

export default function HelpScreen() {
  const router = useRouter();

  const faqs = [
    {
      q: 'Como faço para me tornar vendedor?',
      a: 'No cadastro, selecione "Vendedor" como tipo de usuário. Se já tem conta, vá em Perfil > Configurações e solicite alteração de tipo ao síndico.',
    },
    {
      q: 'Meu produto sumiu da vitrine. O que aconteceu?',
      a: 'Produtos com 3 ou mais denúncias entram em quarentena automaticamente. O síndico decide se restaura ou mantém fora. Verifique na aba "Vendedor" o status do seu produto.',
    },
    {
      q: 'Como funciona a entrega?',
      a: 'Na finalização do pedido, escolha: Portaria (entregue na portaria), Unidade (entregue na sua porta) ou Combinar (você combina direto com o vendedor pelo chat).',
    },
    {
      q: 'Posso cancelar um pedido?',
      a: 'Sim, compradores podem cancelar pedidos com status "Pendente". Vendedores e síndico podem cancelar em qualquer etapa antes da entrega.',
    },
    {
      q: 'Como funciona o limite de 15 produtos?',
      a: 'Cada vendedor pode ter no máximo 15 produtos com status "Ativo" simultaneamente. Pause ou exclua produtos para criar novos.',
    },
    {
      q: 'Não recebo notificações. O que fazer?',
      a: 'Verifique em Configurações > Notificações se as notificações push estão ativadas. Também cheque as configurações do sistema do seu celular para o app Porta a Porta.',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajuda e Suporte</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9AA8B8" />
          <Text style={styles.searchPlaceholder}>Buscar ajuda...</Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Perguntas Frequentes</Text>
          {faqs.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqItem}
              onPress={() => Alert.alert(faq.q, faq.a)}
            >
              <View style={styles.faqContent}>
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <Ionicons name="chevron-forward" size={20} color="#9AA8B8" />
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Contato</Text>
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('mailto:suporte@porta-a-porta.com')}>
            <Ionicons name="mail-outline" size={24} color="#1E3A5F" style={styles.contactIcon} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>E-mail</Text>
              <Text style={styles.contactValue}>suporte@porta-a-porta.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9AA8B8" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('https://porta-a-porta.com/faq')}>
            <Ionicons name="globe-outline" size={24} color="#1E3A5F" style={styles.contactIcon} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Central de Ajuda Online</Text>
              <Text style={styles.contactValue}>porta-a-porta.com/faq</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9AA8B8" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('tel:08007289000')}>
            <Ionicons name="call-outline" size={24} color="#1E3A5F" style={styles.contactIcon} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Telefone (SAC)</Text>
              <Text style={styles.contactValue}>0800 728 9000</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9AA8B8" />
          </TouchableOpacity>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Sobre o App</Text>
          <View style={styles.aboutInfo}>
            <Text style={styles.aboutText}>
              Porta a Porta v1.0.0
              {'\n'}Comércio interno seguro para condomínios
              {'\n\n'}Desenvolvido com React Native, Expo, Node.js e PostgreSQL
            </Text>
            <View style={styles.links}>
              <TouchableOpacity onPress={() => Linking.openURL('https://porta-a-porta.com/termos')}>
                <Text style={styles.linkText}>Termos de Uso</Text>
              </TouchableOpacity>
              <Text style={styles.linkSeparator}>•</Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://porta-a-porta.com/privacidade')}>
                <Text style={styles.linkText}>Política de Privacidade</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EFF5',
  },
  searchPlaceholder: {
    fontSize: 15,
    color: '#9AA8B8',
  },
  card: {
    borderWidth: 1,
    borderColor: '#E8EFF5',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  faqItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  faqContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E3A5F',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8EFF5',
    marginHorizontal: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  contactIcon: {
    marginTop: 2,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  contactValue: {
    fontSize: 13,
    color: '#6C7A8A',
    marginTop: 2,
  },
  aboutInfo: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  aboutText: {
    fontSize: 14,
    color: '#3D4A5A',
    lineHeight: 20,
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  linkText: {
    fontSize: 14,
    color: '#1E3A5F',
    fontWeight: '500',
  },
  linkSeparator: {
    color: '#9AA8B8',
  },
});