import { prismaMock } from './helpers/prismaMock';
import { iniciarApi, encerrarApi, entrarComo, chamar } from './helpers/api';
import { CONDOMINIO_A, PEDIDO_1, PRODUTO_1, PRODUTO_2, comprador, sindico, vendedor } from './helpers/dados';

beforeAll(iniciarApi);
afterAll(encerrarApi);

describe('Avaliações', () => {
  test('TU12 - comprador não consegue avaliar um pedido que ainda não foi entregue', async () => {
    const token = entrarComo(comprador);
    // A rota só procura pedidos com status ENTREGUE; um pedido em andamento não é encontrado
    prismaMock.pedido.findFirst.mockResolvedValue(null);

    const { status, corpo } = await chamar('POST', '/api/avaliacoes', token, { pedidoId: PEDIDO_1, nota: 5 });

    expect(status).toBe(404);
    expect(corpo.code).toBe('PEDIDO_NOT_ELIGIBLE');
    expect(prismaMock.pedido.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: PEDIDO_1, status: 'ENTREGUE' }) }),
    );
    expect(prismaMock.avaliacao.create).not.toHaveBeenCalled();
  });

  test('TU13 - o autor não consegue alterar a avaliação depois do envio (RN02)', async () => {
    const token = entrarComo(comprador);
    prismaMock.avaliacao.findUnique.mockResolvedValue({ pedidoId: PEDIDO_1, compradorId: comprador.id, nota: 5 });

    const { status, corpo } = await chamar('PUT', `/api/avaliacoes/${PEDIDO_1}`, token, {
      nota: 1,
      comentario: 'Mudei de ideia',
    });

    expect(status).toBe(403);
    expect(corpo.code).toBe('AVALIACAO_IMUTAVEL');
    expect(prismaMock.avaliacao.update).not.toHaveBeenCalled();
  });
});

describe('Moderação de avaliações', () => {
  const avaliacaoDoPedido = { id: 'avaliacao-1', pedidoId: PEDIDO_1, produtoId: PRODUTO_1, compradorId: comprador.id, nota: 1, removidaPor: null };

  test('TU24 - síndico remove avaliação com justificativa registrada em auditoria (RN02)', async () => {
    const token = entrarComo(sindico);
    prismaMock.avaliacao.findFirst.mockResolvedValue(avaliacaoDoPedido);
    prismaMock.avaliacao.update.mockResolvedValue({ ...avaliacaoDoPedido, removidaPor: sindico.id });
    prismaMock.logAuditoria.create.mockResolvedValue({});

    const { status } = await chamar('DELETE', '/api/avaliacoes/avaliacao-1', token, {
      justificativa: 'Comentário ofensivo ao vendedor',
    });

    expect(status).toBe(200);
    expect(prismaMock.avaliacao.findFirst).toHaveBeenCalledWith({
      where: { id: 'avaliacao-1', pedido: { condominioId: CONDOMINIO_A } },
    });
    expect(prismaMock.avaliacao.update).toHaveBeenCalledWith({
      where: { id: 'avaliacao-1' },
      data: { removidaPor: sindico.id },
    });
    expect(prismaMock.logAuditoria.create).toHaveBeenCalledWith({
      data: {
        sindicoId: sindico.id,
        acao: 'REMOVER_AVALIACAO',
        entidadeId: 'avaliacao-1',
        justificativa: 'Comentário ofensivo ao vendedor',
      },
    });
  });

  test('TU25 - remoção sem justificativa ou de outro condomínio é recusada', async () => {
    const token = entrarComo(sindico);

    const semJustificativa = await chamar('DELETE', '/api/avaliacoes/avaliacao-1', token, {});
    expect(semJustificativa.status).toBe(400);
    expect(semJustificativa.corpo.code).toBe('VALIDATION_ERROR');

    // Avaliação de pedido de outro condomínio: a busca filtrada não encontra
    prismaMock.avaliacao.findFirst.mockResolvedValue(null);
    const outroCondominio = await chamar('DELETE', '/api/avaliacoes/avaliacao-1', token, {
      justificativa: 'Conteúdo abusivo',
    });
    expect(outroCondominio.status).toBe(404);
    expect(outroCondominio.corpo.code).toBe('AVALIACAO_NOT_FOUND');

    expect(prismaMock.avaliacao.update).not.toHaveBeenCalled();
    expect(prismaMock.logAuditoria.create).not.toHaveBeenCalled();
  });

  test('TU26 - vendedor vê as avaliações sem identificação de quem avaliou (RN02)', async () => {
    const token = entrarComo(vendedor);
    prismaMock.avaliacao.findMany.mockResolvedValue([{ id: 'avaliacao-1', nota: 5, comentario: 'Ótimo' }]);
    prismaMock.avaliacao.count.mockResolvedValue(1);

    const { status } = await chamar('GET', '/api/avaliacoes', token);

    expect(status).toBe(200);
    const [consulta] = prismaMock.avaliacao.findMany.mock.calls[0];
    expect(consulta.include).toBeUndefined();
    expect(consulta.select).not.toHaveProperty('comprador');
    expect(consulta.select).not.toHaveProperty('compradorId');
    // Sem o pedido, o vendedor não consegue ligar a nota a quem comprou
    expect(consulta.select).not.toHaveProperty('pedidoId');
    expect(consulta.select).not.toHaveProperty('pedido');
    // Só as avaliações dos produtos do próprio vendedor
    expect(consulta.where.produto).toEqual({ vendedorId: vendedor.id, condominioId: CONDOMINIO_A });
    // Avaliações removidas pelo síndico não aparecem para o vendedor
    expect(consulta.where.removidaPor).toBeNull();
  });
});

describe('Avaliação por produto', () => {
  const pedidoEntregue = (itens: { produtoId: string; nome: string }[]) => ({
    id: PEDIDO_1,
    condominioId: CONDOMINIO_A,
    compradorId: comprador.id,
    status: 'ENTREGUE',
    itens: itens.map((i) => ({ produtoId: i.produtoId, produto: { nome: i.nome, vendedorId: vendedor.id } })),
  });

  test('TU54 - cada produto do pedido recebe a sua avaliação, e o vendedor é avisado sem saber quem avaliou', async () => {
    const token = entrarComo(comprador);
    prismaMock.pedido.findFirst.mockResolvedValue(
      pedidoEntregue([{ produtoId: PRODUTO_1, nome: 'Bolo de pote' }, { produtoId: PRODUTO_2, nome: 'Brigadeiro' }]),
    );

    // Pedido com dois produtos: é preciso dizer qual está sendo avaliado
    const semProduto = await chamar('POST', '/api/avaliacoes', token, { pedidoId: PEDIDO_1, nota: 5 });
    expect(semProduto.status).toBe(400);
    expect(semProduto.corpo.code).toBe('PRODUTO_OBRIGATORIO');

    const foraDoPedido = await chamar('POST', '/api/avaliacoes', token, { pedidoId: PEDIDO_1, produtoId: 'outro', nota: 5 });
    expect(foraDoPedido.corpo.code).toBe('PRODUTO_FORA_DO_PEDIDO');

    prismaMock.avaliacao.findUnique.mockResolvedValue(null);
    prismaMock.avaliacao.create.mockResolvedValue({ id: 'avaliacao-2', nota: 4 });
    const criada = await chamar('POST', '/api/avaliacoes', token, { pedidoId: PEDIDO_1, produtoId: PRODUTO_2, nota: 4 });

    expect(criada.status).toBe(201);
    expect(prismaMock.avaliacao.findUnique).toHaveBeenCalledWith({
      where: { pedidoId_produtoId: { pedidoId: PEDIDO_1, produtoId: PRODUTO_2 } },
    });
    expect(prismaMock.avaliacao.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ pedidoId: PEDIDO_1, produtoId: PRODUTO_2, nota: 4 }) }),
    );
    const [[{ data: avisos }]] = prismaMock.notificacao.createMany.mock.calls;
    expect(avisos).toEqual([
      expect.objectContaining({ usuarioId: vendedor.id, tipo: 'NOVA_AVALIACAO', mensagem: '"Brigadeiro" recebeu uma avaliação de 4 estrelas.' }),
    ]);
    expect(JSON.stringify(avisos)).not.toContain(comprador.nome);

    // O mesmo produto não é avaliado duas vezes no mesmo pedido
    prismaMock.avaliacao.findUnique.mockResolvedValue({ id: 'avaliacao-2' });
    const repetida = await chamar('POST', '/api/avaliacoes', token, { pedidoId: PEDIDO_1, produtoId: PRODUTO_2, nota: 1 });
    expect(repetida.status).toBe(409);
  });

  test('TU55 - o produto mostra média, distribuição e comentários sem identificar quem avaliou', async () => {
    const token = entrarComo(comprador);
    prismaMock.avaliacao.findMany.mockResolvedValue([
      { id: 'a1', nota: 5, comentario: 'Ótimo', criadoEm: new Date() },
      { id: 'a2', nota: 4, comentario: null, criadoEm: new Date() },
      { id: 'a3', nota: 5, comentario: 'Chegou quentinho', criadoEm: new Date() },
    ]);

    const { status, corpo } = await chamar('GET', `/api/avaliacoes/produto/${PRODUTO_1}`, token);

    expect(status).toBe(200);
    expect(corpo.media).toBe(4.7);
    expect(corpo.total).toBe(3);
    expect(corpo.distribuicao).toEqual([
      { nota: 5, total: 2 },
      { nota: 4, total: 1 },
      { nota: 3, total: 0 },
      { nota: 2, total: 0 },
      { nota: 1, total: 0 },
    ]);
    const [consulta] = prismaMock.avaliacao.findMany.mock.calls[0];
    // Só as avaliações deste produto, do condomínio ativo, sem as removidas pelo síndico
    expect(consulta.where).toEqual({ produtoId: PRODUTO_1, produto: { condominioId: CONDOMINIO_A }, removidaPor: null });
    expect(consulta.select).not.toHaveProperty('compradorId');
    expect(consulta.select).not.toHaveProperty('pedidoId');
  });
});
