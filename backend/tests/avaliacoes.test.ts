import { prismaMock } from './helpers/prismaMock';
import { iniciarApi, encerrarApi, entrarComo, chamar } from './helpers/api';
import { PEDIDO_1, comprador } from './helpers/dados';

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
