import { prismaMock } from './helpers/prismaMock';
import { iniciarApi, encerrarApi, entrarComo, chamar } from './helpers/api';
import { CONDOMINIO_A, PRODUTO_1, comprador, sindico, vendedor } from './helpers/dados';

beforeAll(iniciarApi);
afterAll(encerrarApi);

describe('Histórico de moderação', () => {
  test('TU57 - o histórico mostra o nome do que foi afetado e pode esconder as consultas de denúncias', async () => {
    const token = entrarComo(sindico);
    prismaMock.logAuditoria.findMany.mockResolvedValue([
      { id: 'l1', acao: 'APLICAR_QUARENTENA', entidadeId: PRODUTO_1, justificativa: 'Produto vencido', criadoEm: new Date(), sindico: { id: sindico.id, nome: sindico.nome } },
      { id: 'l2', acao: 'ADVERTIR_USUARIO', entidadeId: vendedor.id, justificativa: 'Atrasos', criadoEm: new Date(), sindico: { id: sindico.id, nome: sindico.nome } },
    ]);
    prismaMock.logAuditoria.count.mockResolvedValue(2);
    prismaMock.produto.findMany.mockResolvedValue([{ id: PRODUTO_1, nome: 'Bolo de pote' }]);
    prismaMock.usuario.findMany.mockResolvedValue([{ id: vendedor.id, nome: vendedor.nome }]);
    prismaMock.avaliacao.findMany.mockResolvedValue([]);
    prismaMock.vinculo.findMany.mockResolvedValue([]);

    const { status, corpo } = await chamar('GET', '/api/auditoria?ocultarConsultas=true', token);

    expect(status).toBe(200);
    expect(corpo.logs.map((l: { entidadeNome: string }) => l.entidadeNome)).toEqual(['Bolo de pote', vendedor.nome]);
    expect(prismaMock.logAuditoria.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sindico: { condominioId: CONDOMINIO_A }, acao: { not: 'VISUALIZAR_DENUNCIAS' } },
      }),
    );
  });

  test('TU58 - só o síndico consulta o histórico', async () => {
    const { status } = await chamar('GET', '/api/auditoria', entrarComo(comprador));
    expect(status).toBe(403);
    expect(prismaMock.logAuditoria.findMany).not.toHaveBeenCalled();
  });
});
