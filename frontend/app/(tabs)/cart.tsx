import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/cartStore';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Card, Button, Input, ProductImage } from '../../components/ui';
import { Produto } from '../../types';
import { formatBRL, toNumber } from '../../utils/format';

// HU02: o comprador escolhe uma janela de entrega ou retirada em vez de digitar o horário
const PERIODOS = [
  { id: 'MANHA', nome: 'Manhã', faixa: '8h-12h', fim: 12 },
  { id: 'TARDE', nome: 'Tarde', faixa: '12h-18h', fim: 18 },
  { id: 'NOITE', nome: 'Noite', faixa: '18h-21h', fim: 21 },
] as const;

type Dia = 'HOJE' | 'AMANHA';
type PeriodoId = (typeof PERIODOS)[number]['id'];

const dataDoDia = (dia: Dia) => {
  const data = new Date();
  if (dia === 'AMANHA') data.setDate(data.getDate() + 1);
  return data;
};

// Ex.: "Qui, 15/10 - Noite (18h-21h)". Grava a data, para o texto continuar correto nos dias seguintes
const montarJanela = (dia: Dia, periodoId: PeriodoId) => {
  const periodo = PERIODOS.find(p => p.id === periodoId)!;
  const data = dataDoDia(dia);
  const semana = data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  const diaMes = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${semana.charAt(0).toUpperCase()}${semana.slice(1)}, ${diaMes} - ${periodo.nome} (${periodo.faixa})`;
};

// Hoje, só os períodos que ainda não terminaram
const periodoDisponivel = (dia: Dia, fim: number) => dia === 'AMANHA' || new Date().getHours() < fim;

export default function CartScreen() {
  const router = useRouter();
  const { usuario, isAuthenticated, isLoading } = useAuth();
  const { items, totalItems, totalValue, updateQuantity, removeItem, clearCart } = useCartStore();
  const { createPedido } = useApi();

  const [unidadeEntrega, setUnidadeEntrega] = useState(usuario?.unidade || '');
  const [tipoEntrega, setTipoEntrega] = useState<'PORTARIA' | 'UNIDADE' | 'COMBINAR'>('PORTARIA');
  const [dia, setDia] = useState<Dia>(() => (new Date().getHours() < 21 ? 'HOJE' : 'AMANHA'));
  const [periodo, setPeriodo] = useState<PeriodoId | null>(null);
  const janelaHorario = periodo ? montarJanela(dia, periodo) : '';

  const escolherDia = (novoDia: Dia) => {
    setDia(novoDia);
    const atual = PERIODOS.find(p => p.id === periodo);
    if (atual && !periodoDisponivel(novoDia, atual.fim)) setPeriodo(null);
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (usuario) {
      setUnidadeEntrega(usuario.unidade || '');
    }
  }, [usuario]);

  const handleFinalizarPedido = async () => {
    if (items.length === 0) return;

    if (!unidadeEntrega || !janelaHorario) {
      setError('Preencha a unidade de entrega e escolha a janela de horário');
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

  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={64} color="#D1E3F0" />
        <Text style={styles.emptyTitle}>Carregando...</Text>
      </View>
    );
  }

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
      <ProductImage url={item.produto.imagemUrl} style={styles.itemImage} iconSize={24} />
      <View style={styles.itemInfo} >
        <Text style={styles.itemNome} numberOfLines={2}>{item.produto.nome}</Text>
        <Text style={styles.itemPreco}>{formatBRL(item.produto.preco)} cada</Text>
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
          {formatBRL(toNumber(item.produto.preco) * item.quantidade)}
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

          <Text style={styles.sectionLabel}>Janela de Horário</Text>
          <View style={styles.tipoEntregaOptions}>
            {(['HOJE', 'AMANHA'] as const).map((opcao) => (
              <TouchableOpacity
                key={opcao}
                style={[styles.tipoOption, dia === opcao && styles.tipoOptionSelected]}
                onPress={() => escolherDia(opcao)}
                accessibilityState={{ selected: dia === opcao }}
              >
                <Text style={[styles.tipoOptionText, dia === opcao && styles.tipoOptionTextSelected]}>
                  {opcao === 'HOJE' ? 'Hoje' : 'Amanhã'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.tipoEntregaOptions, styles.periodos]}>
            {PERIODOS.map((p) => {
              const disponivel = periodoDisponivel(dia, p.fim);
              const selecionado = periodo === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.tipoOption, selecionado && styles.tipoOptionSelected, !disponivel && styles.periodoIndisponivel]}
                  onPress={() => setPeriodo(p.id)}
                  disabled={!disponivel}
                  accessibilityState={{ selected: selecionado, disabled: !disponivel }}
                >
                  <Text style={[styles.tipoOptionText, selecionado && styles.tipoOptionTextSelected]}>{p.nome}</Text>
                  <Text style={[styles.periodoFaixa, selecionado && styles.tipoOptionTextSelected]}>{p.faixa}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {janelaHorario ? <Text style={styles.janelaEscolhida}>{janelaHorario}</Text> : null}
        </Card>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({totalItems} itens)</Text>
            <Text style={styles.summaryValue}>{formatBRL(totalValue)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxa de Entrega</Text>
            <Text style={styles.summaryValue}>Grátis</Text>
          </View>
          <View style={styles.summaryRowTotal}>
            <Text style={styles.summaryLabelTotal}>Total</Text>
            <Text style={styles.summaryValueTotal}>{formatBRL(totalValue)}</Text>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            title={`Finalizar Pedido - ${formatBRL(totalValue)}`}
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
  periodos: {
    marginTop: 8,
  },
  periodoIndisponivel: {
    opacity: 0.4,
  },
  periodoFaixa: {
    fontSize: 11,
    color: '#6C7A8A',
    marginTop: 2,
  },
  janelaEscolhida: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3A5F',
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