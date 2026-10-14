import { prismaMock } from './helpers/prismaMock';
import { iniciarApi, encerrarApi, entrarComo, chamar } from './helpers/api';
import { CONDOMINIO_A, PEDIDO_1, comprador, sindico, vendedor } from './helpers/dados';

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
    expect(prismaMock.pedido.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: PEDIDO_1, status: 'ENTREGUE' }),
    });
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
  const avaliacaoDoPedido = { id: 'avaliacao-1', pedidoId: PEDIDO_1, compradorId: comprador.id, nota: 1, removidaPor: null };

  test('TU24 - síndico remove avaliação com justificativa registrada em auditoria (RN02)', async () => {
    const token = entrarComo(sindico);
    prismaMock.avaliacao.findFirst.mockResolvedValue(avaliacaoDoPedido);
    prismaMock.avaliacao.update.mockResolvedValue({ ...avaliacaoDoPedido, removidaPor: sindico.id });
    prismaMock.logAuditoria.create.mockResolvedValue({});

    const { status } = await chamar('DELETE', `/api/avaliacoes/${PEDIDO_1}`, token, {
      justificativa: 'Comentário ofensivo ao vendedor',
    });

    expect(status).toBe(200);
    expect(prismaMock.avaliacao.findFirst).toHaveBeenCalledWith({
      where: { pedidoId: PEDIDO_1, pedido: { condominioId: CONDOMINIO_A } },
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

    const semJustificativa = await chamar('DELETE', `/api/avaliacoes/${PEDIDO_1}`, token, {});
    expect(semJustificativa.status).toBe(400);
    expect(semJustificativa.corpo.code).toBe('VALIDATION_ERROR');

    // Avaliação de pedido de outro condomínio: a busca filtrada não encontra
    prismaMock.avaliacao.findFirst.mockResolvedValue(null);
    const outroCondominio = await chamar('DELETE', `/api/avaliacoes/${PEDIDO_1}`, token, {
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
    expect(consulta.select.pedido.select).not.toHaveProperty('id');
    // Avaliações removidas pelo síndico não aparecem para o vendedor
    expect(consulta.where.removidaPor).toBeNull();
  });
});
