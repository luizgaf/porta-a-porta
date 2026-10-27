import { prismaMock } from './helpers/prismaMock';
import { iniciarApi, encerrarApi, entrarComo, chamar } from './helpers/api';
import { CONDOMINIO_A, PRODUTO_1, PRODUTO_2, comprador, vendedor } from './helpers/dados';

beforeAll(iniciarApi);
afterAll(encerrarApi);

const item = (pedidoId: string, status: string, produtoId: string, nome: string, quantidade: number, preco: number) => ({
  quantidade,
  precoUnitario: preco.toFixed(2), // o Prisma devolve Decimal como texto
  produto: { id: produtoId, nome },
  pedido: { id: pedidoId, status, criadoEm: new Date(), unidadeEntrega: 'Apto 101', janelaHorario: 'Hoje, 18h-21h' },
});

describe('Dashboard do vendedor', () => {
  test('TU39 - soma só os itens do vendedor e separa vendido, em andamento e cancelado', async () => {
    const token = entrarComo(vendedor);
    prismaMock.itemPedido.findMany.mockResolvedValue([
      item('p1', 'ENTREGUE', PRODUTO_1, 'Bolo', 2, 25),
      item('p1', 'ENTREGUE', PRODUTO_2, 'Pão', 3, 1.5),
      item('p2', 'ENTREGUE', PRODUTO_1, 'Bolo', 1, 25),
      item('p3', 'EM_PREPARO', PRODUTO_1, 'Bolo', 1, 25),
      item('p4', 'CANCELADO', PRODUTO_2, 'Pão', 10, 1.5),
    ]);
    prismaMock.produto.count.mockResolvedValue(4);

    const { status, corpo } = await chamar('GET', '/api/pedidos/dashboard', token);

    expect(status).toBe(200);
    expect(prismaMock.itemPedido.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { produto: { vendedorId: vendedor.id }, pedido: { condominioId: CONDOMINIO_A } } }),
    );
    expect(corpo.totais).toEqual(
      expect.objectContaining({ vendido: 79.5, emAndamento: 25, pedidos: 3, ticketMedio: 39.75, itensVendidos: 6, produtosAtivos: 4 }),
    );
    expect(corpo.porStatus).toEqual(
      expect.arrayContaining([
        { status: 'ENTREGUE', quantidade: 2 },
        { status: 'EM_PREPARO', quantidade: 1 },
        { status: 'CANCELADO', quantidade: 1 },
      ]),
    );
    // O pedido cancelado não conta nos mais vendidos
    expect(corpo.maisVendidos[0]).toEqual({ produtoId: PRODUTO_1, nome: 'Bolo', quantidade: 4, valor: 100 });
    expect(corpo.maisVendidos[1]).toEqual({ produtoId: PRODUTO_2, nome: 'Pão', quantidade: 3, valor: 4.5 });
  });

  test('TU40 - comprador não acessa o dashboard de vendas', async () => {
    const { status } = await chamar('GET', '/api/pedidos/dashboard', entrarComo(comprador));

    expect(status).toBe(403);
    expect(prismaMock.itemPedido.findMany).not.toHaveBeenCalled();
  });
});
