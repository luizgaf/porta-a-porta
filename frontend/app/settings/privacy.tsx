import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui';

// Privacidade por padrão: não há opções para ligar ou desligar. As regras abaixo valem para
// todos os moradores e são aplicadas pelo servidor, sem depender de configuração.

type Regra = {
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descricao: string;
};

const GRUPOS: { titulo: string; regras: Regra[] }[] = [
  {
    titulo: 'O que os outros moradores veem',
    regras: [
      {
        icone: 'home-outline',
        titulo: 'Só o seu condomínio',
        descricao: 'Anúncios, pedidos e perfis ficam restritos aos moradores do mesmo condomínio.',
      },
      {
        icone: 'person-outline',
        titulo: 'Nome e unidade, quando necessário',
        descricao: 'Seu nome e sua unidade aparecem apenas nos seus anúncios e para o vendedor dos seus pedidos, para a entrega. Seu e-mail e seu CPF não são exibidos a outros moradores.',
      },
    ],
  },
  {
    titulo: 'Avaliações e denúncias',
    regras: [
      {
        icone: 'star-outline',
        titulo: 'Avaliações anônimas',
        descricao: 'O vendedor e os demais moradores veem a nota e o comentário, nunca quem avaliou. A avaliação não pode ser editada depois do envio.',
      },
      {
        icone: 'flag-outline',
        titulo: 'Denúncias anônimas',
        descricao: 'Ninguém vê quem denunciou, nem o vendedor nem o síndico. O vínculo com o autor serve apenas para contar denúncias distintas e impedir repetições.',
      },
      {
        icone: 'document-text-outline',
        titulo: 'Moderação registrada',
        descricao: 'Toda decisão do síndico (suspender ou restaurar um anúncio, remover uma avaliação) fica registrada com a justificativa.',
      },
    ],
  },
  {
    titulo: 'Segurança',
    regras: [
      {
        icone: 'lock-closed-outline',
        titulo: 'Senha protegida',
        descricao: 'Sua senha é guardada de forma criptografada e não pode ser vista por ninguém, nem pelo síndico.',
      },
      {
        icone: 'card-outline',
        titulo: 'Sem dados de pagamento',
        descricao: 'O aplicativo não processa pagamentos nem guarda dados de cartão. O pagamento é combinado diretamente entre vizinhos.',
      },
    ],
  },
];

export default function PrivacySettingsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={28} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacidade e Segurança</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.destaque}>
          <Ionicons name="shield-checkmark-outline" size={28} color="#1E3A5F" />
          <Text style={styles.destaqueTexto}>
            Sua privacidade é protegida por padrão. Não há nada para configurar: as regras abaixo valem para todos os moradores.
          </Text>
        </View>

        {GRUPOS.map((grupo) => (
          <View key={grupo.titulo} style={styles.grupo}>
            <Text style={styles.sectionTitle}>{grupo.titulo}</Text>
            <Card style={styles.card}>
              {grupo.regras.map((regra, indice) => (
                <View key={regra.titulo}>
                  {indice > 0 && <View style={styles.divider} />}
                  <View style={styles.regra}>
                    <Ionicons name={regra.icone} size={22} color="#1E3A5F" style={styles.regraIcone} />
                    <View style={styles.regraTexto}>
                      <Text style={styles.regraTitulo}>{regra.titulo}</Text>
                      <Text style={styles.regraDescricao}>{regra.descricao}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        ))}

        <Text style={styles.rodape}>
          Para corrigir seus dados ou excluir sua conta, fale com o síndico do seu condomínio.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
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
    gap: 20,
  },
  destaque: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#E8EFF5',
  },
  destaqueTexto: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#1E3A5F',
  },
  grupo: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6C7A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E8EFF5',
    paddingVertical: 4,
  },
  regra: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  regraIcone: {
    marginTop: 1,
  },
  regraTexto: {
    flex: 1,
  },
  regraTitulo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  regraDescricao: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6C7A8A',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8EFF5',
    marginHorizontal: 16,
  },
  rodape: {
    fontSize: 13,
    color: '#6C7A8A',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
