'use client';

import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { Button, Card } from '@/components/ui';
import { useState } from 'react';
import { UserRole } from '@/types';

const roles: { id: UserRole; title: string; description: string; icon: string; color: string }[] = [
  {
    id: 'customer',
    title: 'Cliente',
    description: 'Comprar de vendedores locais\nem qualquer comunidade',
    icon: '🛍️',
    color: '#007AFF',
  },
  {
    id: 'seller',
    title: 'Vendedor',
    description: 'Vender seus produtos\nna sua comunidade',
    icon: '🏪',
    color: '#34C759',
  },
  {
    id: 'moderator',
    title: 'Moderador',
    description: 'Gerenciar uma comunidade\naprovar vendedores e mediar',
    icon: '🛡️',
    color: '#FF9500',
  },
];

export default function RoleSelectionScreen() {
  const { user, updateUser } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleContinue = () => {
    if (!selectedRole) return;

    updateUser({ role: selectedRole });

    if (selectedRole === 'customer') {
      router.replace('/(tabs)');
    } else {
      router.push('/(auth)/community-selection');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Voltar">
          <Text style={styles.backText}>‹ Voltar</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Como você quer usar?</Text>
          <Text style={styles.subtitle}>Escolha seu papel na plataforma</Text>
        </View>

        <View style={styles.rolesContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              onPress={() => setSelectedRole(role.id)}
              style={[
                styles.roleCard,
                selectedRole === role.id && styles.roleCardSelected,
                { borderColor: role.color },
              ]}
              activeOpacity={0.8}
            >
              <View style={[styles.roleIconContainer, { backgroundColor: role.color + '20' }]}>
                <Text style={styles.roleIcon}>{role.icon}</Text>
              </View>
              <View style={styles.roleInfo}>
                <Text style={[styles.roleTitle, { color: role.color }]}>{role.title}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </View>
              {selectedRole === role.id && (
                <View style={[styles.checkmark, { backgroundColor: role.color }]}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.bottomButton}>
        <Button
          title="Continuar"
          variant="primary"
          size="lg"
          fullWidth
          disabled={!selectedRole}
          onPress={handleContinue}
        />
      </View>
    </View>
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
    marginBottom: 32,
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
  rolesContainer: {
    gap: 16,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  roleCardSelected: {
    borderWidth: 3,
    backgroundColor: '#F0F8FF',
  },
  roleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleIcon: {
    fontSize: 28,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomButton: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
});