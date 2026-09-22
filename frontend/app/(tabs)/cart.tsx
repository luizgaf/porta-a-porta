import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/cartStore';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Card, Button, Input } from '../../components/ui';
import { Produto } from '../../types';

export default function CartScreen() {
  const router = useRouter();
  const { usuario, isAuthenticated } = useAuth();
  const { items, totalItems, totalValue, updateQuantity, removeItem, clearCart } = useCartStore();
  const { createPedido } = useApi();

  const [unidadeEntrega, setUnidadeEntrega] = useState(usuario?.unidade || '');
  const [tipoEntrega, setTipoEntrega] = useState<'PORTARIA' | 'UNIDADE' | 'COMBINAR'>('PORTARIA');
  const [janelaHorario, setJanelaHorario] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFinalizarPedido = async () => {
    if (items.length === 0) return;

    if (!unidadeEntrega || !janelaHorario) {
      setError('Preencha a unidade de entrega e a janela de horário');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await createPedido({
        itens: items.map(item => ({
          produtoId: item.produto.id,
          quantidade: item.quantidade,
        })),
        unidadeEntrega,
        tipoEntrega,
        janelaHorario,
      });

      clearCart();
      Alert.alert('Sucesso!', 'Pedido realizado com sucesso', [
        { text: 'Ver Pedidos', onPress: () => router.push('/(tabs)/orders') },
        { text: 'OK', style: 'cancel' },
      ]);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={64} color="#D1E3F0" />
        <Text style={styles.emptyTitle}>Faça login para ver o carrinho</Text>
        <Button title="Entrar" onPress={() => router.push('/(auth)/login')} variant="primary" style={styles.loginButton} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={64} color="#D1E3F0" />
        <Text style={styles.emptyTitle}>Carrinho vazio</Text>
        <Text style={styles.emptyText}>Adicione produtos da vitrine</Text>
        <Button title="Ir às Compras" onPress={() => router.push('/(tabs)/home')} variant="primary" style={styles.loginButton} />
      </View>
    );
  }

  const renderItem = ({ item }: { item: { produto: Produto; quantidade: number } }) => (
    <View style={styles.cartItem}>
      <Image
        source={{ uri: 'https://via.placeholder.com/100x100/E6F4FE/1E3A5F?text=Produto' }}
        style={styles.itemImage}
        resizeMode="cover"
      />
      <View style={styles.itemInfo} >
        <Text style={styles.itemNome} numberOfLines={2}>{item.produto.nome}</Text>
        <Text style={styles.itemPreco}>R$ {item.produto.preco.toFixed(2).replace('.', ',')} cada</Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => updateQuantity(item.produto.id, item.quantidade - 1)}
            disabled={item.quantidade <= 1}
          >
            <Ionicons name="remove" size={20} color={item.quantidade <= 1 ? '#D1E3F0' : '#1E3A5F'} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantidade}</Text>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => updateQuantity(item.produto.id, item.quantidade + 1)}
          >
            <Ionicons name="add" size={20} color="#1E3A5F" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemTotal}>
          R$ {(item.produto.preco * item.quantidade).toFixed(2).replace('.', ',')}
        </Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeItem(item.produto.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#DC3545" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.produto.id}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>Carrinho ({totalItems} itens)</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />

        <Card style={styles.deliveryCard}>
          <Text style={styles.cardTitle}>Entrega</Text>

          <Input
            label="Unidade de Entrega"
            placeholder="Ex: Bloco A, Ap 101"
            value={unidadeEntrega}
            onChangeText={setUnidadeEntrega}
            style={styles.input}
          />

          <Text style={styles.sectionLabel}>Tipo de Entrega</Text>
          <View style={styles.tipoEntregaOptions}>
            {(['PORTARIA', 'UNIDADE', 'COMBINAR'] as const).map((tipo) => (
              <TouchableOpacity
                key={tipo}
                style={[
                  styles.tipoOption,
                  tipoEntrega === tipo && styles.tipoOptionSelected,
                ]}
                onPress={() => setTipoEntrega(tipo)}
              >
                <Text
                  style={[
                    styles.tipoOptionText,
                    tipoEntrega === tipo && styles.tipoOptionTextSelected,
                  ]}
                >
                  {tipo === 'PORTARIA' ? '📦 Portaria' : tipo === 'UNIDADE' ? '🚪 Unidade' : '🤝 Combinar'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Janela de Horário"
            placeholder="Ex: 18h-20h, amanhã pela manhã..."
            value={janelaHorario}
            onChangeText={setJanelaHorario}
            style={styles.input}
          />
        </Card>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({totalItems} itens)</Text>
            <Text style={styles.summaryValue}>R$ {totalValue.toFixed(2).replace('.', ',')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxa de Entrega</Text>
            <Text style={styles.summaryValue}>Grátis</Text>
          </View>
          <View style={styles.summaryRowTotal}>
            <Text style={styles.summaryLabelTotal}>Total</Text>
            <Text style={styles.summaryValueTotal}>R$ {totalValue.toFixed(2).replace('.', ',')}</Text>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            title={`Finalizar Pedido - R$ ${totalValue.toFixed(2).replace('.', ',')}`}
            onPress={handleFinalizarPedido}
            loading={loading}
            fullWidth
            size="lg"
            style={styles.finalizeButton}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

import { useState } from 'react';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E3A5F',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#6C7A8A',
    textAlign: 'center',
  },
  loginButton: {
    width: 200,
    marginTop: 8,
  },
  listHeader: {
    marginBottom: 12,
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  separator: {
    height: 8,
  },
  cartItem: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8EFF5',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemNome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  itemPreco: {
    fontSize: 13,
    color: '#6C7A8A',
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1E3F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
    minWidth: 24,
    textAlign: 'center',
  },
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 80,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  removeButton: {
    padding: 4,
  },
  deliveryCard: {
    marginTop: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 8,
    marginTop: 8,
  },
  tipoEntregaOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  tipoOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1E3F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  tipoOptionSelected: {
    borderColor: '#1E3A5F',
    backgroundColor: '#E6F4FE',
  },
  tipoOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3D4A5A',
  },
  tipoOptionTextSelected: {
    color: '#1E3A5F',
    fontWeight: '600',
  },
  summaryCard: {
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6C7A8A',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  summaryRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8EFF5',
    marginTop: 4,
  },
  summaryLabelTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#28A745',
  },
  errorText: {
    marginTop: 12,
    marginBottom: 12,
    textAlign: 'center',
    color: '#DC3545',
    fontSize: 13,
  },
  finalizeButton: {
    marginTop: 4,
  },
});