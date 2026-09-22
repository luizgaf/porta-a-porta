import { Router, Request, Response } from 'express';
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
});

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
  const { pagina, limite, entidadeId, acao } = query;

  const where: Record<string, unknown> = {
    sindico: {
      condominioId: req.user!.condominioId,
    },
  };

  if (entidadeId) where.entidadeId = entidadeId;
  if (acao) where.acao = { contains: acao, mode: 'insensitive' };

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

  res.json({
    logs,
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas: Math.ceil(total / limite),
    },
  });
}));

export { router as auditoriaRoutes };