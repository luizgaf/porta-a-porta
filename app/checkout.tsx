'use client';

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, SafeAreaView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Card } from '@/components/ui';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Address } from '@/types';
import { useState, useEffect } from 'react';

const addressSchema = z.object({
  street: z.string().min(2, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado deve ter 2 letras'),
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
});

type AddressForm = z.infer<typeof addressSchema>;

const savedAddresses: Address[] = [
  {
    street: 'Rua Aspicuelta',
    number: '123',
    complement: 'Apto 45',
    neighborhood: 'Vila Madalena',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '05433-010',
  },
  {
    street: 'Rua Harmonia',
    number: '456',
    complement: '',
    neighborhood: 'Vila Madalena',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '05433-020',
  },
];

const paymentMethods = [
  { id: 'pix', name: 'PIX', icon: '🏦', color: '#34C759', description: 'Pagamento instantâneo' },
  { id: 'credit_card', name: 'Cartão de crédito', icon: '💳', color: '#007AFF', description: 'Visa, Mastercard, Elo' },
  { id: 'debit_card', name: 'Cartão de débito', icon: '💳', color: '#BF5AF2', description: 'Visa, Mastercard, Elo' },
  { id: 'cash', name: 'Dinheiro', icon: '💵', color: '#FF9500', description: 'Pagamento na entrega' },
  { id: 'mercado_pago', name: 'Mercado Pago', icon: 'MP', color: '#009EE3', description: 'Parcelado sem juros' },
];

export default function CheckoutScreen() {
  const { items, getSubtotal, getTotal, seller, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'pix' | 'credit_card' | 'debit_card' | 'cash' | 'mercado_pago'>('pix');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = getSubtotal();
  const deliveryFee = seller?.deliveryFee || 5.99;
  const total = getTotal();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: savedAddresses[0],
  });

  const onSubmitAddress = (data: AddressForm) => {
    setShowAddressForm(false);
    // In real app, save to backend
    Alert.alert('Sucesso', 'Endereço salvo com sucesso!');
  };

  const handlePlaceOrder = async () => {
    if (!savedAddresses[selectedAddressIndex]) {
      Alert.alert('Erro', 'Selecione um endereço de entrega');
      return;
    }

    setIsProcessing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create order
      const order = {
        id: `ORD-${Date.now()}`,
        items,
        total,
        address: savedAddresses[selectedAddressIndex],
        paymentMethod: selectedPaymentMethod,
        notes,
      };

      clearCart();
      router.replace(`/order/${order.id}`);
    } catch (err) {
      Alert.alert('Erro', 'Erro ao processar pedido. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color="#1D1D1F" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Finalizar pedido</Text>
          </View>

          {/* Order Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumo do pedido</Text>
            <View style={styles.itemsList}>
              {items.map((item, index) => (
                <View key={index} style={styles.summaryItem}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.product.name}</Text>
                    <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  </View>
                  <Text style={styles.itemPrice}>R$ {(item.product.price * item.quantity).toFixed(2)}</Text>
                </View>
              ))}
            </View>
            <View style={styles.divider} />
            <View style={styles.totals}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>R$ {subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Taxa de entrega</Text>
                <Text style={styles.totalValue}>R$ {deliveryFee.toFixed(2)}</Text>
              </View>
              <View style={[styles.totalRow, styles.totalFinal]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValueFinal}>R$ {total.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Delivery Address */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Endereço de entrega</Text>
              <TouchableOpacity onPress={() => { setShowAddressForm(true); reset(savedAddresses[0]); }} style={styles.addAddressButton}>
                <Ionicons name="add" size={20} color="#007AFF" />
                <Text style={styles.addAddressText}>Novo endereço</Text>
              </TouchableOpacity>
            </View>

            {showAddressForm ? (
              <View style={styles.addressForm}>
                <Input
                  name="street"
                  control={control}
                  label="Rua"
                  placeholder="Rua Aspicuelta"
                  error={errors.street?.message}
                />
                <View style={styles.formRow}>
                  <Input
                    name="number"
                    control={control}
                    label="Número"
                    placeholder="123"
                    error={errors.number?.message}
                    style={{ flex: 1 }}
                  />
                  <Input
                    name="complement"
                    control={control}
                    label="Complemento (opcional)"
                    placeholder="Apto 45"
                    style={{ flex: 2 }}
                  />
                </View>
                <View style={styles.formRow}>
                  <Input
                    name="neighborhood"
                    control={control}
                    label="Bairro"
                    placeholder="Vila Madalena"
                    error={errors.neighborhood?.message}
                    style={{ flex: 1 }}
                  />
                  <Input
                    name="city"
                    control={control}
                    label="Cidade"
                    placeholder="São Paulo"
                    error={errors.city?.message}
                    style={{ flex: 1 }}
                  />
                </View>
                <View style={styles.formRow}>
                  <Input
                    name="state"
                    control={control}
                    label="Estado"
                    placeholder="SP"
                    error={errors.state?.message}
                    style={{ flex: 1 }}
                  />
                  <Input
                    name="zipCode"
                    control={control}
                    label="CEP"
                    placeholder="05433-010"
                    keyboardType="numeric"
                    error={errors.zipCode?.message}
                    style={{ flex: 1 }}
                  />
                </View>
                <View style={styles.formButtons}>
                  <Button title="Cancelar" variant="ghost" onPress={() => setShowAddressForm(false)} />
                  <Button title="Salvar" variant="primary" onPress={handleSubmit(onSubmitAddress)} loading={isSubmitting} />
                </View>
              </View>
            ) : (
              <View style={styles.addressList}>
                {savedAddresses.map((address, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.addressCard,
                      selectedAddressIndex === index && styles.addressCardSelected,
                    ]}
                    onPress={() => setSelectedAddressIndex(index)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.addressRadio}>
                      <View style={[
                        styles.radioOuter,
                        selectedAddressIndex === index && styles.radioOuterSelected,
                      ]}>
                        {selectedAddressIndex === index && <View style={styles.radioInner} />}
                      </View>
                    </View>
                    <View style={styles.addressInfo}>
                      <Text style={styles.addressLine}>
                        {address.street}, {address.number}
                        {address.complement && `, ${address.complement}`}
                      </Text>
                      <Text style={styles.addressLine}>
                        {address.neighborhood} - {address.city}/{address.state}
                      </Text>
                      <Text style={styles.addressLine}>{address.zipCode}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Forma de pagamento</Text>
            <View style={styles.paymentList}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentCard,
                    selectedPaymentMethod === method.id && styles.paymentCardSelected,
                    { borderColor: method.color },
                  ]}
                  onPress={() => setSelectedPaymentMethod(method.id as any)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.paymentIcon, { backgroundColor: method.color + '20' }]}>
                    <Text style={styles.paymentIconText}>{method.icon}</Text>
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentName}>{method.name}</Text>
                    <Text style={styles.paymentDescription}>{method.description}</Text>
                  </View>
                  {selectedPaymentMethod === method.id && (
                    <View style={[styles.paymentCheck, { backgroundColor: method.color }]}>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações (opcional)</Text>
            <TextInput
              placeholder="Ex: Interfone 45, porta azul. Não toque a campainha."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              style={styles.notesInput}
            />
          </View>
        </ScrollView>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomPrice}>
            <Text style={styles.bottomTotalLabel}>Total</Text>
            <Text style={styles.bottomTotalPrice}>R$ {total.toFixed(2)}</Text>
          </View>
          <Button
            title={`Pagar R$ ${total.toFixed(2)}`}
            variant="primary"
            size="lg"
            fullWidth
            loading={isProcessing}
            onPress={handlePlaceOrder}
          />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16,
  },
  itemsList: {
    gap: 12,
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 8,
  },
  totals: {
    gap: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  totalFinal: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    marginTop: 8,
  },
  totalValueFinal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
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
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addAddressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  addressForm: {
    gap: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  addressList: {
    gap: 12,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  addressCardSelected: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#E6F4FE',
  },
  addressRadio: {
    marginRight: 4,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#007AFF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  addressInfo: {
    flex: 1,
    gap: 2,
  },
  addressLine: {
    fontSize: 15,
    color: '#1D1D1F',
  },
  paymentList: {
    gap: 12,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  paymentCardSelected: {
    borderWidth: 2,
    backgroundColor: '#F0F8FF',
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentIconText: {
    fontSize: 20,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  paymentDescription: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  paymentCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
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
  notesInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1D1D1F',
    borderWidth: 1,
    borderColor: 'transparent',
    textAlignVertical: 'top',
  },
});