'use client';

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/components/ui';
import { useCartStore } from '@/store/cartStore';
import { useState } from 'react';

export default function CartScreen() {
  const { items, removeItem, updateQuantity, getSubtotal, getTotal, seller, clearCart } = useCartStore();
  const subtotal = getSubtotal();
  const deliveryFee = seller?.deliveryFee || 5.99;
  const total = getTotal();

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <Ionicons name="cart-outline" size={80} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>Carrinho vazio</Text>
          <Text style={styles.emptySubtitle}>Adicione itens deliciosos ao seu carrinho</Text>
          <Button
            title="Explorar restaurantes"
            variant="primary"
            size="lg"
            onPress={() => router.push('/(tabs)/home')}
            style={{ marginTop: 24, width: 280 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const handleCheckout = () => {
    router.push('/checkout');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Carrinho</Text>
          {items.length > 0 && (
            <TouchableOpacity onPress={() => {
              Alert.alert('Limpar carrinho', 'Tem certeza que deseja remover todos os itens?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Limpar', style: 'destructive', onPress: clearCart },
              ]);
            }}>
              <Text style={styles.clearText}>Limpar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Seller Info */}
        {seller && (
          <View style={styles.sellerCard}>
            <Image source={{ uri: seller.imageUrl }} style={styles.sellerImage} resizeMode="cover" />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{seller.businessName}</Text>
              <View style={styles.sellerMeta}>
                <Text style={styles.metaText}>🚚 Entrega: R$ {seller.deliveryFee.toFixed(2)}</Text>
                <Text style={styles.metaText}>⏱️ {seller.minimumOrder} min</Text>
              </View>
            </View>
          </View>
        )}

        {/* Items */}
        <View style={styles.itemsContainer}>
          {items.map((item, index) => (
            <View key={item.product.id} style={styles.itemCard}>
              <Image source={{ uri: item.product.imageUrl }} style={styles.itemImage} resizeMode="cover" />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.product.name}</Text>
                {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
                <Text style={styles.itemPrice}>R$ {item.product.price.toFixed(2)}</Text>
              </View>
              <View style={styles.quantityControl}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Ionicons name="remove" size={20} color={item.quantity <= 1 ? '#C7C7CC' : '#1D1D1F'} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                >
                  <Ionicons name="add" size={20} color="#1D1D1F" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>R$ {subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxa de entrega</Text>
            <Text style={styles.summaryValue}>R$ {deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValueFinal}>R$ {total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPrice}>
          <Text style={styles.bottomTotalLabel}>Total</Text>
          <Text style={styles.bottomTotalPrice}>R$ {total.toFixed(2)}</Text>
        </View>
        <Button
          title="Finalizar pedido"
          variant="primary"
          size="lg"
          onPress={handleCheckout}
        />
      </View>
    </SafeAreaView>
  );
}

import { Alert } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1D1D1F',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  clearText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF3B30',
  },
  sellerCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sellerImage: {
    width: 80,
    height: 80,
  },
  sellerInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  sellerMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  itemsContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  itemNotes: {
    fontSize: 12,
    color: '#8E8E93',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'flex-end',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    minWidth: 24,
    textAlign: 'center',
  },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    marginTop: 8,
    paddingTop: 16,
  },
  summaryValueFinal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  bottomPrice: {
    flex: 1,
  },
  bottomTotalLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  bottomTotalPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1D1D1F',
  },
});