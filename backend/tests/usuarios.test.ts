import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { prismaMock } from './helpers/prismaMock';
import { iniciarApi, encerrarApi, entrarComo, chamar, enviarArquivo } from './helpers/api';
import { CONDOMINIO_A, comprador, comprador2, sindico, vendedor } from './helpers/dados';

beforeAll(iniciarApi);
afterAll(async () => {
  await encerrarApi();
  fs.rmSync(process.env.UPLOAD_DIR!, { recursive: true, force: true });
});

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

const avisosGravados = () => prismaMock.notificacao.createMany.mock.calls.flatMap(([arg]) => arg.data);

// Moradores do condomínio A como o banco devolve para o painel
const moradores = [
  { ...vendedor, fotoUrl: null, criadoEm: new Date() },
  { ...comprador, fotoUrl: '/uploads/joao.png', criadoEm: new Date('2026-01-10') },
  { ...sindico, fotoUrl: null, criadoEm: new Date('2026-01-01') },
];

describe('Foto de perfil e painel de usuários', () => {
  test('TU47 - usuário envia a própria foto de perfil', async () => {
    const token = entrarComo(comprador);
    prismaMock.usuario.update.mockResolvedValue({});

    const { status, corpo } = await enviarArquivo('/api/usuarios/me/foto', token, PNG, 'image/png');

    expect(status).toBe(200);
    expect(corpo.fotoUrl).toMatch(/^\/uploads\/[0-9a-f-]+\.png$/);
    expect(prismaMock.usuario.update).toHaveBeenCalledWith({ where: { id: comprador.id }, data: { fotoUrl: corpo.fotoUrl } });
    expect(fs.existsSync(path.join(process.env.UPLOAD_DIR!, path.basename(corpo.fotoUrl)))).toBe(true);
  });

  test('TU48 - painel do síndico resume os usuários, destaca os novos e não expõe e-mail nem CPF', async () => {
    const token = entrarComo(sindico);
    prismaMock.usuario.findMany.mockResolvedValue(moradores);
    prismaMock.vinculo.findMany.mockResolvedValue([]);
    prismaMock.vinculo.count.mockResolvedValue(2);
    prismaMock.sancao.findMany.mockResolvedValue([
      { usuarioId: comprador.id, tipo: 'ADVERTENCIA', motivo: 'Atraso', ate: null, revogadaEm: null, criadoEm: new Date() },
      { usuarioId: comprador.id, tipo: 'SUSPENSAO', motivo: 'Reincidência', ate: new Date(Date.now() + 86400000), revogadaEm: null, criadoEm: new Date() },
    ]);

    const { status, corpo } = await chamar('GET', '/api/usuarios/painel', token);

    expect(status).toBe(200);
    expect(corpo.resumo).toEqual(
      expect.objectContaining({ total: 3, novos: 1, suspensos: 1, banidos: 0, comAdvertencia: 1, pedidosParticipacao: 2 }),
    );
    const joao = corpo.usuarios.find((u: { id: string }) => u.id === comprador.id);
    expect(joao).toEqual(expect.objectContaining({ situacao: 'SUSPENSO', advertencias: 1, novo: false }));
    expect(corpo.usuarios[0]).toEqual(expect.objectContaining({ id: vendedor.id, novo: true }));
    const texto = JSON.stringify(corpo);
    expect(texto).not.toContain('@teste.com');
    expect(texto).not.toContain('cpf');
  });

  test('TU49 - síndico suspende por dias: anúncios saem da vitrine, auditoria e aviso registrados', async () => {
    const token = entrarComo(sindico);
    prismaMock.usuario.findMany.mockResolvedValue(moradores);
    prismaMock.vinculo.findMany.mockResolvedValue([]);
    prismaMock.sancao.create.mockResolvedValue({ id: 's1', tipo: 'SUSPENSAO' });

    const semDias = await chamar('POST', `/api/usuarios/${vendedor.id}/sancoes`, token, { tipo: 'SUSPENSAO', motivo: 'Vendas falsas' });
    expect(semDias.status).toBe(400);

    const { status } = await chamar('POST', `/api/usuarios/${vendedor.id}/sancoes`, token, {
      tipo: 'SUSPENSAO',
      motivo: 'Vendas falsas',
      dias: 7,
    });

    expect(status).toBe(201);
    const criada = prismaMock.sancao.create.mock.calls[0][0].data;
    expect(criada).toEqual(expect.objectContaining({ usuarioId: vendedor.id, condominioId: CONDOMINIO_A, tipo: 'SUSPENSAO' }));
    const dias = (criada.ate.getTime() - Date.now()) / 86400000;
    expect(dias).toBeGreaterThan(6.9);
    expect(prismaMock.produto.updateMany).toHaveBeenCalledWith({
      where: { vendedorId: vendedor.id, condominioId: CONDOMINIO_A, status: 'ATIVO' },
      data: { status: 'PAUSADO' },
    });
    expect(prismaMock.logAuditoria.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ acao: 'SUSPENDER_USUARIO', entidadeId: vendedor.id, justificativa: 'Vendas falsas' }),
    });
    expect(avisosGravados()).toEqual([expect.objectContaining({ usuarioId: vendedor.id, tipo: 'SUSPENSAO' })]);
  });

  test('TU50 - usuário suspenso ou banido não acessa o condomínio nem faz login', async () => {
    const ate = new Date(Date.now() + 3 * 86400000);
    prismaMock.sancao.findFirst.mockResolvedValue({ id: 's1', tipo: 'SUSPENSAO', motivo: 'Vendas falsas', ate });

    const acesso = await chamar('GET', '/api/produtos', entrarComo(vendedor));
    expect(acesso.status).toBe(403);
    expect(acesso.corpo.code).toBe('USUARIO_SUSPENSO');
    expect(acesso.corpo.error).toContain('Vendas falsas');
    expect(prismaMock.produto.findMany).not.toHaveBeenCalled();

    prismaMock.sancao.findFirst.mockResolvedValue({ id: 's2', tipo: 'BANIMENTO', motivo: 'Golpe', ate: null });
    prismaMock.usuario.findUnique.mockResolvedValue({ ...vendedor, senhaHash: await bcrypt.hash('vendedor123', 4), condominio: { nome: 'A' } });
    const login = await chamar('POST', '/api/auth/login', undefined, { email: vendedor.email, senha: 'vendedor123' });
    expect(login.status).toBe(403);
    expect(login.corpo.code).toBe('USUARIO_BANIDO');
    expect(login.corpo.token).toBeUndefined();
  });

  test('TU51 - síndico não aplica sanção a si mesmo, a outro síndico nem a quem não é do condomínio', async () => {
    const token = entrarComo(sindico);
    prismaMock.usuario.findMany.mockResolvedValue(moradores);
    prismaMock.vinculo.findMany.mockResolvedValue([]);
    const sancao = { tipo: 'BANIMENTO', motivo: 'Teste de permissão' };

    expect((await chamar('POST', `/api/usuarios/${sindico.id}/sancoes`, token, sancao)).status).toBe(400);
    expect((await chamar('POST', `/api/usuarios/${comprador2.id}/sancoes`, token, sancao)).status).toBe(404);
    expect((await chamar('POST', `/api/usuarios/${vendedor.id}/sancoes`, entrarComo(comprador), sancao)).status).toBe(403);
    expect(prismaMock.sancao.create).not.toHaveBeenCalled();
  });

  test('TU52 - síndico reativa usuário suspenso e a decisão vai para a auditoria', async () => {
    const token = entrarComo(sindico);
    prismaMock.usuario.findMany.mockResolvedValue(moradores);
    prismaMock.vinculo.findMany.mockResolvedValue([]);
    // O síndico não está bloqueado; o vendedor está suspenso
    prismaMock.sancao.findFirst.mockImplementation(async ({ where }) =>
      where.usuarioId === vendedor.id ? { id: 's1', tipo: 'SUSPENSAO', motivo: 'Vendas falsas', ate: new Date(Date.now() + 86400000) } : null,
    );

    const { status } = await chamar('POST', `/api/usuarios/${vendedor.id}/reativar`, token, {});

    expect(status).toBe(200);
    expect(prismaMock.sancao.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: expect.objectContaining({ revogadaPor: sindico.id }),
    });
    expect(prismaMock.logAuditoria.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ acao: 'REATIVAR_USUARIO', entidadeId: vendedor.id }),
    });
    expect(avisosGravados()).toEqual([expect.objectContaining({ usuarioId: vendedor.id, tipo: 'REATIVACAO' })]);
  });
});
