import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AMARELO = '#F5A524';

interface Props {
  // Nota de 0 a 5; aceita meia estrela na exibição (ex.: média 4,5)
  nota: number;
  tamanho?: number;
  // Com onChange, as estrelas viram botões para escolher a nota
  onChange?: (nota: number) => void;
  style?: ViewStyle;
}

const NOMES = ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente'];

export const Estrelas: React.FC<Props> = ({ nota, tamanho = 16, onChange, style }) => {
  const icone = (n: number) => {
    if (nota >= n) return 'star';
    if (!onChange && nota >= n - 0.5) return 'star-half';
    return 'star-outline';
  };

  if (!onChange) {
    return (
      <View style={[styles.linha, style]} accessibilityLabel={`Nota ${String(nota).replace('.', ',')} de 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Ionicons key={n} name={icone(n)} size={tamanho} color={AMARELO} />
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.linha, styles.escolha, style]} accessibilityRole="adjustable">
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          onPress={() => onChange(n)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`${n} ${n === 1 ? 'estrela' : 'estrelas'}: ${NOMES[n]}`}
          accessibilityState={{ selected: nota === n }}
        >
          <Ionicons name={icone(n)} size={tamanho} color={AMARELO} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export const nomeDaNota = (nota: number) => NOMES[nota] ?? '';

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  escolha: {
    gap: 10,
  },
});
