import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui';

export default function PrivacySettingsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacidade e Segurança</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="eye-outline" size={24} color="#1E3A5F" style={styles.settingIcon} />
              <View>
                <Text style={styles.settingTitle}>Perfil Visível</Text>
                <Text style={styles.settingDesc}>Outros moradores podem ver seu nome e unidade</Text>
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
              <Ionicons name="location-outline" size={24} color="#1E3A5F" style={styles.settingIcon} />
              <View>
                <Text style={styles.settingTitle}>Mostrar Unidade</Text>
                <Text style={styles.settingDesc}>Exibir seu bloco/apartamento nos pedidos e avaliações</Text>
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
              <Ionicons name="shield-checkmark-outline" size={24} color="#1E3A5F" style={styles.settingIcon} />
              <View>
                <Text style={styles.settingTitle}>Avaliações Anônimas</Text>
                <Text style={styles.settingDesc}>Suas avaliações aparecem sem seu nome para vendedores</Text>
              </View>
            </View>
            <Switch
              value={false}
              onValueChange={() => {}}
              thumbColor="#FFFFFF"
              trackColor={{ false: '#D1E3F0', true: '#1E3A5F' }}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Dados e Conta</Text>
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/settings/export-data')}>
            <Ionicons name="download-outline" size={24} color="#1E3A5F" style={styles.settingIcon} />
            <Text style={styles.actionText}>Exportar Meus Dados</Text>
            <Ionicons name="chevron-forward" size={20} color="#9AA8B8" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/settings/delete-account')}>
            <Ionicons name="trash-outline" size={24} color="#DC3545" style={styles.settingIcon} />
            <Text style={[styles.actionText, { color: '#DC3545' }]}>Excluir Conta</Text>
            <Ionicons name="chevron-forward" size={20} color="#9AA8B8" />
          </TouchableOpacity>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Segurança</Text>
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/settings/change-password')}>
            <Ionicons name="lock-closed-outline" size={24} color="#1E3A5F" style={styles.settingIcon} />
            <Text style={styles.actionText}>Alterar Senha</Text>
            <Ionicons name="chevron-forward" size={20} color="#9AA8B8" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/settings/sessions')}>
            <Ionicons name="dice-outline" size={24} color="#1E3A5F" style={styles.settingIcon} />
            <Text style={styles.actionText}>Sessões Ativas</Text>
            <Ionicons name="chevron-forward" size={20} color="#9AA8B8" />
          </TouchableOpacity>
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
    paddingHorizontal: 16,
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
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E3A5F',
    flex: 1,
    marginLeft: 12,
  },
});