import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Button, Card } from '../../components/ui';

export default function RoleSelectionScreen() {
  const router = useRouter();

  const roles = [
    {
      id: 'COMPRADOR',
      label: 'Comprador',
      description: 'Quero comprar dos vizinhos',
      icon: '🛒',
      color: '#1E3A5F',
    },
    {
      id: 'VENDEDOR',
      label: 'Vendedor',
      description: 'Quero vender meus produtos',
      icon: '🏪',
      color: '#28A745',
    },
  ];

  const handleSelectRole = (roleId: string) => {
    router.push(`/(auth)/community-selection?role=${roleId}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Como você vai usar o app?</Text>
          <Text style={styles.subtitle}>Escolha seu perfil para continuar</Text>
        </View>

        <View style={styles.options}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[styles.optionCard, { borderColor: role.color }]}
              onPress={() => handleSelectRole(role.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.optionIcon}>{role.icon}</Text>
              <Text style={[styles.optionLabel, { color: role.color }]}>{role.label}</Text>
              <Text style={styles.optionDescription}>{role.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.footerText}>
          Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1E3A5F',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6C7A8A',
    textAlign: 'center',
  },
  options: {
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderRadius: 16,
    gap: 16,
  },
  optionIcon: {
    fontSize: 36,
  },
  optionLabel: {
    fontSize: 20,
    fontWeight: '700',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6C7A8A',
    marginTop: 2,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#9AA8B8',
    textAlign: 'center',
    lineHeight: 18,
  },
});