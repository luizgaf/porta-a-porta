import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView, Switch, FlatList, RefreshControl } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Card, Button, Avatar, Input } from '../../components/ui';
import { STATUS_LABELS, TIPO_ENTREGA_LABELS } from '../../constants';
import { Usuario, Produto, Pedido } from '../../types';

export default function ProfileScreen() {
  const router = useRouter();
  const { usuario, isVendedor, isSindico, logout, updateUsuario, hasRole } = useAuth();
  const { getMeusProdutos, getPedidos } = useApi();

  const [meusProdutos, setMeusProdutos] = useState<Produto[]>([]);
  const [meusPedidos, setMeusPedidos] = useState<Pedido[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editNome, setEditNome] = useState(usuario?.nome || '');
  const [editUnidade, setEditUnidade] = useState(usuario?.unidade || '');

  useEffect(() => {
    if (isVendedor) carregarMeusProdutos();
    if (hasRole('COMPRADOR')) carregarMeusPedidos();
  }, [isVendedor]);

  const carregarMeusProdutos = async () => {
    setLoadingProdutos(true);
    try {
      const response = await getMeusProdutos({ limite: 5 });
      const produtosData = response.produtos || response.data || [];
      setMeusProdutos(produtosData);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoadingProdutos(false);
    }
  };

  const carregarMeusPedidos = async () => {
    setLoadingPedidos(true);
    try {
      const response = await getPedidos({ limite: 5 });
      const pedidosData = response.pedidos || response.data || [];
      setMeusPedidos(pedidosData);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoadingPedidos(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editNome.trim() || !editUnidade.trim()) {
      Alert.alert('Erro', 'Nome e unidade são obrigatórios');
      return;
    }

    try {
      // TODO: Implementar endpoint de atualização de perfil
      updateUsuario({ nome: editNome, unidade: editUnidade });
      setEditMode(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao atualizar perfil');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (!usuario) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={loadingProdutos || loadingPedidos}
          onRefresh={() => {
            if (isVendedor) carregarMeusProdutos();
            if (hasRole('COMPRADOR')) carregarMeusPedidos();
          }}
          colors={['#1E3A5F']}
        />
      }
    >
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Avatar name={usuario.nome} size="xl" />
          <View style={styles.profileInfo}>
            {editMode ? (
              <>
                <Input
                  value={editNome}
                  onChangeText={setEditNome}
                  style={styles.editInput}
                  autoCapitalize="words"
                />
                <Input
                  value={editUnidade}
                  onChangeText={setEditUnidade}
                  style={styles.editInput}
                  autoCapitalize="words"
                />
              </>
            ) : (
              <>
                <Text style={styles.profileNome}>{usuario.nome}</Text>
                <View style={styles.profileMeta}>
                  <Text style={styles.profileUnidade}>{usuario.unidade}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor(usuario.tipo) }]}>
                    <Text style={styles.roleBadgeText}>{usuario.tipo}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {!editMode && (
          <View style={styles.profileActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => setEditMode(true)}>
              <Ionicons name="create-outline" size={20} color="#1E3A5F" />
              <Text style={styles.actionButtonText}>Editar Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionButtonDanger]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#DC3545" />
              <Text style={[styles.actionButtonText, { color: '#DC3545' }]}>Sair</Text>
            </TouchableOpacity>
          </View>
        )}

        {editMode && (
          <View style={styles.editActions}>
            <Button title="Cancelar" onPress={() => setEditMode(false)} variant="outline" fullWidth />
            <Button title="Salvar" onPress={handleSaveProfile} fullWidth />
          </View>
        )}
      </Card>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{meusPedidos.length + meusProdutos.length}</Text>
          <Text style={styles.statLabel}>Total de Itens</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{meusPedidos.filter(p => p.status === 'ENTREGUE').length}</Text>
          <Text style={styles.statLabel}>Compras Concluídas</Text>
        </Card>
        {isVendedor && (
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{meusProdutos.filter(p => p.status === 'ATIVO').length}</Text>
            <Text style={styles.statLabel}>Produtos Ativos</Text>
          </Card>
        )}
      </View>

      {/* My Orders */}
      {hasRole('COMPRADOR') && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Meus Pedidos Recentes</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
              <Text style={styles.seeAll}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {loadingPedidos ? (
            <View style={styles.loadingMini}>
              <ActivityIndicator size="small" color="#1E3A5F" />
            </View>
          ) : meusPedidos.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="bag-outline" size={32} color="#D1E3F0" />
              <Text style={styles.emptyText}>Nenhum pedido ainda</Text>
              <Button title="Fazer Compras" onPress={() => router.push('/(tabs)/home')} variant="outline" style={styles.emptyButton} />
            </Card>
          ) : (
            <FlatList
              data={meusPedidos}
              renderItem={({ item }) => renderPedidoResumido(item, router)}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      )}

      {/* My Products (Seller) */}
      {isVendedor && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Meus Produtos</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/seller')}>
              <Text style={styles.seeAll}>Gerenciar</Text>
            </TouchableOpacity>
          </View>

          {loadingProdutos ? (
            <View style={styles.loadingMini}>
              <ActivityIndicator size="small" color="#1E3A5F" />
            </View>
          ) : meusProdutos.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="storefront-outline" size={32} color="#D1E3F0" />
              <Text style={styles.emptyText}>Nenhum produto cadastrado</Text>
              <Button title="Adicionar Produto" onPress={() => router.push('/product/new')} variant="outline" style={styles.emptyButton} />
            </Card>
          ) : (
            <FlatList
              data={meusProdutos}
              renderItem={({ item }) => renderProdutoResumido(item, router)}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      )}

      {/* Settings */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Configurações</Text>
        <Card style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/settings/notifications')}>
            <Ionicons name="notifications-outline" size={22} color="#1E3A5F" style={styles.settingIcon} />
            <Text style={styles.settingText}>Notificações Push</Text>
            <Ionicons name="chevron-forward" size={20} color="#9AA8B8" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/settings/privacy')}>
            <Ionicons name="shield-outline" size={22} color="#1E3A5F" style={styles.settingIcon} />
            <Text style={styles.settingText}>Privacidade e Segurança</Text>
            <Ionicons name="chevron-forward" size={20} color="#9AA8B8" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/settings/help')}>
            <Ionicons name="help-outline" size={22} color="#1E3A5F" style={styles.settingIcon} />
            <Text style={styles.settingText}>Ajuda e Suporte</Text>
            <Ionicons name="chevron-forward" size={20} color="#9AA8B8" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/settings/about')}>
            <Ionicons name="information-outline" size={22} color="#1E3A5F" style={styles.settingIcon} />
            <Text style={styles.settingText}>Sobre o App</Text>
            <Ionicons name="chevron-forward" size={20} color="#9AA8B8" />
          </TouchableOpacity>
        </Card>
      </View>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Porta a Porta v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const renderPedidoResumido = (pedido: Pedido, router: any) => (
  <TouchableOpacity style={styles.resumoCard} onPress={() => router.push(`/order/${pedido.id}`)} activeOpacity={0.8}>
    <View style={styles.resumoHeader}>
      <View style={styles.resumoInfo}>
        <Text style={styles.resumoTitle}>Pedido #{pedido.id.slice(0, 8).toUpperCase()}</Text>
        <Text style={styles.resumoDate}>
          {new Date(pedido.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <View style={[styles.resumoStatus, { backgroundColor: getStatusColor(pedido.status) }]}>
        <Text style={styles.resumoStatusText}>{STATUS_LABELS[pedido.status]}</Text>
      </View>
    </View>
    <View style={styles.resumoFooter}>
      <Text style={styles.resumoValue}>R$ {pedido.valorTotal.toFixed(2).replace('.', ',')}</Text>
      <Text style={styles.resumoItems}>{pedido.itens.length} item(ns)</Text>
    </View>
  </TouchableOpacity>
);

const renderProdutoResumido = (produto: Produto, router: any) => (
  <TouchableOpacity style={styles.resumoCard} onPress={() => router.push(`/product/${produto.id}`)} activeOpacity={0.8}>
    <View style={styles.resumoHeader}>
      <View style={styles.resumoInfo}>
        <Text style={styles.resumoTitle}>{produto.nome}</Text>
        <Text style={styles.resumoDate}>{produto.categoria} • {STATUS_LABELS[produto.status]}</Text>
      </View>
      <Text style={styles.resumoPrice}>R$ {produto.preco.toFixed(2).replace('.', ',')}</Text>
    </View>
  </TouchableOpacity>
);

const getRoleColor = (tipo: string) => {
  switch (tipo) {
    case 'SINDICO': return '#DC3545';
    case 'VENDEDOR': return '#28A745';
    default: return '#1E3A5F';
  }
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDENTE: '#FFC107',
    CONFIRMADO: '#17A2B8',
    EM_PREPARO: '#6F42C1',
    PRONTO_ENTREGA: '#FD7E14',
    ENTREGUE: '#28A745',
    CANCELADO: '#DC3545',
    ATIVO: '#28A745',
    PAUSADO: '#6C7A8A',
    QUARENTENA: '#DC3545',
    EXCLUIDO: '#9AA8B8',
  };
  return colors[status] || '#6C7A8A';
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6C7A8A',
  },
  profileCard: {
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileNome: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  profileUnidade: {
    fontSize: 14,
    color: '#6C7A8A',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  editInput: {
    marginBottom: 8,
  },
  profileActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1E3F0',
    backgroundColor: '#FFFFFF',
  },
  actionButtonDanger: {
    borderColor: '#FADBD8',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  statLabel: {
    fontSize: 12,
    color: '#6C7A8A',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  loadingMini: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#6C7A8A',
    textAlign: 'center',
  },
  emptyButton: {
    width: '80%',
    marginTop: 8,
  },
  separator: {
    height: 8,
  },
  resumoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EFF5',
  },
  resumoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  resumoInfo: {
    flex: 1,
  },
  resumoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  resumoDate: {
    fontSize: 12,
    color: '#9AA8B8',
    marginTop: 2,
  },
  resumoPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  resumoStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  resumoStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  resumoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8EFF5',
  },
  resumoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  resumoItems: {
    fontSize: 13,
    color: '#6C7A8A',
  },
  settingsCard: {
    borderWidth: 1,
    borderColor: '#E8EFF5',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  settingIcon: {
    width: 28,
  },
  settingText: {
    flex: 1,
    fontSize: 15,
    color: '#1E3A5F',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8EFF5',
    marginHorizontal: 16,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 12,
    color: '#9AA8B8',
  },
});