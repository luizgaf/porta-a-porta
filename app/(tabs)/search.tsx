'use client';

import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, FlatList, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { Seller, Product } from '@/types';
import { Card } from '@/components/ui';

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
  {
    id: 'seller-4',
    userId: 'user-4',
    communityId: 'comunidade-1',
    businessName: 'Cantina Italiana',
    description: 'Massas frescas e molhos caseiros',
    category: 'Italiano',
    address: 'Rua Wisard, 321 - Vila Madalena',
    location: { latitude: -23.5495, longitude: -46.6323 },
    phone: '(11) 99999-4444',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400',
    coverImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    isApproved: true,
    isOpen: true,
    operatingHours: {
      monday: { isOpen: true, openTime: '11:30', closeTime: '22:00' },
      tuesday: { isOpen: true, openTime: '11:30', closeTime: '22:00' },
      wednesday: { isOpen: true, openTime: '11:30', closeTime: '22:00' },
      thursday: { isOpen: true, openTime: '11:30', closeTime: '22:00' },
      friday: { isOpen: true, openTime: '11:30', closeTime: '23:00' },
      saturday: { isOpen: true, openTime: '11:30', closeTime: '23:00' },
      sunday: { isOpen: true, openTime: '11:30', closeTime: '22:00' },
    },
    deliveryFee: 5.99,
    minimumOrder: 35,
    commissionRate: 0.15,
    rating: 4.7,
    reviewCount: 156,
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
  {
    id: 'prod-7',
    sellerId: 'seller-4',
    communityId: 'comunidade-1',
    name: 'Spaghetti Carbonara',
    description: 'Espaguete, guanciale, ovos, queijo pecorino, pimenta preta',
    price: 38.90,
    category: 'Massas',
    imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
    isAvailable: true,
    tags: ['popular'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod-8',
    sellerId: 'seller-4',
    communityId: 'comunidade-1',
    name: 'Lasanha à Bolonhesa',
    description: 'Massa fresca, molho bolonhesa, bechamel, parmesão',
    price: 42.90,
    category: 'Massas',
    imageUrl: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400',
    isAvailable: true,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const recentSearches = ['Pizza', 'Hambúrguer', 'Japonês', 'Italiano'];
const popularSearches = ['Pizza margherita', 'X-Burger', 'Sushi', 'Carbonara', 'Açaí', 'Pastel'];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ sellers: Seller[]; products: Product[] }>({ sellers: [], products: [] });
  const [showResults, setShowResults] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'sellers' | 'products'>('sellers');

  useEffect(() => {
    if (query.length >= 2) {
      const filteredSellers = mockSellers.filter(
        (s) =>
          s.businessName.toLowerCase().includes(query.toLowerCase()) ||
          s.category.toLowerCase().includes(query.toLowerCase()) ||
          s.description.toLowerCase().includes(query.toLowerCase())
      );
      const filteredProducts = mockProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults({ sellers: filteredSellers, products: filteredProducts });
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [query]);

  const clearSearch = () => {
    setQuery('');
    setShowResults(false);
  };

  const handleSearchSubmit = () => {
    if (query.trim()) {
      setShowResults(true);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar restaurantes, pratos, culinárias..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearchSubmit}
          autoFocus
          autoCapitalize="none"
          placeholderTextColor="#8E8E93"
        />
        {query && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close" size={24} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {showResults ? (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {searchResults.sellers.length + searchResults.products.length} resultados para "{query}"
            </Text>
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'sellers' && styles.tabActive]}
                onPress={() => setSelectedTab('sellers')}
              >
                <Text style={[styles.tabText, selectedTab === 'sellers' && styles.tabTextActive]}>
                  Restaurantes ({searchResults.sellers.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'products' && styles.tabActive]}
                onPress={() => setSelectedTab('products')}
              >
                <Text style={[styles.tabText, selectedTab === 'products' && styles.tabTextActive]}>
                  Pratos ({searchResults.products.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {selectedTab === 'sellers' ? (
            <FlatList
              data={searchResults.sellers}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.sellerItem}
                  onPress={() => router.push(`/seller/${item.id}`)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: item.imageUrl }} style={styles.sellerItemImage} resizeMode="cover" />
                  <View style={styles.sellerItemInfo}>
                    <Text style={styles.sellerItemName}>{item.businessName}</Text>
                    <Text style={styles.sellerItemCategory}>{item.category}</Text>
                    <View style={styles.sellerItemMeta}>
                      <View style={styles.metaRow}>
                        <Ionicons name="star" size={14} color="#FFD600" />
                        <Text style={styles.metaText}>{item.rating}</Text>
                        <Text style={styles.metaText}>({item.reviewCount})</Text>
                      </View>
                      <View style={styles.metaRow}>
                        <Ionicons name="bicycle" size={14} color="#8E8E93" />
                        <Text style={styles.metaText}>R$ {item.deliveryFee.toFixed(2)}</Text>
                        <Text style={styles.metaText}>•</Text>
                        <Text style={styles.metaText}>{item.minimumOrder} min</Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="restaurant-outline" size={48} color="#C7C7CC" />
                  <Text style={styles.emptyText}>Nenhum restaurante encontrado</Text>
                  <Text style={styles.emptySubtext}>Tente outro termo de busca</Text>
                </View>
              }
            />
          ) : (
            <FlatList
              data={searchResults.products}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const seller = mockSellers.find((s) => s.id === item.sellerId);
                return (
                  <TouchableOpacity
                    style={styles.productItem}
                    onPress={() => router.push(`/product/${item.id}`)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: item.imageUrl }} style={styles.productItemImage} resizeMode="cover" />
                    <View style={styles.productItemInfo}>
                      <Text style={styles.productItemName}>{item.name}</Text>
                      {seller && <Text style={styles.productItemSeller}>{seller.businessName}</Text>}
                      <Text style={styles.productItemPrice}>R$ {item.price.toFixed(2)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="fast-food-outline" size={48} color="#C7C7CC" />
                  <Text style={styles.emptyText}>Nenhum prato encontrado</Text>
                  <Text style={styles.emptySubtext}>Tente outro termo de busca</Text>
                </View>
              }
            />
          )}
        </View>
      ) : (
        <ScrollView style={styles.suggestionsContainer} showsVerticalScrollIndicator={false}>
          {recentSearches.length > 0 && (
            <View style={styles.suggestionSection}>
              <View style={styles.suggestionHeader}>
                <Text style={styles.suggestionTitle}>Buscas recentes</Text>
                <TouchableOpacity onPress={() => {}}>
                  <Text style={styles.clearText}>Limpar</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.suggestionTags}>
                {recentSearches.map((search) => (
                  <TouchableOpacity
                    key={search}
                    style={styles.suggestionTag}
                    onPress={() => setQuery(search)}
                  >
                    <Ionicons name="time" size={16} color="#8E8E93" />
                    <Text style={styles.suggestionTagText}>{search}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.suggestionSection}>
            <Text style={styles.suggestionTitle}>Populares</Text>
            <View style={styles.suggestionTags}>
              {popularSearches.map((search) => (
                <TouchableOpacity
                  key={search}
                  style={styles.suggestionTag}
                  onPress={() => setQuery(search)}
                >
                  <Ionicons name="trending-up" size={16} color="#FF9500" />
                  <Text style={styles.suggestionTagText}>{search}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.suggestionSection}>
            <Text style={styles.suggestionTitle}>Categorias</Text>
            <View style={styles.categoriesGrid}>
              {[
                { name: 'Pizza', icon: 'pizza-outline' as const, color: '#FF6B6B' },
                { name: 'Hambúrguer', icon: 'fast-food-outline' as const, color: '#FF9500' },
                { name: 'Japonês', icon: 'fish-outline' as const, color: '#007AFF' },
                { name: 'Italiano', icon: 'wine-outline' as const, color: '#34C759' },
                { name: 'Brasileiro', icon: 'leaf-outline' as const, color: '#30D158' },
                { name: 'Saudável', icon: 'fitness-outline' as const, color: '#BF5AF2' },
                { name: 'Doces', icon: 'ice-cream-outline' as const, color: '#FF2D92' },
                { name: 'Bebidas', icon: 'wine-outline' as const, color: '#5856D6' },
              ].map((cat) => (
                <TouchableOpacity
                  key={cat.name}
                  style={[styles.categoryCard, { borderColor: cat.color }]}
                  onPress={() => setQuery(cat.name)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.categoryCardIcon, { backgroundColor: cat.color + '20' }]}>
                    <Ionicons name={cat.icon} size={24} color={cat.color} />
                  </View>
                  <Text style={styles.categoryCardText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#1D1D1F',
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 12,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  tabTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sellerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  sellerItemImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  sellerItemInfo: {
    flex: 1,
    gap: 4,
  },
  sellerItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  sellerItemCategory: {
    fontSize: 13,
    color: '#8E8E93',
  },
  sellerItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  productItemImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  productItemInfo: {
    flex: 1,
    gap: 2,
  },
  productItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  productItemSeller: {
    fontSize: 13,
    color: '#8E8E93',
  },
  productItemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginLeft: 92,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  suggestionSection: {
    marginBottom: 32,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  clearText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  suggestionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  suggestionTagText: {
    fontSize: 14,
    color: '#1D1D1F',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  categoryCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryCardText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
  },
});