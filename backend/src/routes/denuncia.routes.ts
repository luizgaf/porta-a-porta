import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const createDenunciaSchema = z.object({
  produtoId: z.string().uuid('ID do produto inválido'),
  motivo: z.string().min(10, 'Motivo deve ter pelo menos 10 caracteres').max(500),
});

const querySchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(50).default(20),
});

const updateDenunciaStatusSchema = z.object({
  acao: z.enum(['QUARENTENA', 'RESTAURAR']),
  justificativa: z.string().optional(),
});

// POST /api/denuncias - Criar denúncia
router.post('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createDenunciaSchema.parse(req.body);

  // Verifica se produto existe e pertence ao condomínio
  const produto = await prisma.produto.findFirst({
    where: {
      id: data.produtoId,
      condominioId: req.user!.condominioId,
    },
  });

  if (!produto) {
    throw new AppError(404, 'Produto não encontrado', 'PRODUTO_NOT_FOUND');
  }

  // Verifica se usuário não está denunciando próprio produto
  if (produto.vendedorId === req.user!.id) {
    throw new AppError(400, 'Não é possível denunciar seu próprio produto', 'SELF_REPORT');
  }

  // Tenta criar denúncia (constraint unique impede duplicatas)
  try {
    const denuncia = await prisma.denuncia.create({
      data: {
        produtoId: data.produtoId,
        denuncianteId: req.user!.id,
        motivo: data.motivo,
      },
      include: {
        produto: {
          select: { id: true, nome: true },
        },
        denunciante: {
          select: { id: true, nome: true, unidade: true },
        },
      },
    });

    // Se produto atingir 3 denúncias, colocar em quarentena
    const count = await prisma.denuncia.count({
      where: { produtoId: data.produtoId },
    });

    if (count >= 3) {
      await prisma.produto.update({
        where: { id: data.produtoId },
        data: { status: 'QUARENTENA' },
      });
    }

    res.status(201).json({ denuncia });
  } catch (error: unknown) {
    const prismaErr = error as { code?: string };
    if (prismaErr.code === 'P2002') {
      throw new AppError(409, 'Você já denunciou este produto', 'DUPLICATE_DENUNCIA');
    }
    throw error;
  }
}));

// GET /api/denuncias - Listar denúncias (apenas síndico)
router.get('/', authMiddleware, requireRole('SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = querySchema.parse(req.query);
  const { pagina, limite } = query;

  const [denuncias, total] = await Promise.all([
    prisma.denuncia.findMany({
      where: {
        produto: {
          condominioId: req.user!.condominioId,
        },
      },
      include: {
        produto: {
          select: { id: true, nome: true, vendedorId: true },
        },
        denunciante: {
          select: { id: true, nome: true, unidade: true },
        },
      },
      orderBy: { criadoEm: 'desc' },
      skip: (pagina - 1) * limite,
      take: limite,
    }),
    prisma.denuncia.count({
      where: {
        produto: {
          condominioId: req.user!.condominioId,
        },
      },
    }),
  ]);

  res.json({
    denuncias,
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas: Math.ceil(total / limite),
    },
  });
}));

// GET /api/denuncias/produto/:produtoId - Ver denúncias de um produto (síndico)
router.get('/produto/:produtoId', authMiddleware, requireRole('SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { produtoId } = req.params;

  const denuncias = await prisma.denuncia.findMany({
    where: {
      produtoId,
      produto: {
        condominioId: req.user!.condominioId,
      },
    },
    include: {
      denunciante: {
        select: { id: true, nome: true, unidade: true },
      },
    },
    orderBy: { criadoEm: 'desc' },
  });

  // LOG AUDITORIA: Síndico acessou identidades dos denunciantes
  await prisma.logAuditoria.create({
    data: {
      sindicoId: req.user!.id,
      acao: 'VISUALIZAR_DENUNCIANTES',
      entidadeId: produtoId,
      justificativa: 'Visualização de denunciantes para moderação',
    },
  });

  res.json({ denuncias });
}));

// PATCH /api/denuncias/:produtoId/quarentena - Síndico gerencia quarentena (aceitar/restaurar)
router.patch('/:produtoId/quarentena', authMiddleware, requireRole('SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { produtoId } = req.params;
  const { acao, justificativa } = updateDenunciaStatusSchema.parse(req.body);

  const produto = await prisma.produto.findFirst({
    where: { id: produtoId, condominioId: req.user!.condominioId },
  });

  if (!produto) {
    throw new AppError(404, 'Produto não encontrado', 'PRODUTO_NOT_FOUND');
  }

  let novoStatus: 'QUARENTENA' | 'ATIVO';
  let acaoLog: string;

  if (acao === 'QUARENTENA') {
    novoStatus = 'QUARENTENA';
    acaoLog = 'APLICAR_QUARENTENA';
  } else {
    novoStatus = 'ATIVO';
    acaoLog = 'RESTAURAR_PRODUTO';
  }

  // Atualiza status do produto
  const updated = await prisma.produto.update({
    where: { id: produtoId },
    data: { status: novoStatus },
  });

  // LOG AUDITORIA: Ação do síndico na quarentena
  await prisma.logAuditoria.create({
    data: {
      sindicoId: req.user!.id,
      acao: acaoLog,
      entidadeId: produtoId,
      justificativa: justificativa || `Produto movido para ${novoStatus} pelo síndico`,
    },
  });

  res.json({
    message: acao === 'QUARENTENA' ? 'Produto colocado em quarentena' : 'Produto restaurado',
    produto: updated
  });
}));

export { router as denunciaRoutes };