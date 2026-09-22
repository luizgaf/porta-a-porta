import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui';

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificações</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={24} color="#1E3A5F" style={styles.settingIcon} />
              <View>
                <Text style={styles.settingTitle}>Notificações Push</Text>
                <Text style={styles.settingDesc}>Receba alertas de novos pedidos, status e promoções</Text>
              </View>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              thumbColor="#FFFFFF"
              trackColor={{ false: '#D1E3F0', true: '#1E3A5F' }}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="cart-outline" size={24} color="#1E3A5F" style={styles.settingIcon} />
              <View>
                <Text style={styles.settingTitle}>Novos Pedidos</Text>
                <Text style={styles.settingDesc}>Quando alguém compra seus produtos</Text>
              </View>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              thumbColor="#FFFFFF"
              trackColor={{ false: '#D1E3F0', true: '#1E3A5F' }}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="bag-outline" size={24} color="#1E3A5F" style={styles.settingIcon} />
              <View>
                <Text style={styles.settingTitle}>Atualizações de Pedido</Text>
                <Text style={styles.settingDesc}>Confirmação, preparo, entrega</Text>
              </View>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              thumbColor="#FFFFFF"
              trackColor={{ false: '#D1E3F0', true: '#1E3A5F' }}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="star-outline" size={24} color="#FFC107" style={styles.settingIcon} />
              <View>
                <Text style={styles.settingTitle}>Avaliações</Text>
                <Text style={styles.settingDesc}>Quando seus produtos são avaliados</Text>
              </View>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              thumbColor="#FFFFFF"
              trackColor={{ false: '#D1E3F0', true: '#1E3A5F' }}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="flag-outline" size={24} color="#DC3545" style={styles.settingIcon} />
              <View>
                <Text style={styles.settingTitle}>Denúncias e Moderação</Text>
                <Text style={styles.settingDesc}>Alertas de produtos em quarentena (síndico)</Text>
              </View>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              thumbColor="#FFFFFF"
              trackColor={{ false: '#D1E3F0', true: '#1E3A5F' }}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Horário Silencioso</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeInput}>
              <Text style={styles.timeLabel}>Início</Text>
              <Text style={styles.timeValue}>22:00</Text>
            </View>
            <View style={styles.timeInput}>
              <Text style={styles.timeLabel}>Fim</Text>
              <Text style={styles.timeValue}>08:00</Text>
            </View>
          </View>
          <Text style={styles.helpText}>Notificações não farão som neste período</Text>
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
  card: {
    borderWidth: 1,
    borderColor: '#E8EFF5',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    marginTop: 2,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  settingDesc: {
    fontSize: 13,
    color: '#6C7A8A',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8EFF5',
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#9AA8B8',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  helpText: {
    fontSize: 12,
    color: '#9AA8B8',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});