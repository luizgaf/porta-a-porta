import { prismaMock } from './helpers/prismaMock';
import { iniciarApi, encerrarApi, entrarComo, chamar } from './helpers/api';
import { CONDOMINIO_A, PEDIDO_1, PRODUTO_1, PRODUTO_2, comprador, sindico, vendedor } from './helpers/dados';

beforeAll(iniciarApi);
afterAll(encerrarApi);

const entrega = { unidadeEntrega: 'Apto 101', tipoEntrega: 'PORTARIA', janelaHorario: '18h-20h' };

// Pedido do comprador com um item do vendedor, no status informado
const pedidoNoStatus = (status: string) => ({
  id: PEDIDO_1,
  condominioId: CONDOMINIO_A,
  compradorId: comprador.id,
  status,
  itens: [{ produtoId: PRODUTO_1, produto: { id: PRODUTO_1, vendedorId: vendedor.id } }],
});

describe('Pedidos', () => {
  test('TU04 - pedido é criado como PENDENTE com o total calculado no servidor (HU02)', async () => {
    const token = entrarComo(comprador);
    prismaMock.produto.findMany.mockResolvedValue([
      { id: PRODUTO_1, preco: 18.5, status: 'ATIVO' },
      { id: PRODUTO_2, preco: 12, status: 'ATIVO' },
    ]);
    prismaMock.pedido.create.mockResolvedValue({ id: PEDIDO_1 });
    prismaMock.pedido.findMany.mockResolvedValue([{ id: PEDIDO_1, status: 'PENDENTE', valorTotal: 73 }]);

    const { status, corpo } = await chamar('POST', '/api/pedidos', token, {
      ...entrega,
      itens: [
        // Um preço enviado pelo cliente deve ser ignorado
        { produtoId: PRODUTO_1, quantidade: 2, precoUnitario: 0.01 },
        { produtoId: PRODUTO_2, quantidade: 3 },
      ],
    });

    expect(status).toBe(201);
    expect(corpo.pedido.status).toBe('PENDENTE');
    expect(prismaMock.produto.findMany).toHaveBeenCalledWith({
      where: { id: { in: [PRODUTO_1, PRODUTO_2] }, condominioId: CONDOMINIO_A, status: 'ATIVO' },
    });
    // 2 x 18,50 + 3 x 12,00 = 73,00
    expect(prismaMock.pedido.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        condominioId: CONDOMINIO_A,
        compradorId: comprador.id,
        unidadeEntrega: 'Apto 101',
        status: 'PENDENTE',
        valorTotal: 73,
      }),
    });
    expect(prismaMock.itemPedido.createMany).toHaveBeenCalledWith({
      data: [
        { pedidoId: PEDIDO_1, produtoId: PRODUTO_1, quantidade: 2, precoUnitario: 18.5 },
        { pedidoId: PEDIDO_1, produtoId: PRODUTO_2, quantidade: 3, precoUnitario: 12 },
      ],
    });
  });

  test('TU05 - pedido com produto pausado ou de outro condomínio é recusado', async () => {
    const token = entrarComo(comprador);
    // Só o PRODUTO_1 está ativo no condomínio do comprador
    prismaMock.produto.findMany.mockResolvedValue([{ id: PRODUTO_1, preco: 18.5, status: 'ATIVO' }]);

    const { status, corpo } = await chamar('POST', '/api/pedidos', token, {
      ...entrega,
      itens: [
        { produtoId: PRODUTO_1, quantidade: 1 },
        { produtoId: PRODUTO_2, quantidade: 1 },
      ],
    });

    expect(status).toBe(400);
    expect(corpo.code).toBe('PRODUTO_INVALIDO');
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.pedido.create).not.toHaveBeenCalled();
  });

  test('TU06 - vendedor avança o pedido de PENDENTE para CONFIRMADO (HU04)', async () => {
    const token = entrarComo(vendedor);
    prismaMock.pedido.findFirst.mockResolvedValue(pedidoNoStatus('PENDENTE'));
    prismaMock.pedido.update.mockResolvedValue({ id: PEDIDO_1, status: 'CONFIRMADO' });

    const { status, corpo } = await chamar('PATCH', `/api/pedidos/${PEDIDO_1}/status`, token, {
      status: 'CONFIRMADO',
    });

    expect(status).toBe(200);
    expect(corpo.pedido.status).toBe('CONFIRMADO');
    expect(prismaMock.pedido.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: PEDIDO_1 }, data: { status: 'CONFIRMADO' } }),
    );
  });

  test('TU07 - vendedor não consegue pular de PENDENTE direto para ENTREGUE', async () => {
    const token = entrarComo(vendedor);
    prismaMock.pedido.findFirst.mockResolvedValue(pedidoNoStatus('PENDENTE'));

    const { status, corpo } = await chamar('PATCH', `/api/pedidos/${PEDIDO_1}/status`, token, {
      status: 'ENTREGUE',
    });

    expect(status).toBe(400);
    expect(corpo.code).toBe('INVALID_TRANSITION');
    expect(prismaMock.pedido.update).not.toHaveBeenCalled();
  });

  test('TU08 - comprador não consegue confirmar o próprio pedido, só cancelar', async () => {
    const token = entrarComo(comprador);
    prismaMock.pedido.findFirst.mockResolvedValue(pedidoNoStatus('PENDENTE'));

    const { status, corpo } = await chamar('PATCH', `/api/pedidos/${PEDIDO_1}/status`, token, {
      status: 'CONFIRMADO',
    });

    expect(status).toBe(403);
    expect(corpo.code).toBe('FORBIDDEN');
    expect(prismaMock.pedido.update).not.toHaveBeenCalled();
  });
});

describe('Um pedido por vendedor', () => {
  test('TU60 - carrinho com produtos de dois vendedores vira dois pedidos, cada um com o seu total e o seu aviso', async () => {
    const token = entrarComo(comprador);
    // PRODUTO_1 é da Maria (vendedor) e PRODUTO_2 é do síndico, que também vende
    prismaMock.produto.findMany.mockResolvedValue([
      { id: PRODUTO_1, preco: 18.5, status: 'ATIVO', vendedorId: vendedor.id },
      { id: PRODUTO_2, preco: 12, status: 'ATIVO', vendedorId: sindico.id },
    ]);
    prismaMock.pedido.create
      .mockResolvedValueOnce({ id: 'pedido-maria' })
      .mockResolvedValueOnce({ id: 'pedido-sindico' });
    prismaMock.pedido.findMany.mockResolvedValue([{ id: 'pedido-maria' }, { id: 'pedido-sindico' }]);

    const { status, corpo } = await chamar('POST', '/api/pedidos', token, {
      ...entrega,
      itens: [
        { produtoId: PRODUTO_1, quantidade: 2 },
        { produtoId: PRODUTO_2, quantidade: 1 },
      ],
    });

    expect(status).toBe(201);
    expect(corpo.pedidos).toHaveLength(2);
    // Mesma entrega e horário nos dois pedidos; cada total só com os itens daquele vendedor
    expect(prismaMock.pedido.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({ ...entrega, valorTotal: 37, status: 'PENDENTE' }),
    });
    expect(prismaMock.pedido.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({ ...entrega, valorTotal: 12, status: 'PENDENTE' }),
    });
    expect(prismaMock.itemPedido.createMany).toHaveBeenNthCalledWith(1, {
      data: [{ pedidoId: 'pedido-maria', produtoId: PRODUTO_1, quantidade: 2, precoUnitario: 18.5 }],
    });
    expect(prismaMock.itemPedido.createMany).toHaveBeenNthCalledWith(2, {
      data: [{ pedidoId: 'pedido-sindico', produtoId: PRODUTO_2, quantidade: 1, precoUnitario: 12 }],
    });
    // Os dois pedidos são gravados juntos, numa transação só
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    const [[{ data: avisos }]] = prismaMock.notificacao.createMany.mock.calls;
    expect(avisos).toEqual([
      expect.objectContaining({ usuarioId: vendedor.id, entidadeId: 'pedido-maria', mensagem: expect.stringContaining('R$ 37,00') }),
      expect.objectContaining({ usuarioId: sindico.id, entidadeId: 'pedido-sindico', mensagem: expect.stringContaining('R$ 12,00') }),
    ]);
  });

  test('TU61 - num pedido antigo com dois vendedores, cada vendedor vê só os próprios itens e o total deles', async () => {
    const token = entrarComo(vendedor);
    prismaMock.pedido.findFirst.mockResolvedValue({
      id: PEDIDO_1,
      condominioId: CONDOMINIO_A,
      compradorId: comprador.id,
      status: 'PENDENTE',
      valorTotal: 49,
      avaliacoes: [],
      comprador: { id: comprador.id, nome: comprador.nome, unidade: comprador.unidade },
      itens: [
        { produtoId: PRODUTO_1, quantidade: 2, precoUnitario: 18.5, produto: { id: PRODUTO_1, nome: 'Bolo', vendedorId: vendedor.id } },
        { produtoId: PRODUTO_2, quantidade: 1, precoUnitario: 12, produto: { id: PRODUTO_2, nome: 'Mel', vendedorId: sindico.id } },
      ],
    });

    const { status, corpo } = await chamar('GET', `/api/pedidos/${PEDIDO_1}`, token);

    expect(status).toBe(200);
    expect(corpo.pedido.itens.map((i: { produtoId: string }) => i.produtoId)).toEqual([PRODUTO_1]);
    expect(Number(corpo.pedido.valorTotal)).toBe(37);
    expect(JSON.stringify(corpo)).not.toContain('Mel');
  });
});
