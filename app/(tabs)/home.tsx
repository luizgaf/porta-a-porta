'use client';

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useCommunityStore } from '@/store/communityStore';
import { Button, Card, Avatar } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { Community, Seller, Product } from '@/types';

const mockSellers: Seller[] = [
  {
    id: 'seller-1',
    userId: 'user-1',
    communityId: 'comunidade-1',
    businessName: 'Pizza do João',
    description: 'Pizzas artesanais com fermentação natural',
    category: 'Pizza',
    address: 'Rua Aspicuelta, 123 - Vila Madalena',
    location: { latitude: -23.5505, longitude: -46.6333 },
    phone: '(11) 99999-1111',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
    coverImageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
    isApproved: true,
    isOpen: true,
    operatingHours: {
      monday: { isOpen: false, openTime: '18:00', closeTime: '23:00' },
      tuesday: { isOpen: true, openTime: '18:00', closeTime: '23:00' },
      wednesday: { isOpen: true, openTime: '18:00', closeTime: '23:00' },
      thursday: { isOpen: true, openTime: '18:00', closeTime: '23:00' },
      friday: { isOpen: true, openTime: '18:00', closeTime: '00:00' },
      saturday: { isOpen: true, openTime: '18:00', closeTime: '00:00' },
      sunday: { isOpen: true, openTime: '18:00', closeTime: '22:00' },
    },
    deliveryFee: 5.99,
    minimumOrder: 30,
    commissionRate: 0.15,
    rating: 4.8,
    reviewCount: 245,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'seller-2',
    userId: 'user-2',
    communityId: 'comunidade-1',
    businessName: 'Hamburgueria do Bairro',
    description: 'Hambúrgueres artesanais com carne 100% bovina',
    category: 'Hambúrguer',
    address: 'Rua Harmonia, 456 - Vila Madalena',
    location: { latitude: -23.5515, longitude: -46.6343 },
    phone: '(11) 99999-2222',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    coverImageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    isApproved: true,
    isOpen: true,
    operatingHours: {
      monday: { isOpen: true, openTime: '11:30', closeTime: '23:00' },
      tuesday: { isOpen: true, openTime: '11:30', closeTime: '23:00' },
      wednesday: { isOpen: true, openTime: '11:30', closeTime: '23:00' },
      thursday: { isOpen: true, openTime: '11:30', closeTime: '23:00' },
      friday: { isOpen: true, openTime: '11:30', closeTime: '00:00' },
      saturday: { isOpen: true, openTime: '11:30', closeTime: '00:00' },
      sunday: { isOpen: true, openTime: '11:30', closeTime: '22:00' },
    },
    deliveryFee: 4.99,
    minimumOrder: 25,
    commissionRate: 0.15,
    rating: 4.6,
    reviewCount: 189,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'seller-3',
    userId: 'user-3',
    communityId: 'comunidade-1',
    businessName: 'Sushi da Vila',
    description: 'Sushi fresco e tradicional japonês',
    category: 'Japonês',
    address: 'Rua Fradique Coutinho, 789 - Pinheiros',
    location: { latitude: -23.5629, longitude: -46.6934 },
    phone: '(11) 99999-3333',
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400',
    coverImageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
    isApproved: true,
    isOpen: true,
    operatingHours: {
      monday: { isOpen: false, openTime: '11:30', closeTime: '22:00' },
      tuesday: { isOpen: true, openTime: '11:30', closeTime: '22:00' },
      wednesday: { isOpen: true, openTime: '11:30', closeTime: '22:00' },
      thursday: { isOpen: true, openTime: '11:30', closeTime: '22:00' },
      friday: { isOpen: true, openTime: '11:30', closeTime: '23:00' },
      saturday: { isOpen: true, openTime: '11:30', closeTime: '23:00' },
      sunday: { isOpen: true, openTime: '11:30', closeTime: '21:00' },
    },
    deliveryFee: 6.99,
    minimumOrder: 40,
    commissionRate: 0.15,
    rating: 4.9,
    reviewCount: 312,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    sellerId: 'seller-1',
    communityId: 'comunidade-1',
    name: 'Pizza Margherita',
    description: 'Molho de tomate, mussarela de búfala, manjericão fresco',
    price: 42.90,
    category: 'Pizzas Tradicionais',
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    isAvailable: true,
    tags: ['vegetariana', 'popular'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod-2',
    sellerId: 'seller-1',
    communityId: 'comunidade-1',
    name: 'Pizza Pepperoni',
    description: 'Molho de tomate, mussarela, pepperoni artesanal',
    price: 48.90,
    category: 'Pizzas Tradicionais',
    imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',
    isAvailable: true,
    tags: ['popular'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod-3',
    sellerId: 'seller-2',
    communityId: 'comunidade-1',
    name: 'X-Burger Clássico',
    description: 'Hambúrguer 180g, queijo cheddar, alface, tomate, cebola, molho especial',
    price: 28.90,
    category: 'Hambúrgueres',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    isAvailable: true,
    tags: ['popular'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod-4',
    sellerId: 'seller-2',
    communityId: 'comunidade-1',
    name: 'X-Bacon',
    description: 'Hambúrguer 180g, queijo cheddar, bacon crocante, alface, tomate, molho BBQ',
    price: 34.90,
    category: 'Hambúrgueres',
    imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400',
    isAvailable: true,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod-5',
    sellerId: 'seller-3',
    communityId: 'comunidade-1',
    name: 'Combinado Sashimi (15 pcs)',
    description: 'Salmão, atum, peixe branco, polvo, camarão',
    price: 89.90,
    category: 'Combinados',
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400',
    isAvailable: true,
    tags: ['premium'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod-6',
    sellerId: 'seller-3',
    communityId: 'comunidade-1',
    name: 'Hot Roll Salmão (8 pcs)',
    description: 'Salmão, cream cheese, cebolinha, empanado e frito',
    price: 42.90,
    category: 'Quentes',
    imageUrl: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400',
    isAvailable: true,
    tags: ['popular'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const categories = [
  { id: 'all', name: 'Todos', icon: 'restaurant' },
  { id: 'pizza', name: 'Pizza', icon: 'pizza' },
  { id: 'burger', name: 'Hambúrguer', icon: 'fast-food' },
  { id: 'japanese', name: 'Japonês', icon: 'fish' },
  { id: 'brazilian', name: 'Brasileiro', icon: 'leaf' },
  { id: 'healthy', name: 'Saudável', icon: 'fitness' },
  { id: 'dessert', name: 'Doces', icon: 'ice-cream' },
  { id: 'drinks', name: 'Bebidas', icon: 'wine' },
] as const;

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { currentCommunity, setCommunitySellers } = useCommunityStore();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setCommunitySellers(mockSellers);
  }, [setCommunitySellers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const getFilteredSellers = () => {
    if (selectedCategory === 'all') return mockSellers;
    const categoryMap: Record<string, string> = {
      pizza: 'Pizza',
      burger: 'Hambúrguer',
      japanese: 'Japonês',
      brazilian: 'Brasileira',
      healthy: 'Saudável',
      dessert: 'Doces',
      drinks: 'Bebidas',
    };
    return mockSellers.filter((s) => s.category === categoryMap[selectedCategory]);
  };

  const filteredSellers = getFilteredSellers();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={20} color="#007AFF" />
            <Text style={styles.locationText}>
              {currentCommunity?.name || 'Selecione sua comunidade'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#8E8E93" />
          </View>
          <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileButton}>
            <Avatar name={user?.displayName} size="md" source={user?.photoURL ? { uri: user.photoURL } : undefined} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(tabs)/search')}>
        <Ionicons name="search" size={22} color="#8E8E93" style={styles.searchIcon} />
        <Text style={styles.searchPlaceholder}>Buscar restaurantes, pratos, culinárias...</Text>
      </TouchableOpacity>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <Text style={styles.sectionTitle}>Categorias</Text>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[
                styles.categoryButton,
                selectedCategory === cat.id && styles.categoryButtonActive,
              ]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={cat.icon}
                size={24}
                color={selectedCategory === cat.id ? '#fff' : '#007AFF'}
                style={styles.categoryIcon}
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat.id && styles.categoryTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sellers List */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Restaurantes abertos agora</Text>
          <Text style={styles.sectionCount}>{filteredSellers.length} opções</Text>
        </View>

        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sellersScroll}
        >
          {filteredSellers.map((seller) => (
            <TouchableOpacity
              key={seller.id}
              onPress={() => router.push(`/seller/${seller.id}`)}
              style={styles.sellerCard}
              activeOpacity={0.8}
            >
              <Image source={{ uri: seller.coverImageUrl || seller.imageUrl }} style={styles.sellerImage} resizeMode="cover" />
              <View style={styles.sellerImageOverlay} />
              <View style={styles.sellerCardContent}>
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>{seller.businessName}</Text>
                  <Text style={styles.sellerCategory}>{seller.category}</Text>
                </View>
                <View style={styles.sellerRating}>
                  <Ionicons name="star" size={16} color="#FFD600" />
                  <Text style={styles.ratingText}>{seller.rating}</Text>
                  <Text style={styles.reviewCount}>({seller.reviewCount})</Text>
                </View>
                <View style={styles.sellerMeta}>
                  <Text style={styles.metaText}>🚚 R$ {seller.deliveryFee.toFixed(2)}</Text>
                  <Text style={styles.metaText}>🕐 {seller.minimumOrder}min</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Popular Products */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Populares perto de você</Text>
        <View style={styles.productsGrid}>
          {mockProducts.slice(0, 6).map((product) => (
            <TouchableOpacity
              key={product.id}
              onPress={() => router.push(`/product/${product.id}`)}
              style={styles.productCard}
              activeOpacity={0.8}
            >
              <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="cover" />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>R$ {product.price.toFixed(2)}</Text>
              </View>
              {product.tags.includes('popular') && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Popular</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Communities */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Outras comunidades</Text>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.communitiesScroll}>
          {[
            { name: 'Pinheiros', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400', sellers: 42 },
            { name: 'Moema', image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400', sellers: 28 },
            { name: 'Jardins', image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400', sellers: 35 },
            { name: 'Itaim Bibi', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400', sellers: 31 },
          ].map((comm) => (
            <TouchableOpacity
              key={comm.name}
              onPress={() => router.push(`/community/${comm.name.toLowerCase()}`)}
              style={styles.communityCard}
              activeOpacity={0.8}
            >
              <Image source={{ uri: comm.image }} style={styles.communityImage} resizeMode="cover" />
              <View style={styles.communityOverlay} />
              <View style={styles.communityCardContent}>
                <Text style={styles.communityName}>{comm.name}</Text>
                <Text style={styles.communitySellers}>{comm.sellers} vendedores</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  profileButton: {
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginLeft: 4,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#8E8E93',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 16,
  },
  categoriesScroll: {
    gap: 12,
    paddingRight: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryIcon: {},
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  categoryTextActive: {
    color: '#fff',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  sellersScroll: {
    gap: 16,
    paddingRight: 20,
  },
  sellerCard: {
    width: 280,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  sellerImage: {
    width: '100%',
    height: 160,
  },
  sellerImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sellerCardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  sellerInfo: {
    marginBottom: 8,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  sellerCategory: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  sellerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  reviewCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  sellerMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    paddingRight: 20,
  },
  productCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 140,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  popularBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  communitiesScroll: {
    gap: 16,
    paddingRight: 20,
  },
  communityCard: {
    width: 160,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  communityImage: {
    width: '100%',
    height: 160,
    borderRadius: 16,
  },
  communityOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
  },
  communityCardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  communityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  communitySellers: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});