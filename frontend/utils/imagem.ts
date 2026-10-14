import { API_BASE_URL } from '../constants';

// As fotos ficam no servidor da API, fora do prefixo /api (ex.: http://servidor:3000/uploads/abc.jpg)
const ORIGEM_DO_SERVIDOR = API_BASE_URL.replace(/\/api\/?$/, '');

export const TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024; // RNF05

export const urlDaImagem = (caminho?: string | null): string | null => {
  if (!caminho) return null;
  // URIs locais (foto recém-escolhida) e endereços completos são usados como estão
  if (/^(https?:|file:|content:|data:|blob:)/.test(caminho)) return caminho;
  return `${ORIGEM_DO_SERVIDOR}${caminho}`;
};
