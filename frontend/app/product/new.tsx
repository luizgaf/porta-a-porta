import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { Button, Input, Card } from '../../components/ui';
import { CATEGORIAS } from '../../constants';

export default function NewProductScreen() {
  const router = useRouter();
  const { isVendedor } = useAuth();
  const { createProduto } = useApi();

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    categoria: 'Alimentos',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  if (!isVendedor) {
    return (
      <View style={styles.unauthorizedContainer}>
        <Ionicons name="lock-closed-outline" size={48} color="#D1E3F0" />
        <Text style={styles.unauthorizedText}>Acesso restrito a vendedores</Text>
        <Button title="Voltar" onPress={() => router.back()} variant="outline" style={styles.backButton} />
      </View>
    );
  }

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.nome.trim()) errors.nome = 'Nome é obrigatório (mín. 2 caracteres)';
    else if (formData.nome.length < 2) errors.nome = 'Nome deve ter pelo menos 2 caracteres';
    if (!formData.preco || parseFloat(formData.preco) <= 0) errors.preco = 'Preço deve ser maior que zero';
    if (!formData.categoria) errors.categoria = 'Categoria é obrigatória';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setCreating(true);
    try {
      await createProduto({
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || undefined,
        preco: parseFloat(formData.preco),
        categoria: formData.categoria,
      });
      Alert.alert('Sucesso!', 'Produto criado com sucesso', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/seller') },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao criar produto');
    } finally {
      setCreating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Produto</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.formCard}>
          <Input
            label="Nome do Produto *"
            placeholder="Ex: Pão de Queijo Caseiro"
            value={formData.nome}
            onChangeText={(v) => setFormData(prev => ({ ...prev, nome: v }))}
            error={formErrors.nome}
            autoCapitalize="words"
            style={styles.input}
          />

          <Input
            label="Descrição"
            placeholder="Descreva seu produto, ingredientes, etc."
            value={formData.descricao}
            onChangeText={(v) => setFormData(prev => ({ ...prev, descricao: v }))}
            multiline
            numberOfLines={4}
            style={styles.input}
          />

          <Input
            label="Preço (R$) *"
            placeholder="0,00"
            value={formData.preco}
            onChangeText={(v) => setFormData(prev => ({ ...prev, preco: v }))}
            error={formErrors.preco}
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <Text style={styles.sectionLabel}>Categoria *</Text>
          <View style={styles.categoriaGrid}>
            {CATEGORIAS.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoriaOption,
                  formData.categoria === cat && styles.categoriaOptionSelected,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, categoria: cat }))}
              >
                <Text
                  style={[
                    styles.categoriaOptionText,
                    formData.categoria === cat && styles.categoriaOptionTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
            {formErrors.categoria && (
              <Text style={styles.errorText}>{formErrors.categoria}</Text>
            )}
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color="#17A2B8" />
            <Text style={styles.infoText}>
              Lembre-se: você pode ter no máximo 15 produtos ativos simultaneamente.
              Produtos pausados não contam para este limite.
            </Text>
          </View>

          <Button
            title="Criar Produto"
            onPress={handleCreate}
            loading={creating}
            fullWidth
            size="lg"
            style={styles.createButton}
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
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  unauthorizedText: {
    fontSize: 16,
    color: '#6C7A8A',
    textAlign: 'center',
  },
  backButton: {
    width: 200,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EFF5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  formCard: {
    borderWidth: 1,
    borderColor: '#E8EFF5',
  },
  input: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 12,
    marginTop: 8,
  },
  categoriaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoriaOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1E3F0',
    backgroundColor: '#FFFFFF',
  },
  categoriaOptionSelected: {
    borderColor: '#1E3A5F',
    backgroundColor: '#E6F4FE',
  },
  categoriaOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3D4A5A',
  },
  categoriaOptionTextSelected: {
    color: '#1E3A5F',
    fontWeight: '600',
  },
  errorText: {
    marginTop: 8,
    color: '#DC3545',
    fontSize: 12,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: '#E6F4FE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1E3F0',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#1E3A5F',
    flex: 1,
    lineHeight: 18,
  },
  createButton: {
    marginTop: 8,
  },
});