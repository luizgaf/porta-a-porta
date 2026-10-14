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
