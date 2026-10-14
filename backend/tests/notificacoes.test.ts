import { prismaMock } from './helpers/prismaMock';
import { iniciarApi, encerrarApi, entrarComo, chamar } from './helpers/api';
import { CONDOMINIO_A, PEDIDO_1, PRODUTO_1, comprador, comprador2, comprador3, sindico, vendedor } from './helpers/dados';

beforeAll(iniciarApi);
afterAll(encerrarApi);

// Avisos gravados pelo servidor em todas as chamadas de createMany
const avisosGravados = () => prismaMock.notificacao.createMany.mock.calls.flatMap(([arg]) => arg.data);

describe('Notificações internas', () => {
  test('TU19 - novo pedido gera aviso para o vendedor (HU04)', async () => {
    const token = entrarComo(comprador);
    prismaMock.produto.findMany.mockResolvedValue([
      { id: PRODUTO_1, preco: 10, status: 'ATIVO', vendedorId: vendedor.id },
    ]);
    prismaMock.pedido.create.mockResolvedValue({ id: PEDIDO_1 });
    prismaMock.pedido.findUnique.mockResolvedValue({ id: PEDIDO_1, status: 'PENDENTE' });

    const { status } = await chamar('POST', '/api/pedidos', token, {
      unidadeEntrega: 'Apto 101',
      tipoEntrega: 'PORTARIA',
      janelaHorario: 'Amanhã, 18h-21h',
      itens: [{ produtoId: PRODUTO_1, quantidade: 2 }],
    });

    expect(status).toBe(201);
    expect(avisosGravados()).toEqual([
      expect.objectContaining({
        condominioId: CONDOMINIO_A,
        usuarioId: vendedor.id,
        tipo: 'NOVO_PEDIDO',
        entidadeTipo: 'PEDIDO',
        entidadeId: PEDIDO_1,
        mensagem: expect.stringContaining('Apto 101'),
      }),
    ]);
  });

  test('TU20 - mudança de status do pedido gera aviso para o comprador (HU04)', async () => {
    const token = entrarComo(vendedor);
    prismaMock.pedido.findFirst.mockResolvedValue({
      id: PEDIDO_1,
      condominioId: CONDOMINIO_A,
      compradorId: comprador.id,
      unidadeEntrega: 'Apto 101',
      status: 'CONFIRMADO',
      itens: [{ produto: { id: PRODUTO_1, vendedorId: vendedor.id } }],
    });
    prismaMock.pedido.update.mockResolvedValue({ id: PEDIDO_1, status: 'EM_PREPARO' });

    const { status } = await chamar('PATCH', `/api/pedidos/${PEDIDO_1}/status`, token, { status: 'EM_PREPARO' });

    expect(status).toBe(200);
    expect(avisosGravados()).toEqual([
      expect.objectContaining({
        usuarioId: comprador.id,
        tipo: 'STATUS_PEDIDO',
        entidadeId: PEDIDO_1,
        mensagem: 'Seu pedido agora está em preparo.',
      }),
    ]);
  });

  test('TU21 - quarentena automática avisa síndico e vendedor sem identificar os denunciantes (RN02)', async () => {
    prismaMock.produto.findFirst.mockResolvedValue({
      id: PRODUTO_1,
      nome: 'Bolo de cenoura',
      condominioId: CONDOMINIO_A,
      vendedorId: vendedor.id,
      status: 'ATIVO',
    });
    prismaMock.denuncia.create.mockResolvedValue({ id: 'denuncia-3' });
    prismaMock.denuncia.count.mockResolvedValue(3);
    prismaMock.usuario.findMany.mockResolvedValue([{ id: sindico.id }]);

    const token = entrarComo(comprador3);
    const { status } = await chamar('POST', '/api/denuncias', token, {
      produtoId: PRODUTO_1,
      motivo: 'Produto anunciado com informações falsas',
    });

    expect(status).toBe(201);
    const avisos = avisosGravados();
    expect(avisos).toEqual([
      expect.objectContaining({ usuarioId: sindico.id, tipo: 'DENUNCIA_PARA_ANALISE', entidadeId: PRODUTO_1 }),
      expect.objectContaining({ usuarioId: vendedor.id, tipo: 'ANUNCIO_QUARENTENA', entidadeId: PRODUTO_1 }),
    ]);
    const texto = JSON.stringify(avisos);
    for (const denunciante of [comprador, comprador2, comprador3]) {
      expect(texto).not.toContain(denunciante.nome);
      expect(texto).not.toContain(denunciante.unidade);
    }
  });

  test('TU22 - o usuário vê só os próprios avisos, com a contagem de não lidos', async () => {
    const token = entrarComo(comprador);
    prismaMock.notificacao.findMany.mockResolvedValue([{ id: 'aviso-1', mensagem: 'Seu pedido agora está entregue.', lida: false }]);
    prismaMock.notificacao.count.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

    const { status, corpo } = await chamar('GET', '/api/notificacoes', token);

    expect(status).toBe(200);
    expect(corpo.notificacoes).toHaveLength(1);
    expect(corpo.naoLidas).toBe(1);
    expect(prismaMock.notificacao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { usuarioId: comprador.id, condominioId: CONDOMINIO_A } }),
    );
  });

  test('TU23 - o usuário não consegue marcar como lido o aviso de outra pessoa', async () => {
    const token = entrarComo(comprador);
    // O aviso existe, mas pertence a outro usuário: a atualização filtrada não encontra nada
    prismaMock.notificacao.updateMany.mockResolvedValue({ count: 0 });

    const { status, corpo } = await chamar('PATCH', '/api/notificacoes/aviso-do-vendedor/lida', token);

    expect(status).toBe(404);
    expect(corpo.code).toBe('NOTIFICACAO_NOT_FOUND');
    expect(prismaMock.notificacao.updateMany).toHaveBeenCalledWith({
      where: { id: 'aviso-do-vendedor', usuarioId: comprador.id },
      data: { lida: true },
    });
  });
});
