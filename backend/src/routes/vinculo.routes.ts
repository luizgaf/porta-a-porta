import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';
import { notificar } from '../services/notificacoes';
import { gerarToken } from '../services/sessao';

// Vínculos com outros condomínios.
// O usuário pede para participar de outro condomínio informando a unidade e se quer vender lá.
// O síndico daquele condomínio aprova (definindo o perfil: COMPRADOR ou VENDEDOR) ou recusa.
// Com o vínculo aprovado, o usuário troca o condomínio ativo e passa a ver a vitrine de lá (RNF02).

const router = Router();
const prisma = new PrismaClient();

const pedirSchema = z.object({
  condominioId: z.string().min(1, 'Condomínio inválido'),
  unidade: z.string().trim().min(1, 'Unidade é obrigatória').max(60),
  querVender: z.boolean().default(false),
});

const trocarSchema = z.object({
  condominioId: z.string().min(1, 'Condomínio inválido'),
});

const decidirSchema = z
  .object({
    aprovar: z.boolean(),
    tipo: z.enum(['COMPRADOR', 'VENDEDOR']).optional(),
    justificativa: z.string().trim().max(500).optional(),
  })
  .refine((d) => d.aprovar || (d.justificativa && d.justificativa.length >= 5), {
    message: 'Informe o motivo da recusa (mínimo 5 caracteres)',
    path: ['justificativa'],
  });

const PERFIL_TEXTO = { COMPRADOR: 'comprador', VENDEDOR: 'vendedor', SINDICO: 'síndico' } as const;

// GET /api/vinculos - Condomínios do usuário: o de origem e os vínculos (pendentes, aprovados e recusados)
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.user!.id },
    select: {
      unidade: true,
      tipo: true,
      condominio: { select: { id: true, nome: true, endereco: true } },
      vinculos: {
        select: {
          id: true,
          unidade: true,
          tipo: true,
          tipoSolicitado: true,
          status: true,
          criadoEm: true,
          condominio: { select: { id: true, nome: true, endereco: true } },
        },
        orderBy: { criadoEm: 'asc' },
      },
    },
  });

  if (!usuario) {
    throw new AppError(404, 'Usuário não encontrado', 'USER_NOT_FOUND');
  }

  const origem = {
    condominio: usuario.condominio,
    unidade: usuario.unidade,
    tipo: usuario.tipo,
    status: 'APROVADO' as const,
    origem: true,
  };

  const vinculos = usuario.vinculos.map((v) => ({
    id: v.id,
    condominio: v.condominio,
    unidade: v.unidade,
    tipo: v.tipo ?? v.tipoSolicitado,
    status: v.status,
    origem: false,
    criadoEm: v.criadoEm,
  }));

  res.json({ condominioAtivoId: req.user!.condominioId, condominios: [origem, ...vinculos] });
}));

// POST /api/vinculos - Pedir para participar de outro condomínio
router.post('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = pedirSchema.parse(req.body);

  if (data.condominioId === req.user!.condominioOrigemId) {
    throw new AppError(400, 'Você já participa deste condomínio', 'JA_PARTICIPA');
  }

  const condominio = await prisma.condominio.findUnique({
    where: { id: data.condominioId },
    select: { id: true, nome: true },
  });

  if (!condominio) {
    throw new AppError(404, 'Condomínio não encontrado', 'CONDOMINIO_NOT_FOUND');
  }

  const chave = { usuarioId_condominioId: { usuarioId: req.user!.id, condominioId: data.condominioId } };
  const existente = await prisma.vinculo.findUnique({ where: chave, select: { status: true } });

  if (existente?.status === 'APROVADO') {
    throw new AppError(409, 'Você já participa deste condomínio', 'JA_PARTICIPA');
  }
  if (existente?.status === 'PENDENTE') {
    throw new AppError(409, 'Seu pedido para este condomínio já está aguardando o síndico', 'PEDIDO_PENDENTE');
  }

  const tipoSolicitado = data.querVender ? 'VENDEDOR' : 'COMPRADOR';
  const dados = {
    unidade: data.unidade,
    tipoSolicitado,
    tipo: null,
    status: 'PENDENTE',
    decididoPor: null,
    decididoEm: null,
  } as const;

  // Um pedido recusado pode ser refeito: o mesmo registro volta para PENDENTE
  const vinculo = existente
    ? await prisma.vinculo.update({ where: chave, data: dados })
    : await prisma.vinculo.create({ data: { ...dados, usuarioId: req.user!.id, condominioId: data.condominioId } });

  const sindicos = await prisma.usuario.findMany({
    where: { condominioId: data.condominioId, tipo: 'SINDICO' },
    select: { id: true },
  });

  await notificar(
    prisma,
    sindicos.map((s) => ({
      condominioId: data.condominioId,
      usuarioId: s.id,
      tipo: 'PEDIDO_VINCULO' as const,
      mensagem: `Novo pedido para participar do condomínio como ${PERFIL_TEXTO[tipoSolicitado]}, unidade ${data.unidade}. Veja em Moderação > Moradores.`,
      entidadeTipo: 'VINCULO' as const,
      entidadeId: vinculo.id,
    })),
  );

  res.status(201).json({
    message: `Pedido enviado. O síndico do ${condominio.nome} vai analisar.`,
    vinculo: { id: vinculo.id, status: vinculo.status, unidade: vinculo.unidade, tipoSolicitado },
  });
}));

// POST /api/vinculos/trocar - Muda o condomínio ativo e devolve um token novo
router.post('/trocar', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { condominioId } = trocarSchema.parse(req.body);

  const usuario = await prisma.usuario.findUnique({
    where: { id: req.user!.id },
    select: { id: true, condominioId: true, nome: true, email: true, unidade: true, tipo: true, criadoEm: true },
  });

  if (!usuario) {
    throw new AppError(404, 'Usuário não encontrado', 'USER_NOT_FOUND');
  }

  let unidade = usuario.unidade;
  let tipo = usuario.tipo;

  if (condominioId !== usuario.condominioId) {
    const vinculo = await prisma.vinculo.findUnique({
      where: { usuarioId_condominioId: { usuarioId: usuario.id, condominioId } },
      select: { status: true, unidade: true, tipo: true },
    });

    if (!vinculo || vinculo.status !== 'APROVADO' || !vinculo.tipo) {
      throw new AppError(403, 'Você ainda não tem acesso a este condomínio', 'VINCULO_INVALIDO');
    }

    unidade = vinculo.unidade;
    tipo = vinculo.tipo;
  }

  const condominio = await prisma.condominio.findUnique({
    where: { id: condominioId },
    select: { id: true, nome: true },
  });

  res.json({
    token: gerarToken(usuario.id, condominioId, tipo),
    usuario: {
      ...usuario,
      condominioId,
      unidade,
      tipo,
      condominioOrigemId: usuario.condominioId,
      condominioNome: condominio?.nome,
    },
  });
}));

// GET /api/vinculos/pendentes - Pedidos de participação no condomínio do síndico
router.get('/pendentes', authMiddleware, requireRole('SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const pedidos = await prisma.vinculo.findMany({
    where: { condominioId: req.user!.condominioId, status: 'PENDENTE' },
    select: {
      id: true,
      unidade: true,
      tipoSolicitado: true,
      criadoEm: true,
      // O síndico precisa saber quem está pedindo para decidir; CPF e e-mail não são enviados
      usuario: { select: { nome: true, condominio: { select: { nome: true } } } },
    },
    orderBy: { criadoEm: 'asc' },
  });

  res.json({
    pedidos: pedidos.map((p) => ({
      id: p.id,
      nome: p.usuario.nome,
      condominioOrigem: p.usuario.condominio.nome,
      unidade: p.unidade,
      tipoSolicitado: p.tipoSolicitado,
      criadoEm: p.criadoEm,
    })),
  });
}));

// PATCH /api/vinculos/:id - Síndico aprova (definindo o perfil) ou recusa (com motivo)
router.patch('/:id', authMiddleware, requireRole('SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = decidirSchema.parse(req.body);

  const vinculo = await prisma.vinculo.findFirst({
    where: { id: req.params.id, condominioId: req.user!.condominioId },
    select: {
      id: true,
      usuarioId: true,
      unidade: true,
      status: true,
      tipoSolicitado: true,
      usuario: { select: { condominioId: true } },
      condominio: { select: { nome: true } },
    },
  });

  if (!vinculo) {
    throw new AppError(404, 'Pedido não encontrado', 'VINCULO_NOT_FOUND');
  }

  if (vinculo.status !== 'PENDENTE') {
    throw new AppError(409, 'Este pedido já foi analisado', 'VINCULO_JA_DECIDIDO');
  }

  // Sem perfil informado, vale o que a pessoa pediu
  const tipo = data.aprovar ? data.tipo ?? vinculo.tipoSolicitado : null;

  const atualizado = await prisma.$transaction(async (tx) => {
    const v = await tx.vinculo.update({
      where: { id: vinculo.id },
      data: {
        status: data.aprovar ? 'APROVADO' : 'RECUSADO',
        tipo,
        decididoPor: req.user!.id,
        decididoEm: new Date(),
      },
      select: { id: true, status: true, tipo: true, unidade: true },
    });

    await tx.logAuditoria.create({
      data: {
        sindicoId: req.user!.id,
        acao: data.aprovar ? 'APROVAR_VINCULO' : 'RECUSAR_VINCULO',
        entidadeId: vinculo.id,
        justificativa: data.justificativa || (data.aprovar ? `Aprovado como ${PERFIL_TEXTO[tipo!]}` : null),
      },
    });

    return v;
  });

  // O aviso vai para o condomínio de origem, onde a pessoa está enquanto espera
  await notificar(prisma, [
    {
      condominioId: vinculo.usuario.condominioId,
      usuarioId: vinculo.usuarioId,
      tipo: data.aprovar ? 'VINCULO_APROVADO' : 'VINCULO_RECUSADO',
      mensagem: data.aprovar
        ? `Seu pedido para o ${vinculo.condominio.nome} foi aprovado. Você participa como ${PERFIL_TEXTO[tipo!]}; troque de condomínio no topo da tela inicial.`
        : `Seu pedido para o ${vinculo.condominio.nome} foi recusado. Motivo: ${data.justificativa}`,
      entidadeTipo: 'VINCULO',
      entidadeId: vinculo.id,
    },
  ]);

  res.json({ message: data.aprovar ? 'Participação aprovada' : 'Pedido recusado', vinculo: atualizado });
}));

export { router as vinculoRoutes };
