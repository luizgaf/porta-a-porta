import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const querySchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(50).default(20),
  entidadeId: z.string().optional(),
  acao: z.string().optional(),
  // A cada consulta de denúncias o sistema grava VISUALIZAR_DENUNCIAS; o histórico do app esconde essas
  ocultarConsultas: z.enum(['true', 'false']).optional(),
});

// Nome legível do que cada registro afetou (anúncio, usuário ou avaliação), para o histórico do app
const nomesDasEntidades = async (ids: string[]) => {
  const nomes = new Map<string, string>();
  if (ids.length === 0) return nomes;
  const [produtos, usuarios, avaliacoes, vinculos] = await Promise.all([
    prisma.produto.findMany({ where: { id: { in: ids } }, select: { id: true, nome: true } }),
    prisma.usuario.findMany({ where: { id: { in: ids } }, select: { id: true, nome: true } }),
    prisma.avaliacao.findMany({ where: { id: { in: ids } }, select: { id: true, nota: true, produto: { select: { nome: true } } } }),
    prisma.vinculo.findMany({ where: { id: { in: ids } }, select: { id: true, usuario: { select: { nome: true } } } }),
  ]);
  for (const p of produtos ?? []) nomes.set(p.id, p.nome);
  for (const u of usuarios ?? []) nomes.set(u.id, u.nome);
  for (const a of avaliacoes ?? []) nomes.set(a.id, `${a.nota} ${a.nota === 1 ? 'estrela' : 'estrelas'} em "${a.produto?.nome ?? 'produto'}"`);
  for (const v of vinculos ?? []) nomes.set(v.id, v.usuario?.nome ?? 'Pedido de participação');
  return nomes;
};

// POST /api/auditoria - Registrar ação de auditoria (apenas síndico)
router.post('/', authMiddleware, requireRole('SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = z.object({
    acao: z.string().min(1, 'Ação é obrigatória'),
    entidadeId: z.string().min(1, 'ID da entidade é obrigatório'),
    justificativa: z.string().optional(),
  }).parse(req.body);

  const log = await prisma.logAuditoria.create({
    data: {
      sindicoId: req.user!.id,
      acao: data.acao,
      entidadeId: data.entidadeId,
      justificativa: data.justificativa,
    },
    include: {
      sindico: {
        select: { id: true, nome: true, unidade: true },
      },
    },
  });

  res.status(201).json({ log });
}));

// GET /api/auditoria - Listar logs de auditoria (apenas síndico)
router.get('/', authMiddleware, requireRole('SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = querySchema.parse(req.query);
  const { pagina, limite, entidadeId, acao, ocultarConsultas } = query;

  const where: Record<string, unknown> = {
    sindico: {
      condominioId: req.user!.condominioId,
    },
  };

  if (entidadeId) where.entidadeId = entidadeId;
  if (acao) where.acao = { contains: acao, mode: 'insensitive' };
  if (ocultarConsultas === 'true' && !acao) where.acao = { not: 'VISUALIZAR_DENUNCIAS' };

  const [logs, total] = await Promise.all([
    prisma.logAuditoria.findMany({
      where,
      include: {
        sindico: {
          select: { id: true, nome: true, unidade: true },
        },
      },
      orderBy: { criadoEm: 'desc' },
      skip: (pagina - 1) * limite,
      take: limite,
    }),
    prisma.logAuditoria.count({ where }),
  ]);

  const nomes = await nomesDasEntidades([...new Set(logs.map((l) => l.entidadeId))]);

  res.json({
    logs: logs.map((l) => ({ ...l, entidadeNome: nomes.get(l.entidadeId) ?? null })),
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas: Math.ceil(total / limite),
    },
  });
}));

export { router as auditoriaRoutes };