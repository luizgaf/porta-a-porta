import jwt from 'jsonwebtoken';
import { prismaMock } from './helpers/prismaMock';
import { iniciarApi, encerrarApi, entrarComo, chamar } from './helpers/api';
import { CONDOMINIO_A, CONDOMINIO_B, PRODUTO_1, sindico } from './helpers/dados';

beforeAll(iniciarApi);
afterAll(encerrarApi);

// Morador do condomínio B que pede para participar do condomínio A
const vizinhoB = {
  id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
  condominioId: CONDOMINIO_B,
  nome: 'Bia Vizinha',
  email: 'bia@teste.com',
  unidade: 'Casa 12',
  tipo: 'VENDEDOR' as const,
  condominioOrigemId: CONDOMINIO_B,
};
const VINCULO_1 = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1';

// Token do vizinho com o condomínio A como ativo (o que a troca de condomínio devolve)
const tokenNoCondominioA = () => {
  prismaMock.usuario.findUnique.mockResolvedValue(vizinhoB);
  return jwt.sign({ id: vizinhoB.id, condominioId: CONDOMINIO_A, tipo: 'COMPRADOR' }, process.env.JWT_SECRET!);
};

const avisosGravados = () => prismaMock.notificacao.createMany.mock.calls.flatMap(([arg]) => arg.data);

describe('Participação em outros condomínios', () => {
  test('TU33 - pedido para participar de outro condomínio fica pendente e avisa o síndico de lá', async () => {
    const token = entrarComo(vizinhoB);
    prismaMock.condominio.findUnique.mockResolvedValue({ id: CONDOMINIO_A, nome: 'Residencial A' });
    prismaMock.vinculo.findUnique.mockResolvedValue(null);
    prismaMock.vinculo.create.mockResolvedValue({ id: VINCULO_1, status: 'PENDENTE', unidade: 'Apto 905' });
    prismaMock.usuario.findMany.mockResolvedValue([{ id: sindico.id }]);

    const { status } = await chamar('POST', '/api/vinculos', token, {
      condominioId: CONDOMINIO_A,
      unidade: 'Apto 905',
      querVender: true,
    });

    expect(status).toBe(201);
    expect(prismaMock.vinculo.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        usuarioId: vizinhoB.id,
        condominioId: CONDOMINIO_A,
        unidade: 'Apto 905',
        tipoSolicitado: 'VENDEDOR',
        status: 'PENDENTE',
      }),
    });
    expect(avisosGravados()).toEqual([
      expect.objectContaining({ condominioId: CONDOMINIO_A, usuarioId: sindico.id, tipo: 'PEDIDO_VINCULO' }),
    ]);
  });

  test('TU34 - sem vínculo aprovado, o usuário não acessa nem troca para outro condomínio (RNF02)', async () => {
    const token = tokenNoCondominioA();
    prismaMock.vinculo.findUnique.mockResolvedValue({ status: 'PENDENTE', unidade: 'Apto 905', tipo: null });

    const acesso = await chamar('GET', '/api/produtos', token);
    expect(acesso.status).toBe(403);
    expect(acesso.corpo.code).toBe('VINCULO_INVALIDO');
    expect(prismaMock.produto.findMany).not.toHaveBeenCalled();

    const troca = await chamar('POST', '/api/vinculos/trocar', entrarComo(vizinhoB), { condominioId: CONDOMINIO_A });
    expect(troca.status).toBe(403);
    expect(troca.corpo.token).toBeUndefined();
  });

  test('TU35 - síndico aprova definindo o perfil; a decisão vai para a auditoria e o aviso para o condomínio de origem', async () => {
    const token = entrarComo(sindico);
    prismaMock.vinculo.findFirst.mockResolvedValue({
      id: VINCULO_1,
      usuarioId: vizinhoB.id,
      unidade: 'Apto 905',
      status: 'PENDENTE',
      tipoSolicitado: 'VENDEDOR',
      usuario: { condominioId: CONDOMINIO_B },
      condominio: { nome: 'Residencial A' },
    });
    prismaMock.vinculo.update.mockResolvedValue({ id: VINCULO_1, status: 'APROVADO', tipo: 'COMPRADOR' });
    prismaMock.logAuditoria.create.mockResolvedValue({});

    const { status } = await chamar('PATCH', `/api/vinculos/${VINCULO_1}`, token, { aprovar: true, tipo: 'COMPRADOR' });

    expect(status).toBe(200);
    expect(prismaMock.vinculo.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: VINCULO_1, condominioId: CONDOMINIO_A } }),
    );
    expect(prismaMock.vinculo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'APROVADO', tipo: 'COMPRADOR', decididoPor: sindico.id }),
      }),
    );
    expect(prismaMock.logAuditoria.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ sindicoId: sindico.id, acao: 'APROVAR_VINCULO', entidadeId: VINCULO_1 }),
    });
    expect(avisosGravados()).toEqual([
      expect.objectContaining({ condominioId: CONDOMINIO_B, usuarioId: vizinhoB.id, tipo: 'VINCULO_APROVADO' }),
    ]);
  });

  test('TU36 - recusa sem motivo e pedido de outro condomínio não são aceitos', async () => {
    const token = entrarComo(sindico);

    const semMotivo = await chamar('PATCH', `/api/vinculos/${VINCULO_1}`, token, { aprovar: false });
    expect(semMotivo.status).toBe(400);

    prismaMock.vinculo.findFirst.mockResolvedValue(null);
    const deOutro = await chamar('PATCH', `/api/vinculos/${VINCULO_1}`, token, { aprovar: false, justificativa: 'Não mora aqui' });
    expect(deOutro.status).toBe(404);
    expect(prismaMock.vinculo.update).not.toHaveBeenCalled();
    expect(prismaMock.logAuditoria.create).not.toHaveBeenCalled();
  });

  test('TU37 - com vínculo aprovado, a vitrine é a do condomínio ativo e mostra a unidade do vínculo', async () => {
    const token = tokenNoCondominioA();
    prismaMock.vinculo.findUnique.mockResolvedValue({ status: 'APROVADO', unidade: 'Apto 905', tipo: 'VENDEDOR' });
    prismaMock.produto.findMany.mockResolvedValue([
      { id: PRODUTO_1, nome: 'Bolo', status: 'ATIVO', vendedor: { id: vizinhoB.id, nome: 'Bia Vizinha', unidade: 'Casa 12' } },
    ]);
    prismaMock.produto.count.mockResolvedValue(1);
    prismaMock.vinculo.findMany.mockResolvedValue([{ usuarioId: vizinhoB.id, unidade: 'Apto 905' }]);

    const { status, corpo } = await chamar('GET', '/api/produtos', token);

    expect(status).toBe(200);
    expect(prismaMock.produto.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ condominioId: CONDOMINIO_A }) }),
    );
    expect(corpo.produtos[0].vendedor.unidade).toBe('Apto 905');
  });

  test('TU38 - quem foi aprovado só como comprador não anuncia naquele condomínio', async () => {
    const token = tokenNoCondominioA();
    prismaMock.vinculo.findUnique.mockResolvedValue({ status: 'APROVADO', unidade: 'Apto 905', tipo: 'COMPRADOR' });

    const { status } = await chamar('POST', '/api/produtos', token, {
      nome: 'Bolo de cenoura',
      preco: 25,
      categoria: 'Doces & Salgados',
    });

    expect(status).toBe(403);
    expect(prismaMock.produto.create).not.toHaveBeenCalled();
  });
});
