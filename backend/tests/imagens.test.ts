import fs from 'fs';
import path from 'path';
import { prismaMock } from './helpers/prismaMock';
import { iniciarApi, encerrarApi, entrarComo, enviarArquivo } from './helpers/api';
import { CONDOMINIO_A, PRODUTO_1, vendedor } from './helpers/dados';

beforeAll(iniciarApi);
afterAll(async () => {
  await encerrarApi();
  fs.rmSync(process.env.UPLOAD_DIR!, { recursive: true, force: true });
});

// Menor PNG válido (1 x 1 pixel)
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

const produtoDoVendedor = { id: PRODUTO_1, condominioId: CONDOMINIO_A, vendedorId: vendedor.id, imagemUrl: null };

describe('Foto do produto', () => {
  test('TU27 - foto válida é gravada no servidor e vinculada ao produto (RNF05)', async () => {
    const token = entrarComo(vendedor);
    prismaMock.produto.findFirst.mockResolvedValue(produtoDoVendedor);
    prismaMock.produto.update.mockImplementation(async ({ data }) => ({ ...produtoDoVendedor, ...data }));

    const { status, corpo } = await enviarArquivo(`/api/produtos/${PRODUTO_1}/imagem`, token, PNG, 'image/png');

    expect(status).toBe(200);
    expect(corpo.produto.imagemUrl).toMatch(/^\/uploads\/[0-9a-f-]+\.png$/);
    const gravado = path.join(process.env.UPLOAD_DIR!, path.basename(corpo.produto.imagemUrl));
    expect(fs.readFileSync(gravado).equals(PNG)).toBe(true);
  });

  test('TU46 - foto enviada pelo app em multipart/form-data é aceita (sem Blob no aparelho)', async () => {
    const token = entrarComo(vendedor);
    prismaMock.produto.findFirst.mockResolvedValue(produtoDoVendedor);
    prismaMock.produto.update.mockImplementation(async ({ data }) => ({ ...produtoDoVendedor, ...data }));

    // Mesmo formato que o FormData do React Native gera para { uri, name, type }
    const limite = '----portaaporta123';
    const corpo = Buffer.concat([
      Buffer.from(`--${limite}\r\nContent-Disposition: form-data; name="foto"; filename="foto.png"\r\nContent-Type: image/png\r\n\r\n`),
      PNG,
      Buffer.from(`\r\n--${limite}--\r\n`),
    ]);
    const resposta = await enviarArquivo(`/api/produtos/${PRODUTO_1}/imagem`, token, corpo, `multipart/form-data; boundary=${limite}`);

    expect(resposta.status).toBe(200);
    const gravado = path.join(process.env.UPLOAD_DIR!, path.basename(resposta.corpo.produto.imagemUrl));
    expect(fs.readFileSync(gravado).equals(PNG)).toBe(true);
  });

  test('TU53 - JPEG informado como "image/jpg" ou sem tipo pelo aparelho é aceito pelo conteúdo', async () => {
    const token = entrarComo(vendedor);
    prismaMock.produto.findFirst.mockResolvedValue(produtoDoVendedor);
    prismaMock.produto.update.mockImplementation(async ({ data }) => ({ ...produtoDoVendedor, ...data }));
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

    for (const tipo of ['image/jpg', 'application/octet-stream']) {
      const { status, corpo } = await enviarArquivo(`/api/produtos/${PRODUTO_1}/imagem`, token, jpeg, tipo);
      expect(status).toBe(200);
      expect(corpo.produto.imagemUrl).toMatch(/\.jpg$/);
    }
  });

  test('TU28 - arquivo que não é imagem ou maior que 5 MB é recusado (RNF05)', async () => {
    const token = entrarComo(vendedor);
    prismaMock.produto.findFirst.mockResolvedValue(produtoDoVendedor);

    const texto = await enviarArquivo(`/api/produtos/${PRODUTO_1}/imagem`, token, Buffer.from('não sou uma imagem'), 'text/plain');
    expect(texto.status).toBe(415);
    expect(texto.corpo.code).toBe('FORMATO_INVALIDO');

    // Content-Type de imagem, mas o conteúdo não é: também recusado
    const disfarcado = await enviarArquivo(`/api/produtos/${PRODUTO_1}/imagem`, token, Buffer.from('falso'), 'image/png');
    expect(disfarcado.status).toBe(415);

    const grande = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]);
    const muitoGrande = await enviarArquivo(`/api/produtos/${PRODUTO_1}/imagem`, token, grande, 'image/png');
    expect(muitoGrande.status).toBe(413);
    expect(muitoGrande.corpo.code).toBe('ARQUIVO_MUITO_GRANDE');

    expect(prismaMock.produto.update).not.toHaveBeenCalled();
  });
});
