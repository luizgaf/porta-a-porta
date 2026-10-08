import { Response } from 'express';
import { z } from 'zod';
import { authMiddleware, requireRole, AuthRequest } from '../src/middleware/auth';
import { errorHandler } from '../src/middleware/errorHandler';
import { comprador, sindico } from './helpers/dados';

// Resposta simulada do Express: guarda o status e o corpo enviados
const criarResposta = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};
const comoResponse = (res: ReturnType<typeof criarResposta>) => res as unknown as Response;
const requisicao = (dados: Partial<AuthRequest>) => dados as AuthRequest;

describe('Middlewares', () => {
  test('TU14 - autenticação recusa requisição sem token e com token inválido', async () => {
    const proximo = jest.fn();

    const semToken = criarResposta();
    await authMiddleware(requisicao({ headers: {} }), comoResponse(semToken), proximo);

    expect(semToken.status).toHaveBeenCalledWith(401);
    expect(semToken.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'UNAUTHORIZED' }));

    const tokenInvalido = criarResposta();
    await authMiddleware(
      requisicao({ headers: { authorization: 'Bearer token-que-nao-existe' } }),
      comoResponse(tokenInvalido),
      proximo,
    );

    expect(tokenInvalido.status).toHaveBeenCalledWith(401);
    expect(tokenInvalido.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'INVALID_TOKEN' }));

    // Em nenhum dos casos a rota protegida é executada
    expect(proximo).not.toHaveBeenCalled();
  });

  test('TU15 - autorização recusa comprador em rota restrita ao síndico', () => {
    const apenasSindico = requireRole('SINDICO');

    const recusada = criarResposta();
    const proximoComprador = jest.fn();
    apenasSindico(requisicao({ user: comprador }), comoResponse(recusada), proximoComprador);

    expect(recusada.status).toHaveBeenCalledWith(403);
    expect(recusada.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'FORBIDDEN' }));
    expect(proximoComprador).not.toHaveBeenCalled();

    const aceita = criarResposta();
    const proximoSindico = jest.fn();
    apenasSindico(requisicao({ user: sindico }), comoResponse(aceita), proximoSindico);

    expect(proximoSindico).toHaveBeenCalledTimes(1);
    expect(aceita.status).not.toHaveBeenCalled();
  });

  test('TU16 - tratamento de erros devolve o status e o código de cada tipo de erro', () => {
    const tratar = (erro: unknown) => {
      const res = criarResposta();
      errorHandler(erro as Error, requisicao({}), comoResponse(res), jest.fn());
      return { status: res.status.mock.calls[0][0], corpo: res.json.mock.calls[0][0] };
    };

    // Erro de validação (Zod)
    const validacao = z.object({ nome: z.string() }).safeParse({});
    const invalido = tratar(validacao.success ? undefined : validacao.error);
    expect(invalido.status).toBe(400);
    expect(invalido.corpo.code).toBe('VALIDATION_ERROR');
    expect(invalido.corpo.details).toEqual([expect.objectContaining({ field: 'nome' })]);

    // Registro duplicado (restrição única do banco)
    const duplicado = tratar(Object.assign(new Error('unique'), { code: 'P2002', meta: { target: ['email'] } }));
    expect(duplicado.status).toBe(409);
    expect(duplicado.corpo.code).toBe('DUPLICATE_ENTRY');

    // Erro inesperado: não expõe detalhes internos
    const inesperado = tratar(new Error('falha de conexão com o banco'));
    expect(inesperado.status).toBe(500);
    expect(inesperado.corpo).toEqual({ error: 'Erro interno do servidor', code: 'INTERNAL_ERROR' });
  });
});
