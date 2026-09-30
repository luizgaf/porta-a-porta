import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card, Button } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { api } from '../../utils/api';

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const { register, isRegistered } = usePushNotifications();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    pedidos: true,
    novosProdutos: false,
    promoções: false,
    avaliacoes: true,
    denuncias: true,
    anuncios: true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTestNotification = async () => {
    try {
      await api.post('/notificacoes/teste', {});
      Alert.alert('Sucesso', 'Notificação de teste enviada para seu dispositivo');
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Não foi possível enviar a notificação de teste');
    }
  };

  const handleRegisterToken = async () => {
    setLoading(true);
    try {
      await register();
      Alert.alert('Sucesso', 'Notificações ativadas com sucesso');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível ativar as notificações');
    } finally {
      setLoading(false);
    }
  };

  const handleSendAnnouncement = async () => {
    try {
      await api.post('/notificacoes/enviar', {
        titulo: 'Comunicado do Síndico',
        corpo: 'Nova atualização para todos os moradores',
      });
      Alert.alert('Sucesso', 'Comunicado enviado para todos do condomínio');
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Não foi possível enviar o comunicado');
    }
  };

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
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Status do Dispositivo</Text>
            <Text style={styles.cardSubtitle}>
              {isRegistered ? 'Ativo' : 'Inativo'}
            </Text>
          </View>

          <View style={styles.tokenRow}>
            <Ionicons name="phone-portrait-outline" size={24} color="#1E3A5F" />
            <View style={styles.tokenInfo}>
              <Text style={styles.tokenLabel}>Push Token</Text>
              <Text style={styles.tokenValue}>
                {usuario?.pushToken
                  ? `${usuario.pushToken.slice(0, 20)}...`
                  : 'Não registrado'}
              </Text>
            </View>
            {usuario?.pushToken ? (
              <Ionicons name="checkmark-circle" size={24} color="#28A745" />
            ) : (
              <Ionicons name="alert-circle" size={24} color="#FFC107" />
            )}
          </View>

          {!usuario?.pushToken && (
            <Button
              title={loading ? 'Ativando...' : 'Ativar Notificações'}
              onPress={handleRegisterToken}
              disabled={loading}
              fullWidth
              style={styles.registerButton}
            />
          )}

          {loading && <ActivityIndicator size="small" color="#1E3A5F" style={styles.loader} />}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Tipos de Notificação</Text>

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
              value={settings.pedidos}
              onValueChange={() => handleToggle('pedidos')}
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
              value={settings.novosProdutos}
              onValueChange={() => handleToggle('novosProdutos')}
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
              value={settings.avaliacoes}
              onValueChange={() => handleToggle('avaliacoes')}
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
              value={settings.denuncias}
              onValueChange={() => handleToggle('denuncias')}
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

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Ferramentas</Text>
          <TouchableOpacity style={styles.actionRow} onPress={handleTestNotification}>
            <Ionicons name="send-outline" size={24} color="#1E3A5F" style={styles.settingIcon} />
            <Text style={styles.actionText}>Enviar Notificação de Teste</Text>
            <Ionicons name="chevron-forward" size={20} color="#9AA8B8" />
          </TouchableOpacity>

          {usuario?.tipo === 'SINDICO' && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.actionRow} onPress={handleSendAnnouncement}>
                <Ionicons name="megaphone-outline" size={24} color="#1E3A5F" style={styles.settingIcon} />
                <Text style={styles.actionText}>Enviar Comunicado para Todos</Text>
                <Ionicons name="chevron-forward" size={20} color="#9AA8B8" />
              </TouchableOpacity>
            </>
          )}
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
  cardHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6C7A8A',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
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
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenLabel: {
    fontSize: 13,
    color: '#6C7A8A',
  },
  tokenValue: {
    fontSize: 12,
    color: '#3D4A5A',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  registerButton: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  loader: {
    marginBottom: 8,
  },
});
