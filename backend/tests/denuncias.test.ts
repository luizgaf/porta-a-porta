import { prismaMock } from './helpers/prismaMock';
import { iniciarApi, encerrarApi, entrarComo, chamar } from './helpers/api';
import { CONDOMINIO_A, PRODUTO_1, comprador, comprador2, comprador3, sindico, vendedor } from './helpers/dados';

beforeAll(iniciarApi);
afterAll(encerrarApi);

const denuncia = { produtoId: PRODUTO_1, motivo: 'Produto anunciado com informações falsas' };
const produtoDoVendedor = { id: PRODUTO_1, condominioId: CONDOMINIO_A, vendedorId: vendedor.id, status: 'ATIVO' };

describe('Denúncias', () => {
  test('TU09 - o anúncio vai para quarentena na terceira denúncia de usuários distintos (RN02)', async () => {
    prismaMock.produto.findFirst.mockResolvedValue(produtoDoVendedor);
    prismaMock.denuncia.create.mockResolvedValue({ id: 'denuncia', ...denuncia });

    // Primeira e segunda denúncias: o produto continua ativo
    prismaMock.denuncia.count.mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    const primeira = await chamar('POST', '/api/denuncias', entrarComo(comprador), denuncia);
    const segunda = await chamar('POST', '/api/denuncias', entrarComo(comprador2), denuncia);

    expect(primeira.status).toBe(201);
    expect(segunda.status).toBe(201);
    expect(prismaMock.produto.update).not.toHaveBeenCalled();

    // Terceira denúncia: quarentena automática
    prismaMock.denuncia.count.mockResolvedValueOnce(3);
    const terceira = await chamar('POST', '/api/denuncias', entrarComo(comprador3), denuncia);

    expect(terceira.status).toBe(201);
    expect(prismaMock.produto.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.produto.update).toHaveBeenCalledWith({
      where: { id: PRODUTO_1 },
      data: { status: 'QUARENTENA' },
    });
  });

  test('TU10 - o mesmo usuário não consegue denunciar o mesmo anúncio duas vezes', async () => {
    const token = entrarComo(comprador);
    prismaMock.produto.findFirst.mockResolvedValue(produtoDoVendedor);
    // O banco recusa a segunda denúncia pela restrição UNIQUE(produto_id, denunciante_id)
    prismaMock.denuncia.create.mockRejectedValue({ code: 'P2002' });

    const { status, corpo } = await chamar('POST', '/api/denuncias', token, denuncia);

    expect(status).toBe(409);
    expect(corpo.code).toBe('DUPLICATE_DENUNCIA');
    expect(prismaMock.denuncia.count).not.toHaveBeenCalled();
    expect(prismaMock.produto.update).not.toHaveBeenCalled();
  });

  test('TU11 - a fila de moderação do síndico não identifica o denunciante (RN02)', async () => {
    const token = entrarComo(sindico);
    // Mesmo que a consulta trouxesse a identificação, ela não pode sair na resposta
    const registro = {
      id: 'denuncia-1',
      produtoId: PRODUTO_1,
      motivo: denuncia.motivo,
      criadoEm: '2026-10-01T12:00:00.000Z',
      denuncianteId: comprador.id,
      denunciante: { id: comprador.id, nome: comprador.nome, unidade: comprador.unidade },
    };
    prismaMock.denuncia.findMany.mockResolvedValue([{ ...registro, produto: { id: PRODUTO_1, nome: 'Bolo' } }]);
    prismaMock.denuncia.count.mockResolvedValue(1);
    prismaMock.logAuditoria.create.mockResolvedValue({});

    const fila = await chamar('GET', '/api/denuncias', token);
    const detalhe = await chamar('GET', `/api/denuncias/produto/${PRODUTO_1}`, token);

    for (const resposta of [fila, detalhe]) {
      expect(resposta.status).toBe(200);
      expect(resposta.corpo.denuncias).toHaveLength(1);
      expect(resposta.corpo.denuncias[0].motivo).toBe(denuncia.motivo);
      expect(resposta.corpo.denuncias[0]).not.toHaveProperty('denunciante');
      expect(resposta.corpo.denuncias[0]).not.toHaveProperty('denuncianteId');

      const texto = JSON.stringify(resposta.corpo);
      expect(texto).not.toContain(comprador.nome);
      expect(texto).not.toContain(comprador.unidade);
      expect(texto).not.toContain(comprador.id);
    }

    // As consultas também não pedem a identificação ao banco
    for (const [consulta] of prismaMock.denuncia.findMany.mock.calls) {
      expect(consulta.include).toBeUndefined();
      expect(consulta.select).not.toHaveProperty('denunciante');
      expect(consulta.select).not.toHaveProperty('denuncianteId');
    }
  });
});
