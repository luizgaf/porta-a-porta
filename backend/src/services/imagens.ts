import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Fotos dos anúncios guardadas no próprio servidor (uma por produto).
// RNF05: só imagens JPEG, PNG ou WebP, com no máximo 5 MB.

export const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024;
export const TIPOS_DE_IMAGEM = ['image/jpeg', 'image/png', 'image/webp'];
export const PREFIXO_URL_IMAGENS = '/uploads';

export const pastaDeImagens = () =>
  path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads'));

// Confere o conteúdo do arquivo, não só o Content-Type informado pelo app
export const extensaoPelaAssinatura = (arquivo: Buffer): 'jpg' | 'png' | 'webp' | null => {
  if (arquivo.length >= 3 && arquivo[0] === 0xff && arquivo[1] === 0xd8 && arquivo[2] === 0xff) return 'jpg';
  if (arquivo.length >= 8 && arquivo.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (arquivo.length >= 12 && arquivo.toString('ascii', 0, 4) === 'RIFF' && arquivo.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
};

// Grava a imagem com nome aleatório e devolve a URL relativa usada pelo app
export const salvarImagem = async (arquivo: Buffer, extensao: string) => {
  const pasta = pastaDeImagens();
  await fs.mkdir(pasta, { recursive: true });
  const nome = `${crypto.randomUUID()}.${extensao}`;
  await fs.writeFile(path.join(pasta, nome), arquivo);
  return `${PREFIXO_URL_IMAGENS}/${nome}`;
};

// Apaga a foto anterior; ignora se o arquivo já não existir
export const removerImagem = async (url?: string | null) => {
  if (!url || !url.startsWith(`${PREFIXO_URL_IMAGENS}/`)) return;
  const nome = path.basename(url);
  await fs.rm(path.join(pastaDeImagens(), nome), { force: true });
};

// Folga para os cabeçalhos do multipart: o limite de 5 MB vale para a imagem, não para o envelope
export const LIMITE_CORPO_UPLOAD = TAMANHO_MAXIMO_IMAGEM + 64 * 1024;

export interface ArquivoRecebido {
  conteudo: Buffer;
  tipo: string;
}

// Lê a imagem enviada pelo app. Aceita o arquivo como corpo da requisição (Content-Type da imagem)
// ou como multipart/form-data, que é como o React Native envia um arquivo a partir da URI local
// sem precisar de Blob (fetch(uri).blob() falha em parte dos aparelhos).
export const lerArquivoEnviado = (corpo: unknown, contentType = ''): ArquivoRecebido => {
  const buffer = Buffer.isBuffer(corpo) ? corpo : Buffer.alloc(0);
  const tipo = contentType.split(';')[0].trim().toLowerCase();
  if (tipo !== 'multipart/form-data') return { conteudo: buffer, tipo };

  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  const limite = m ? (m[1] || m[2]).trim() : '';
  if (!limite) return { conteudo: Buffer.alloc(0), tipo: '' };

  const separador = Buffer.from(`--${limite}`);
  let pos = buffer.indexOf(separador);
  while (pos !== -1) {
    const inicio = pos + separador.length;
    if (buffer.toString('ascii', inicio, inicio + 2) === '--') break; // fim do multipart
    const fimCabecalho = buffer.indexOf('\r\n\r\n', inicio);
    if (fimCabecalho === -1) break;
    const cabecalho = buffer.toString('utf8', inicio, fimCabecalho);
    const proximo = buffer.indexOf(separador, fimCabecalho + 4);
    if (proximo === -1) break;
    // A primeira parte com arquivo é a foto; o conteúdo termina antes do \r\n do separador seguinte
    if (/filename=/i.test(cabecalho)) {
      const tipoParte = /content-type:\s*([^\r\n;]+)/i.exec(cabecalho)?.[1]?.trim().toLowerCase() ?? '';
      return { conteudo: buffer.subarray(fimCabecalho + 4, proximo - 2), tipo: tipoParte };
    }
    pos = proximo;
  }
  return { conteudo: Buffer.alloc(0), tipo: '' };
};
