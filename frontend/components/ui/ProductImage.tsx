import React, { useState } from 'react';
import { Image, View, StyleSheet, StyleProp, ImageStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { urlDaImagem } from '../../utils/imagem';
import { colors } from '../../constants/design';

interface ProductImageProps {
  // Caminho devolvido pela API (ex.: /uploads/abc.jpg) ou URI local recém-escolhida
  url?: string | null;
  style?: StyleProp<ImageStyle>;
  iconSize?: number;
}

// Foto do produto guardada no servidor; sem foto (ou se falhar o carregamento), mostra um ícone
export const ProductImage: React.FC<ProductImageProps> = ({ url, style, iconSize = 32 }) => {
  const [falhou, setFalhou] = useState(false);
  const uri = urlDaImagem(url);

  if (!uri || falhou) {
    return (
      <View style={[styles.placeholder, style as object]}>
        <Ionicons name="image-outline" size={iconSize} color={colors.mutedSlate} />
      </View>
    );
  }

  return <Image source={{ uri }} style={style} resizeMode="cover" onError={() => setFalhou(true)} />;
};

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.morningFog,
  },
});
