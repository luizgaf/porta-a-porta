import { prismaMock } from './helpers/prismaMock';
import { iniciarApi, encerrarApi, entrarComo, chamar } from './helpers/api';
import { CONDOMINIO_A, PRODUTO_1, comprador, sindico, vendedor } from './helpers/dados';
import { MOTIVO_AUTOMATICO } from '../src/services/quarentena';

beforeAll(iniciarApi);
afterAll(encerrarApi);

const produtoEmQuarentena = {
  id: PRODUTO_1,
  condominioId: CONDOMINIO_A,
  vendedorId: vendedor.id,
  nome: 'Bolo de pote',
  status: 'QUARENTENA',
  vendedor: { id: vendedor.id, nome: vendedor.nome, unidade: vendedor.unidade },
};

const avisosGravados = () => prismaMock.notificacao.createMany.mock.calls.flatMap(([arg]) => arg.data);

describe('Anúncio em quarentena', () => {
  test('TU42 - anúncio em quarentena não aparece para outros moradores (RN02)', async () => {
    const token = entrarComo(comprador);
    prismaMock.produto.findFirst.mockResolvedValue(produtoEmQuarentena);

    const detalhe = await chamar('GET', `/api/produtos/${PRODUTO_1}`, token);
    expect(detalhe.status).toBe(404);

    prismaMock.produto.findMany.mockResolvedValue([]);
    prismaMock.produto.count.mockResolvedValue(0);
    await chamar('GET', '/api/produtos', token);
    // Na vitrine, quarentena só entra quando o anúncio é do próprio usuário
    expect(prismaMock.produto.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: [
            {
              OR: [
                { status: { in: ['ATIVO', 'PAUSADO'] } },
                { status: 'QUARENTENA', vendedorId: comprador.id },
              ],
            },
          ],
        }),
      }),
    );
  });

  test('TU43 - o vendedor dono vê o próprio anúncio em quarentena com o motivo do síndico', async () => {
    const token = entrarComo(vendedor);
    prismaMock.produto.findFirst.mockResolvedValue(produtoEmQuarentena);
    prismaMock.logAuditoria.findMany.mockResolvedValue([
      { entidadeId: PRODUTO_1, acao: 'APLICAR_QUARENTENA', justificativa: 'Foto não corresponde ao produto', criadoEm: new Date() },
    ]);

    const { status, corpo } = await chamar('GET', `/api/produtos/${PRODUTO_1}`, token);

    expect(status).toBe(200);
    expect(corpo.produto.quarentena).toEqual(
      expect.objectContaining({ motivo: 'Foto não corresponde ao produto', porSindico: true }),
    );

    // Sem decisão do síndico (ou depois de uma restauração), o motivo é a suspensão automática
    prismaMock.logAuditoria.findMany.mockResolvedValue([
      { entidadeId: PRODUTO_1, acao: 'RESTAURAR_PRODUTO', justificativa: 'Denúncias sem fundamento', criadoEm: new Date() },
    ]);
    const automatica = await chamar('GET', `/api/produtos/${PRODUTO_1}`, token);
    expect(automatica.corpo.produto.quarentena).toEqual(
      expect.objectContaining({ motivo: MOTIVO_AUTOMATICO, porSindico: false }),
    );
  });

  test('TU44 - o síndico só aplica quarentena com motivo, e o vendedor recebe o motivo no aviso', async () => {
    const token = entrarComo(sindico);
    prismaMock.produto.findFirst.mockResolvedValue({ ...produtoEmQuarentena, status: 'ATIVO' });

    const semMotivo = await chamar('PATCH', `/api/denuncias/${PRODUTO_1}/quarentena`, token, { acao: 'QUARENTENA' });
    expect(semMotivo.status).toBe(400);
    expect(prismaMock.produto.update).not.toHaveBeenCalled();

    prismaMock.produto.update.mockResolvedValue({ ...produtoEmQuarentena });
    prismaMock.logAuditoria.create.mockResolvedValue({});
    const comMotivo = await chamar('PATCH', `/api/denuncias/${PRODUTO_1}/quarentena`, token, {
      acao: 'QUARENTENA',
      justificativa: 'Produto vencido segundo as denúncias',
    });

    expect(comMotivo.status).toBe(200);
    expect(prismaMock.logAuditoria.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ acao: 'APLICAR_QUARENTENA', justificativa: 'Produto vencido segundo as denúncias' }),
    });
    expect(avisosGravados()).toEqual([
      expect.objectContaining({
        usuarioId: vendedor.id,
        tipo: 'ANUNCIO_QUARENTENA',
        mensagem: expect.stringContaining('Motivo: Produto vencido segundo as denúncias'),
      }),
    ]);
  });
});
