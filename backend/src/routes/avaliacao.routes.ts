import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const createAvaliacaoSchema = z.object({
  pedidoId: z.string().min(1, 'ID do pedido inválido'),
  nota: z.number().int().min(1).max(5, 'Nota deve ser entre 1 e 5'),
  comentario: z.string().max(500).optional(),
});

const removerAvaliacaoSchema = z.object({
  justificativa: z.string().trim().min(5, 'Informe a justificativa da remoção (mínimo 5 caracteres)').max(500),
});

// RN02: a identidade de quem avalia não é exibida a outros moradores nem ao vendedor; as respostas
// trazem só a nota, o comentário e os produtos avaliados. Nem o pedido é informado, porque o vendedor
// conseguiria ligá-lo ao comprador. Só o síndico recebe o pedidoId, necessário para a moderação.
const avaliacaoSemIdentificacao = {
  id: true,
  nota: true,
  comentario: true,
  criadoEm: true,
} as const;

const produtosDoPedido = {
  select: {
    itens: { select: { produto: { select: { id: true, nome: true, vendedorId: true } } } },
  },
} as const;

const querySchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(50).default(20),
  vendedorId: z.string().min(1).optional(),
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
    select: { ...avaliacaoSemIdentificacao, pedidoId: true, pedido: produtosDoPedido },
  });

  res.status(201).json({ avaliacao });
}));

// GET /api/avaliacoes - Listar avaliações (síndico ou vendedor vê as suas)
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = querySchema.parse(req.query);
  const { pagina, limite, vendedorId } = query;

  const where: Record<string, unknown> = {};

  if (req.user!.tipo === 'VENDEDOR') {
    // Vendedor vê as avaliações dos seus produtos, exceto as removidas pelo síndico
    where.removidaPor = null;
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
      select: {
        ...avaliacaoSemIdentificacao,
        // O síndico vê se a avaliação já foi removida, para a fila de moderação
        ...(req.user!.tipo === 'SINDICO' ? { pedidoId: true, removidaPor: true } : {}),
        pedido: produtosDoPedido,
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
    select: avaliacaoSemIdentificacao,
    orderBy: { criadoEm: 'desc' },
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

// DELETE /api/avaliacoes/:pedidoId - Remover avaliação (síndico), com justificativa registrada em auditoria (RN02)
router.delete('/:pedidoId', authMiddleware, requireRole('SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { pedidoId } = req.params;
  const { justificativa } = removerAvaliacaoSchema.parse(req.body ?? {});

  // Só encontra avaliações de pedidos do condomínio do síndico
  const avaliacao = await prisma.avaliacao.findFirst({
    where: { pedidoId, pedido: { condominioId: req.user!.condominioId } },
  });

  if (!avaliacao) {
    throw new AppError(404, 'Avaliação não encontrada', 'AVALIACAO_NOT_FOUND');
  }

  if (avaliacao.removidaPor) {
    throw new AppError(409, 'Esta avaliação já foi removida', 'AVALIACAO_JA_REMOVIDA');
  }

  // A remoção e o registro de auditoria são gravados juntos
  await prisma.$transaction([
    prisma.avaliacao.update({
      where: { id: avaliacao.id },
      data: { removidaPor: req.user!.id },
    }),
    prisma.logAuditoria.create({
      data: {
        sindicoId: req.user!.id,
        acao: 'REMOVER_AVALIACAO',
        entidadeId: avaliacao.id,
        justificativa,
      },
    }),
  ]);

  res.json({ message: 'Avaliação removida com sucesso' });
}));

export { router as avaliacaoRoutes };