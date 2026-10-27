import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { TAMANHO_MAXIMO_FOTO } from './imagem';

export interface FotoEscolhida {
  uri: string;
  tipo: string;
}

const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'];

// Alguns Android informam "image/jpg" (fora do padrão) ou não informam o tipo; aqui vira o tipo
// padrão, deduzido pela extensão quando faltar. A API confere de novo pelo conteúdo do arquivo.
const tipoDaFoto = (mimeType: string | null | undefined, uri: string) => {
  const informado = (mimeType || '').toLowerCase();
  if (informado === 'image/jpg' || informado === 'image/pjpeg') return 'image/jpeg';
  if (informado) return informado;
  const extensao = uri.split('?')[0].split('.').pop()?.toLowerCase();
  if (extensao === 'png') return 'image/png';
  if (extensao === 'webp') return 'image/webp';
  return 'image/jpeg';
};

// Abre a galeria para o vendedor escolher a foto do produto.
// A foto é recortada em 4:3 e comprimida; o servidor confere de novo o formato e o limite de 5 MB (RNF05).
export const escolherFoto = async (): Promise<FotoEscolhida | null> => {
  const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissao.granted) {
    Alert.alert('Permissão necessária', 'Autorize o acesso às fotos para adicionar uma imagem ao produto.');
    return null;
  }

  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7,
  });

  if (resultado.canceled || !resultado.assets?.length) return null;

  const foto = resultado.assets[0];
  const tipo = tipoDaFoto(foto.mimeType, foto.uri);

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
