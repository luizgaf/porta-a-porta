import { Response } from 'express';
import { prismaMock } from './helpers/prismaMock';
import { iniciarApi, encerrarApi, entrarComo, chamar } from './helpers/api';
import { requireRole, AuthRequest } from '../src/middleware/auth';
import { CONDOMINIO_A, PEDIDO_1, PRODUTO_1, comprador, sindico, vendedor } from './helpers/dados';

beforeAll(iniciarApi);
afterAll(encerrarApi);

const entrega = { unidadeEntrega: 'Apto 202', tipoEntrega: 'PORTARIA', janelaHorario: 'Qui, 15/10 - Noite (18h-21h)' };
// Produto anunciado por um terceiro (nem o vendedor nem o síndico dos testes)
const produtoDeOutro = { id: PRODUTO_1, preco: 10, status: 'ATIVO', vendedorId: 'outro-morador' };

const prepararPedido = () => {
  prismaMock.produto.findMany.mockResolvedValue([produtoDeOutro]);
  prismaMock.pedido.create.mockResolvedValue({ id: PEDIDO_1 });
  prismaMock.pedido.findUnique.mockResolvedValue({ id: PEDIDO_1, status: 'PENDENTE' });
};

describe('Hierarquia de perfis (vendedor e síndico também compram)', () => {
  test('TU29 - vendedor consegue fazer pedido de produto de outro morador', async () => {
    prepararPedido();
    const { status } = await chamar('POST', '/api/pedidos', entrarComo(vendedor), {
      ...entrega,
      itens: [{ produtoId: PRODUTO_1, quantidade: 1 }],
    });

    expect(status).toBe(201);
    expect(prismaMock.pedido.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ compradorId: vendedor.id, condominioId: CONDOMINIO_A }),
    });
  });

  test('TU30 - síndico consegue fazer pedido de produto de outro morador', async () => {
    prepararPedido();
    const { status } = await chamar('POST', '/api/pedidos', entrarComo(sindico), {
      ...entrega,
      itens: [{ produtoId: PRODUTO_1, quantidade: 1 }],
    });

    expect(status).toBe(201);
    expect(prismaMock.pedido.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ compradorId: sindico.id }),
    });
  });

  test('TU31 - ninguém consegue comprar o próprio produto', async () => {
    prismaMock.produto.findMany.mockResolvedValue([{ ...produtoDeOutro, vendedorId: vendedor.id }]);

    const { status, corpo } = await chamar('POST', '/api/pedidos', entrarComo(vendedor), {
      ...entrega,
      itens: [{ produtoId: PRODUTO_1, quantidade: 1 }],
    });

    expect(status).toBe(400);
    expect(corpo.code).toBe('PRODUTO_PROPRIO');
    expect(prismaMock.pedido.create).not.toHaveBeenCalled();
  });

  test('TU32 - cada perfil herda as permissões do anterior, mas não as do seguinte', () => {
    const passa = (perfil: 'COMPRADOR' | 'VENDEDOR' | 'SINDICO', usuario: typeof comprador) => {
      const proximo = jest.fn();
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
      requireRole(perfil)({ user: usuario } as AuthRequest, res, proximo);
      return proximo.mock.calls.length === 1;
    };

    // Rotas de comprador: todos
    expect([comprador, vendedor, sindico].map((u) => passa('COMPRADOR', u))).toEqual([true, true, true]);
    // Rotas de vendedor: vendedor e síndico
    expect([comprador, vendedor, sindico].map((u) => passa('VENDEDOR', u))).toEqual([false, true, true]);
    // Rotas de síndico: só o síndico
    expect([comprador, vendedor, sindico].map((u) => passa('SINDICO', u))).toEqual([false, false, true]);
  });
});
