import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const createAvaliacaoSchema = z.object({
  pedidoId: z.string().uuid('ID do pedido inválido'),
  nota: z.number().int().min(1).max(5, 'Nota deve ser entre 1 e 5'),
  comentario: z.string().max(500).optional(),
});

const querySchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(50).default(20),
  vendedorId: z.string().uuid().optional(),
});

// POST /api/avaliacoes - Criar avaliação (apenas comprador do pedido)
router.post('/', authMiddleware, requireRole('COMPRADOR', 'SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createAvaliacaoSchema.parse(req.body);

  // Verifica se pedido existe, pertence ao condomínio e está entregue
  const pedido = await prisma.pedido.findFirst({
    where: {
      id: data.pedidoId,
      condominioId: req.user!.condominioId,
      status: 'ENTREGUE',
    },
  });

  if (!pedido) {
    throw new AppError(404, 'Pedido não encontrado ou não elegível para avaliação', 'PEDIDO_NOT_ELIGIBLE');
  }

  // Verifica se o usuário é o comprador do pedido
  if (pedido.compradorId !== req.user!.id && req.user!.tipo !== 'SINDICO') {
    throw new AppError(403, 'Apenas o comprador pode avaliar este pedido', 'FORBIDDEN');
  }

  // Verifica se já existe avaliação
  const existing = await prisma.avaliacao.findUnique({
    where: { pedidoId: data.pedidoId },
  });

  if (existing) {
    throw new AppError(409, 'Este pedido já foi avaliado', 'ALREADY_RATED');
  }

  const avaliacao = await prisma.avaliacao.create({
    data: {
      pedidoId: data.pedidoId,
      compradorId: req.user!.id,
      nota: data.nota,
      comentario: data.comentario,
    },
    include: {
      pedido: {
        select: { id: true, itens: { include: { produto: { select: { vendedorId: true } } } } },
      },
      comprador: {
        select: { id: true, nome: true, unidade: true },
      },
    },
  });

  res.status(201).json({ avaliacao });
}));

// GET /api/avaliacoes - Listar avaliações (síndico ou vendedor vê as suas)
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = querySchema.parse(req.query);
  const { pagina, limite, vendedorId } = query;

  const where: Record<string, unknown> = {};

  if (req.user!.tipo === 'VENDEDOR') {
    // Vendedor vê avaliações dos seus produtos
    where.pedido = {
      itens: {
        some: {
          produto: {
            vendedorId: req.user!.id,
            condominioId: req.user!.condominioId,
          },
        },
      },
    };
  } else if (req.user!.tipo === 'SINDICO') {
    if (vendedorId) {
      where.pedido = {
        itens: {
          some: {
            produto: {
              vendedorId,
              condominioId: req.user!.condominioId,
            },
          },
        },
      };
    } else {
      where.pedido = {
        condominioId: req.user!.condominioId,
      };
    }
  } else {
    throw new AppError(403, 'Acesso negado', 'FORBIDDEN');
  }

  const [avaliacoes, total] = await Promise.all([
    prisma.avaliacao.findMany({
      where,
      include: {
        pedido: {
          select: {
            id: true,
            itens: {
              include: {
                produto: {
                  select: { id: true, nome: true, vendedorId: true },
                },
              },
            },
          },
        },
        comprador: {
          select: { id: true, nome: true, unidade: true },
        },
      },
      orderBy: { criadoEm: 'desc' },
      skip: (pagina - 1) * limite,
      take: limite,
    }),
    prisma.avaliacao.count({ where }),
  ]);

  res.json({
    avaliacoes,
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas: Math.ceil(total / limite),
    },
  });
}));

// GET /api/avaliacoes/produto/:produtoId - Média de avaliações de um produto
router.get('/produto/:produtoId', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { produtoId } = req.params;

  const avaliacoes = await prisma.avaliacao.findMany({
    where: {
      pedido: {
        itens: {
          some: {
            produtoId,
            produto: {
              condominioId: req.user!.condominioId,
            },
          },
        },
      },
      removidaPor: null,
    },
    include: {
      comprador: {
        select: { id: true, nome: true, unidade: true },
      },
    },
  });

  const media = avaliacoes.length > 0
    ? avaliacoes.reduce((sum: number, a: { nota: number }) => sum + a.nota, 0) / avaliacoes.length
    : 0;

  res.json({
    media: Number(media.toFixed(1)),
    total: avaliacoes.length,
    avaliacoes,
  });
}));

// PUT /api/avaliacoes/:pedidoId - Edição não permitida
// RN02: avaliações são definitivas; depois do envio, apenas o síndico pode removê-las (DELETE).
router.put('/:pedidoId', authMiddleware, asyncHandler(async (_req: AuthRequest, _res: Response) => {
  throw new AppError(403, 'Avaliações são definitivas e não podem ser editadas após o envio', 'AVALIACAO_IMUTAVEL');
}));

// DELETE /api/avaliacoes/:pedidoId - Remover avaliação (síndico)
router.delete('/:pedidoId', authMiddleware, requireRole('SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { pedidoId } = req.params;

  await prisma.avaliacao.update({
    where: { pedidoId },
    data: { removidaPor: req.user!.id },
  });

  res.json({ message: 'Avaliação removida com sucesso' });
}));

export { router as avaliacaoRoutes };