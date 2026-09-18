'use client';

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/components/ui';
import { Order, OrderStatus } from '@/types';
import { useState } from 'react';

const mockOrder: Order = {
  id: 'order-1',
  customerId: 'user-1',
  sellerId: 'seller-1',
  communityId: 'comunidade-1',
  items: [
    { productId: 'prod-1', productName: 'Pizza Margherita', quantity: 1, unitPrice: 42.90, totalPrice: 42.90 },
    { productId: 'prod-2', productName: 'Pizza Pepperoni', quantity: 1, unitPrice: 48.90, totalPrice: 48.90 },
    { productId: 'prod-3', productName: 'Refrigerante Coca-Cola 350ml', quantity: 2, unitPrice: 6.90, totalPrice: 13.80 },
  ],
  subtotal: 105.60,
  deliveryFee: 5.99,
  tax: 0,
  discount: 0,
  total: 111.59,
  status: 'out_for_delivery',
  paymentStatus: 'paid',
  paymentMethod: 'pix',
  deliveryAddress: {
    street: 'Rua Aspicuelta',
    number: '123',
    complement: 'Apto 45',
    neighborhood: 'Vila Madalena',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '05433-010',
  },
  notes: 'Interfone 45, porta azul',
  estimatedDeliveryTime: new Date(Date.now() + 15 * 60000),
  createdAt: new Date(Date.now() - 35 * 60000),
  updatedAt: new Date(),
};

const statusSteps = [
  { status: 'confirmed' as OrderStatus, label: 'Confirmado', icon: 'checkmark-circle-outline' as const },
  { status: 'preparing' as OrderStatus, label: 'Preparando', icon: 'restaurant-outline' as const },
  { status: 'ready' as OrderStatus, label: 'Pronto', icon: 'checkmark-done-outline' as const },
  { status: 'out_for_delivery' as OrderStatus, label: 'Saiu para entrega', icon: 'bicycle-outline' as const },
  { status: 'delivered' as OrderStatus, label: 'Entregue', icon: 'checkmark-done-circle-outline' as const },
] as const;

const getStatusIndex = (status: OrderStatus) => {
  return statusSteps.findIndex((s) => s.status === status);
};

const currentStatusIndex = getStatusIndex(mockOrder.status);

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <View style={styles.statusInfo}>
            <Text style={styles.orderId}>Pedido #{mockOrder.id}</Text>
            <Text style={styles.orderDate}>{formatDate(mockOrder.createdAt)} às {formatTime(mockOrder.createdAt)}</Text>
          </View>
          <View style={[styles.currentStatus, { backgroundColor: getStatusColor(mockOrder.status) + '20' }]}>
            <Ionicons name={getStatusIcon(mockOrder.status)} size={20} color={getStatusColor(mockOrder.status)} style={{ marginRight: 6 }} />
            <Text style={[styles.statusLabel, { color: getStatusColor(mockOrder.status) }]}>{getStatusLabel(mockOrder.status)}</Text>
          </View>
        </View>

        {/* Progress Tracker */}
        <View style={styles.progressContainer}>
          {statusSteps.map((step, index) => (
            <View key={step.status} style={styles.stepContainer}>
              <View style={styles.stepLineContainer}>
                <View
                  style={[
                    styles.stepLine,
                    index < statusSteps.length - 1 && styles.stepLineActive,
                    index <= currentStatusIndex && styles.stepLineCompleted,
                  ]}
                />
                <View
                  style={[
                    styles.stepDot,
                    index <= currentStatusIndex && styles.stepDotCompleted,
                    index === currentStatusIndex && styles.stepDotCurrent,
                  ]}
                >
                  <Ionicons
                    name={step.icon}
                    size={16}
                    color={index <= currentStatusIndex ? '#fff' : '#C7C7CC'}
                  />
                </View>
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  index <= currentStatusIndex && styles.stepLabelCompleted,
                  index === currentStatusIndex && styles.stepLabelCurrent,
                ]}
              >
                {step.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Estimated Delivery */}
        {mockOrder.estimatedDeliveryTime && ['confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(mockOrder.status) && (
          <View style={styles.etaContainer}>
            <Ionicons name="time-outline" size={20} color="#007AFF" />
            <View>
              <Text style={styles.etaLabel}>Previsão de entrega</Text>
              <Text style={styles.etaTime}>{formatTime(mockOrder.estimatedDeliveryTime)}</Text>
            </View>
          </View>
        )}

        {/* Restaurant Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity style={styles.restaurantInfo} onPress={() => router.push('/seller/seller-1')}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400' }} style={styles.restaurantImage} resizeMode="cover" />
              <View>
                <Text style={styles.restaurantName}>Pizza do João</Text>
                <Text style={styles.restaurantCategory}>🍕 Pizza • Artesanal</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.callButton} onPress={() => {}}>
              <Ionicons name="call" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens do pedido</Text>
          <View style={styles.itemsList}>
            {mockOrder.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>R$ {item.totalPrice.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo do pagamento</Text>
          <View style={styles.summaryList}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>R$ {mockOrder.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taxa de entrega</Text>
              <Text style={styles.summaryValue}>R$ {mockOrder.deliveryFee.toFixed(2)}</Text>
            </View>
            {mockOrder.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Desconto</Text>
                <Text style={[styles.summaryValue, { color: '#34C759' }]}>- R$ {mockOrder.discount.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValue}>R$ {mockOrder.total.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.paymentMethod}>
            <Text style={styles.sectionTitle}>Forma de pagamento</Text>
            <View style={styles.paymentRow}>
              <View style={[styles.paymentIcon, { backgroundColor: getPaymentColor(mockOrder.paymentMethod) + '20' }]}>
                <Text style={styles.paymentIconText}>{getPaymentIcon(mockOrder.paymentMethod)}</Text>
              </View>
              <Text style={styles.paymentName}>{getPaymentLabel(mockOrder.paymentMethod)}</Text>
              <View style={[styles.paymentStatusBadge, { backgroundColor: getPaymentStatusColor(mockOrder.paymentStatus) + '20' }]}>
                <Text style={[styles.paymentStatusText, { color: getPaymentStatusColor(mockOrder.paymentStatus) }]}>
                  {getPaymentStatusLabel(mockOrder.paymentStatus)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Endereço de entrega</Text>
          <View style={styles.addressCard}>
            <Ionicons name="location" size={20} color="#007AFF" style={styles.addressIcon} />
            <View style={styles.addressInfo}>
              <Text style={styles.addressLine}>
                {mockOrder.deliveryAddress.street}, {mockOrder.deliveryAddress.number}
              </Text>
              {mockOrder.deliveryAddress.complement && (
                <Text style={styles.addressComplement}>{mockOrder.deliveryAddress.complement}</Text>
              )}
              <Text style={styles.addressLine}>
                {mockOrder.deliveryAddress.neighborhood} - {mockOrder.deliveryAddress.city}/{mockOrder.deliveryAddress.state}
              </Text>
              <Text style={styles.addressLine}>{mockOrder.deliveryAddress.zipCode}</Text>
            </View>
          </View>
          {mockOrder.notes && (
            <View style={styles.notesCard}>
              <Ionicons name="chatbubble" size={16} color="#8E8E93" style={{ marginRight: 8 }} />
              <Text style={styles.notesText}>{mockOrder.notes}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        {['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(mockOrder.status) && (
          <View style={styles.actionsContainer}>
            <Button
              title="Acompanhar entrega"
              variant="primary"
              size="lg"
              fullWidth
              leftIcon={<Ionicons name="bicycle" size={20} color="#fff" />}
              onPress={() => router.push(`/order/${id}/tracking`)}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'pending': return '#FF9500';
    case 'confirmed': return '#007AFF';
    case 'preparing': return '#BF5AF2';
    case 'ready': return '#34C759';
    case 'out_for_delivery': return '#007AFF';
    case 'delivered': return '#34C759';
    case 'cancelled': return '#FF3B30';
    case 'disputed': return '#FF9500';
    default: return '#8E8E93';
  }
};

const getStatusLabel = (status: OrderStatus) => {
  switch (status) {
    case 'pending': return 'Pendente';
    case 'confirmed': return 'Confirmado';
    case 'preparing': return 'Preparando';
    case 'ready': return 'Pronto';
    case 'out_for_delivery': return 'Saiu para entrega';
    case 'delivered': return 'Entregue';
    case 'cancelled': return 'Cancelado';
    case 'disputed': return 'Em disputa';
    default: return status;
  }
};

const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case 'pending': return 'time';
    case 'confirmed': return 'checkmark-circle';
    case 'preparing': return 'restaurant';
    case 'ready': return 'checkmark-done';
    case 'out_for_delivery': return 'bicycle';
    case 'delivered': return 'checkmark-done-circle';
    case 'cancelled': return 'close-circle';
    case 'disputed': return 'alert-circle';
    default: return 'help-circle';
  }
};

const getPaymentColor = (method: string) => {
  switch (method) {
    case 'pix': return '#34C759';
    case 'credit_card': return '#007AFF';
    case 'debit_card': return '#BF5AF2';
    case 'cash': return '#FF9500';
    case 'mercado_pago': return '#009EE3';
    default: return '#8E8E93';
  }
};

const getPaymentIcon = (method: string) => {
  switch (method) {
    case 'pix': return 'PIX';
    case 'credit_card': return '💳';
    case 'debit_card': return '💳';
    case 'cash': return '💵';
    case 'mercado_pago': return 'MP';
    default: return '?';
  }
};

const getPaymentLabel = (method: string) => {
  switch (method) {
    case 'pix': return 'PIX';
    case 'credit_card': return 'Cartão de crédito';
    case 'debit_card': return 'Cartão de débito';
    case 'cash': return 'Dinheiro';
    case 'mercado_pago': return 'Mercado Pago';
    default: return method;
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'paid': return '#34C759';
    case 'pending': return '#FF9500';
    case 'failed': return '#FF3B30';
    case 'refunded': return '#BF5AF2';
    case 'partial_refund': return '#FF9500';
    default: return '#8E8E93';
  }
};

const getPaymentStatusLabel = (status: string) => {
  switch (status) {
    case 'paid': return 'Pago';
    case 'pending': return 'Pendente';
    case 'failed': return 'Falhou';
    case 'refunded': return 'Estornado';
    case 'partial_refund': return 'Estorno parcial';
    default: return status;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statusInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
    color: '#8E8E93',
  },
  currentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    paddingBottom: 24,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
  },
  stepLineContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  stepLine: {
    position: 'absolute',
    width: 2,
    height: '100%',
    top: 24,
    backgroundColor: '#E5E5EA',
  },
  stepLineCompleted: {
    backgroundColor: '#34C759',
  },
  stepLineActive: {
    backgroundColor: '#34C759',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  stepDotCompleted: {
    backgroundColor: '#34C759',
  },
  stepDotCurrent: {
    backgroundColor: '#007AFF',
    borderWidth: 3,
    borderColor: '#fff',
  },
  stepLabel: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
    width: 60,
  },
  stepLabelCompleted: {
    color: '#34C759',
    fontWeight: '600',
  },
  stepLabelCurrent: {
    color: '#007AFF',
    fontWeight: '700',
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#E6F4FE',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  etaLabel: {
    fontSize: 12,
    color: '#007AFF',
  },
  etaTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  restaurantImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  restaurantCategory: {
    fontSize: 13,
    color: '#8E8E93',
  },
  callButton: {
    padding: 10,
    backgroundColor: '#E6F4FE',
    borderRadius: 12,
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  itemQuantity: {
    fontSize: 13,
    color: '#8E8E93',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  summaryList: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    marginTop: 8,
  },
  paymentMethod: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentIconText: {
    fontSize: 16,
  },
  paymentName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  paymentStatusBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addressCard: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  addressIcon: {
    marginTop: 2,
  },
  addressInfo: {
    flex: 1,
    gap: 2,
  },
  addressLine: {
    fontSize: 15,
    color: '#1D1D1F',
  },
  addressComplement: {
    fontSize: 13,
    color: '#8E8E93',
  },
  notesCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
  },
  notesText: {
    fontSize: 13,
    color: '#1D1D1F',
    flex: 1,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
});