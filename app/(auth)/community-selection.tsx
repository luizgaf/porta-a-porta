'use client';

import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useCommunityStore } from '@/store/communityStore';
import { Button, Input, Card } from '@/components/ui';
import { useState, useEffect } from 'react';
import { Community } from '@/types';

const mockCommunities: Community[] = [
  {
    id: 'comunidade-1',
    name: 'Vila Madalena',
    description: 'Comunidade vibrante com ótimos restaurantes e bares',
    location: { latitude: -23.5505, longitude: -46.6333 },
    radius: 3,
    imageUrl: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400',
    moderatorIds: ['mod-1'],
    settings: {
      deliveryFee: 5.99,
      commissionRate: 0.15,
      minimumOrder: 20,
      operatingHours: {
        monday: { isOpen: true, openTime: '08:00', closeTime: '23:00' },
        tuesday: { isOpen: true, openTime: '08:00', closeTime: '23:00' },
        wednesday: { isOpen: true, openTime: '08:00', closeTime: '23:00' },
        thursday: { isOpen: true, openTime: '08:00', closeTime: '23:00' },
        friday: { isOpen: true, openTime: '08:00', closeTime: '00:00' },
        saturday: { isOpen: true, openTime: '09:00', closeTime: '00:00' },
        sunday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
      },
      deliveryZones: [],
      acceptedPaymentMethods: ['pix', 'credit_card', 'debit_card', 'cash'],
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'comunidade-2',
    name: 'Pinheiros',
    description: 'Centro gastronômico com diversidade culinária',
    location: { latitude: -23.5629, longitude: -46.6934 },
    radius: 2.5,
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400',
    moderatorIds: ['mod-2'],
    settings: {
      deliveryFee: 4.99,
      commissionRate: 0.12,
      minimumOrder: 15,
      operatingHours: {
        monday: { isOpen: true, openTime: '07:00', closeTime: '22:00' },
        tuesday: { isOpen: true, openTime: '07:00', closeTime: '22:00' },
        wednesday: { isOpen: true, openTime: '07:00', closeTime: '22:00' },
        thursday: { isOpen: true, openTime: '07:00', closeTime: '22:00' },
        friday: { isOpen: true, openTime: '07:00', closeTime: '23:00' },
        saturday: { isOpen: true, openTime: '08:00', closeTime: '23:00' },
        sunday: { isOpen: true, openTime: '08:00', closeTime: '21:00' },
      },
      deliveryZones: [],
      acceptedPaymentMethods: ['pix', 'credit_card', 'debit_card', 'cash', 'mercado_pago'],
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'comunidade-3',
    name: 'Moema',
    description: 'Comunidade residencial com comércio local forte',
    location: { latitude: -23.6044, longitude: -46.6653 },
    radius: 2,
    imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
    moderatorIds: ['mod-3'],
    settings: {
      deliveryFee: 6.99,
      commissionRate: 0.18,
      minimumOrder: 25,
      operatingHours: {
        monday: { isOpen: true, openTime: '08:00', closeTime: '22:00' },
        tuesday: { isOpen: true, openTime: '08:00', closeTime: '22:00' },
        wednesday: { isOpen: true, openTime: '08:00', closeTime: '22:00' },
        thursday: { isOpen: true, openTime: '08:00', closeTime: '22:00' },
        friday: { isOpen: true, openTime: '08:00', closeTime: '23:00' },
        saturday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
        sunday: { isOpen: false, openTime: '09:00', closeTime: '20:00' },
      },
      deliveryZones: [],
      acceptedPaymentMethods: ['pix', 'credit_card', 'cash'],
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function CommunitySelectionScreen() {
  const { user, updateUser } = useAuthStore();
  const { setCurrentCommunity } = useCommunityStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>(mockCommunities);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');

  useEffect(() => {
    const filtered = mockCommunities.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCommunities(filtered);
  }, [searchQuery]);

  const handleSelectCommunity = (community: Community) => {
    setSelectedCommunity(community);
  };

  const handleContinue = () => {
    if (!selectedCommunity) return;

    updateUser({ communities: [...(user?.communities || []), selectedCommunity.id] });
    setCurrentCommunity(selectedCommunity);
    router.replace('/(tabs)');
  };

  const handleCreateCommunity = () => {
    if (!newCommunityName.trim()) {
      Alert.alert('Erro', 'Digite um nome para a comunidade');
      return;
    }
    // In real app, this would call an API to create the community
    Alert.alert('Sucesso', `Comunidade "${newCommunityName}" criada!`);
    setIsCreating(false);
    setNewCommunityName('');
  };

  const userRole = user?.role;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Voltar">
          <Text style={styles.backText}>‹ Voltar</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>
            {userRole === 'seller' ? 'Onde você vai vender?' : 'Qual comunidade gerenciar?'}
          </Text>
          <Text style={styles.subtitle}>
            {userRole === 'seller'
              ? 'Selecione a comunidade para cadastrar seu negócio'
              : 'Selecione a comunidade que você vai moderar'}
          </Text>
        </View>

        {!isCreating ? (
          <>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar comunidade..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.listContainer}>
              {filteredCommunities.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Nenhuma comunidade encontrada</Text>
                  <Text style={styles.emptySubtext}>Tente outro termo de busca</Text>
                </View>
              ) : (
                filteredCommunities.map((community) => (
                  <TouchableOpacity
                    key={community.id}
                    onPress={() => handleSelectCommunity(community)}
                    style={[
                      styles.communityCard,
                      selectedCommunity?.id === community.id && styles.communityCardSelected,
                    ]}
                    activeOpacity={0.8}
                  >
                    <View style={styles.communityImageContainer}>
                      <Image
                        source={{ uri: community.imageUrl }}
                        style={styles.communityImage}
                        resizeMode="cover"
                      />
                      {selectedCommunity?.id === community.id && (
                        <View style={styles.checkOverlay}>
                          <Text style={styles.checkText}>✓</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.communityInfo}>
                      <Text style={styles.communityName}>{community.name}</Text>
                      <Text style={styles.communityDescription}>{community.description}</Text>
                      <View style={styles.communityMeta}>
                        <Text style={styles.metaText}>📍 {community.radius}km de raio</Text>
                        <Text style={styles.metaText}>💰 Taxa: R$ {community.settings.deliveryFee.toFixed(2)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>

            <TouchableOpacity style={styles.createCommunityButton} onPress={() => setIsCreating(true)}>
              <Text style={styles.createCommunityText}>+ Criar nova comunidade</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.createForm}>
            <Text style={styles.createLabel}>Nome da comunidade</Text>
            <TextInput
              style={styles.createInput}
              placeholder="Ex: Vila Mariana"
              value={newCommunityName}
              onChangeText={setNewCommunityName}
              autoCapitalize="words"
            />
            <Text style={styles.createHint}>
              Como moderador, você será responsável por aprovar vendedores, mediar conflitos
              e gerenciar as configurações da comunidade.
            </Text>
            <View style={styles.createButtons}>
              <Button title="Cancelar" variant="ghost" onPress={() => setIsCreating(false)} />
              <Button title="Criar" variant="primary" onPress={handleCreateCommunity} />
            </View>
          </View>
        )}
      </View>

      {!isCreating && (
        <View style={styles.bottomButton}>
          <Button
            title={selectedCommunity ? 'Confirmar e continuar' : 'Selecionar uma comunidade'}
            variant={selectedCommunity ? 'primary' : 'outline'}
            size="lg"
            fullWidth
            disabled={!selectedCommunity}
            onPress={handleContinue}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1D1D1F',
  },
  listContainer: {
    flex: 1,
    gap: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  communityCard: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    backgroundColor: '#fff',
  },
  communityCardSelected: {
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  communityImageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  communityImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  checkOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  communityInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  communityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  communityDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  communityMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  createCommunityButton: {
    marginTop: 24,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#007AFF',
    borderRadius: 12,
  },
  createCommunityText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  createForm: {
    gap: 16,
  },
  createLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  createInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1D1D1F',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  createHint: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  createButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  bottomButton: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
});