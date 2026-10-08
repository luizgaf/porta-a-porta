import { prismaMock } from './helpers/prismaMock';
import { iniciarApi, encerrarApi, entrarComo, chamar } from './helpers/api';
import { CONDOMINIO_A, PRODUTO_1, comprador, vendedor } from './helpers/dados';

beforeAll(iniciarApi);
afterAll(encerrarApi);

const novoProduto = { nome: 'Bolo de cenoura', descricao: 'Fatia de 150g', preco: 12.5, categoria: 'Alimentos' };

describe('Produtos', () => {
  test('TU01 - vendedor com 15 produtos ativos não consegue cadastrar mais um (RN01)', async () => {
    const token = entrarComo(vendedor);
    prismaMock.produto.count.mockResolvedValue(15);

    const { status, corpo } = await chamar('POST', '/api/produtos', token, novoProduto);

    expect(status).toBe(400);
    expect(corpo.code).toBe('LIMIT_EXCEEDED');
    expect(prismaMock.produto.count).toHaveBeenCalledWith({
      where: { condominioId: CONDOMINIO_A, vendedorId: vendedor.id, status: 'ATIVO' },
    });
    expect(prismaMock.produto.create).not.toHaveBeenCalled();
  });

  test('TU02 - vendedor com 15 produtos ativos não consegue reativar um produto pausado (RN01)', async () => {
    const token = entrarComo(vendedor);
    prismaMock.produto.findFirst.mockResolvedValue({
      id: PRODUTO_1,
      condominioId: CONDOMINIO_A,
      vendedorId: vendedor.id,
      status: 'PAUSADO',
    });
    prismaMock.produto.count.mockResolvedValue(15);

    const { status, corpo } = await chamar('PATCH', `/api/produtos/${PRODUTO_1}/status`, token, { status: 'ATIVO' });

    expect(status).toBe(400);
    expect(corpo.code).toBe('LIMIT_EXCEEDED');
    expect(prismaMock.produto.update).not.toHaveBeenCalled();
  });

  test('TU03 - vendedor não consegue mover o próprio produto para quarentena', async () => {
    const token = entrarComo(vendedor);
    prismaMock.produto.findFirst.mockResolvedValue({
      id: PRODUTO_1,
      condominioId: CONDOMINIO_A,
      vendedorId: vendedor.id,
      status: 'ATIVO',
    });

    const { status, corpo } = await chamar('PATCH', `/api/produtos/${PRODUTO_1}/status`, token, {
      status: 'QUARENTENA',
    });

    expect(status).toBe(403);
    expect(corpo.code).toBe('FORBIDDEN');
    expect(prismaMock.produto.update).not.toHaveBeenCalled();
  });

  test('TU17 - usuário não consegue consultar produto de outro condomínio (RNF02)', async () => {
    const token = entrarComo(comprador);
    // O produto existe no condomínio B; a busca restrita ao condomínio A não o encontra
    prismaMock.produto.findFirst.mockResolvedValue(null);

    const { status, corpo } = await chamar('GET', `/api/produtos/${PRODUTO_1}`, token);

    expect(status).toBe(404);
    expect(corpo.code).toBe('PRODUTO_NOT_FOUND');
    expect(prismaMock.produto.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: PRODUTO_1, condominioId: CONDOMINIO_A } }),
    );
  });
});
