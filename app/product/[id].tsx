'use client';

import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/components/ui';
import { useCartStore } from '@/store/cartStore';
import { Product } from '@/types';
import { useState } from 'react';

const mockProduct: Product = {
  id: 'prod-1',
  sellerId: 'seller-1',
  communityId: 'comunidade-1',
  name: 'Pizza Margherita',
  description: 'Molho de tomate san marzano, mussarela de búfala DOP, manjericão fresco, azeite extravirgem',
  price: 42.90,
  category: 'Pizzas Tradicionais',
  imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
  isAvailable: true,
  tags: ['vegetariana', 'popular'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSeller = {
  id: 'seller-1',
  businessName: 'Pizza do João',
  category: 'Pizza',
  rating: 4.8,
  reviewCount: 245,
  deliveryFee: 5.99,
  minimumOrder: 30,
  imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addItem, getTotal } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const handleAddToCart = () => {
    addItem(mockProduct, quantity, notes);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        {/* Product Image */}
        <Image source={{ uri: mockProduct.imageUrl }} style={styles.productImage} resizeMode="cover" />

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <View style={styles.sellerInfo}>
              <Image source={{ uri: mockSeller.imageUrl }} style={styles.sellerAvatar} resizeMode="cover" />
              <View>
                <Text style={styles.sellerName}>{mockSeller.businessName}</Text>
                <Text style={styles.sellerCategory}>{mockSeller.category} • {mockSeller.rating} ⭐ ({mockSeller.reviewCount})</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.favoriteButton}>
              <Ionicons name="heart-outline" size={24} color="#1D1D1F" />
            </TouchableOpacity>
          </View>

          <Text style={styles.productName}>{mockProduct.name}</Text>
          <Text style={styles.productPrice}>R$ {mockProduct.price.toFixed(2)}</Text>

          {mockProduct.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {mockProduct.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.description}>{mockProduct.description}</Text>

          <View style={styles.divider} />

          {/* Seller Info */}
          <View style={styles.sellerSection}>
            <Text style={styles.sectionTitle}>Sobre o restaurante</Text>
            <View style={styles.sellerDetail}>
              <Image source={{ uri: mockSeller.imageUrl }} style={styles.sellerImage} resizeMode="cover" />
              <View style={styles.sellerDetailInfo}>
                <Text style={styles.sellerDetailName}>{mockSeller.businessName}</Text>
                <Text style={styles.sellerDetailMeta}>
                  🚚 Entrega: R$ {mockSeller.deliveryFee.toFixed(2)} • ⏱️ {mockSeller.minimumOrder} min • 💰 Mín. R$ {mockSeller.minimumOrder}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>R$ {(mockProduct.price * quantity).toFixed(2)}</Text>
        </View>
        <Button
          title="Adicionar ao carrinho"
          variant="primary"
          size="lg"
          onPress={handleAddToCart}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  productImage: {
    width: '100%',
    height: 280,
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  sellerCategory: {
    fontSize: 12,
    color: '#8E8E93',
  },
  favoriteButton: {
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E6F4FE',
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  description: {
    fontSize: 15,
    color: '#1D1D1F',
    lineHeight: 22,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  sellerSection: {
    marginTop: 8,
  },
  sellerDetail: {
    flexDirection: 'row',
    gap: 12,
  },
  sellerImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  sellerDetailInfo: {
    flex: 1,
  },
  sellerDetailName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  sellerDetailMeta: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
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
  priceContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1F',
  },
});