import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { TAMANHO_MAXIMO_FOTO } from './imagem';

export interface FotoEscolhida {
  uri: string;
  tipo: string;
}

const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'];

// Abre a galeria para o vendedor escolher a foto do produto.
// A foto é recortada em 4:3 e comprimida; o servidor confere de novo o formato e o limite de 5 MB (RNF05).
export const escolherFoto = async (aspecto: [number, number] = [4, 3]): Promise<FotoEscolhida | null> => {
  const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissao.granted) {
    Alert.alert('Permissão necessária', 'Autorize o acesso às fotos para escolher uma imagem.');
    return null;
  }

  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: aspecto,
    quality: 0.7,
  });

  if (resultado.canceled || !resultado.assets?.length) return null;

  const foto = resultado.assets[0];
  const tipo = foto.mimeType || 'image/jpeg';

  if (!TIPOS_ACEITOS.includes(tipo)) {
    Alert.alert('Formato não aceito', 'Escolha uma foto em JPEG, PNG ou WebP.');
    return null;
  }

  if (foto.fileSize && foto.fileSize > TAMANHO_MAXIMO_FOTO) {
    Alert.alert('Foto muito grande', 'A foto deve ter no máximo 5 MB.');
    return null;
  }

  return { uri: foto.uri, tipo };
};
