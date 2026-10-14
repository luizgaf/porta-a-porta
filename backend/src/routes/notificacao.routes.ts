import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const querySchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(50).default(20),
  apenasNaoLidas: z.enum(['true', 'false']).optional(),
});

// GET /api/notificacoes - Avisos do usuário logado, mais recentes primeiro
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { pagina, limite, apenasNaoLidas } = querySchema.parse(req.query);

  // Cada usuário só vê os próprios avisos, dentro do próprio condomínio
  const doUsuario = { usuarioId: req.user!.id, condominioId: req.user!.condominioId };
  const where = apenasNaoLidas === 'true' ? { ...doUsuario, lida: false } : doUsuario;

  const [notificacoes, total, naoLidas] = await Promise.all([
    prisma.notificacao.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      skip: (pagina - 1) * limite,
      take: limite,
    }),
    prisma.notificacao.count({ where }),
    prisma.notificacao.count({ where: { ...doUsuario, lida: false } }),
  ]);

  res.json({
    notificacoes,
    naoLidas,
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas: Math.ceil(total / limite),
    },
  });
}));

// PATCH /api/notificacoes/lidas - Marca todos os avisos do usuário como lidos
router.patch('/lidas', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { count } = await prisma.notificacao.updateMany({
    where: { usuarioId: req.user!.id, condominioId: req.user!.condominioId, lida: false },
    data: { lida: true },
  });

  res.json({ atualizadas: count });
}));

// PATCH /api/notificacoes/:id/lida - Marca um aviso como lido
router.patch('/:id/lida', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  // O filtro por usuário impede marcar avisos de outra pessoa
  const { count } = await prisma.notificacao.updateMany({
    where: { id: req.params.id, usuarioId: req.user!.id },
    data: { lida: true },
  });

  if (count === 0) {
    throw new AppError(404, 'Notificação não encontrada', 'NOTIFICACAO_NOT_FOUND');
  }

  res.json({ message: 'Notificação marcada como lida' });
}));

export { router as notificacaoRoutes };
