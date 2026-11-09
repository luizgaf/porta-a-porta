import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';
import { notificar } from '../services/notificacoes';

const router = Router();
const prisma = new PrismaClient();

const createAvaliacaoSchema = z.object({
  pedidoId: z.string().min(1, 'ID do pedido inválido'),
  // Produto do pedido que está sendo avaliado; pode faltar quando o pedido tem um produto só
  produtoId: z.string().min(1).optional(),
  nota: z.number().int().min(1, 'Nota deve ser entre 1 e 5').max(5, 'Nota deve ser entre 1 e 5'),
  comentario: z.string().trim().max(500).optional(),
});

const removerAvaliacaoSchema = z.object({
  justificativa: z.string().trim().min(5, 'Informe a justificativa da remoção (mínimo 5 caracteres)').max(500),
});

// RN02: a identidade de quem avalia não é exibida a outros moradores nem ao vendedor; as respostas
// trazem só a nota, o comentário, a data e o produto avaliado. Nem o pedido é informado, porque o
// vendedor conseguiria ligá-lo ao comprador. Só o síndico recebe o pedidoId, para a moderação.
const avaliacaoSemIdentificacao = {
  id: true,
  nota: true,
  comentario: true,
  criadoEm: true,
} as const;

const produtoAvaliado = { select: { id: true, nome: true, vendedorId: true } } as const;

const querySchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(50).default(20),
  vendedorId: z.string().min(1).optional(),
});

// POST /api/avaliacoes - Avaliar um produto de um pedido entregue (apenas o comprador do pedido)
router.post('/', authMiddleware, requireRole('COMPRADOR'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createAvaliacaoSchema.parse(req.body);

  // Verifica se pedido existe, pertence ao condomínio e está entregue
  const pedido = await prisma.pedido.findFirst({
    where: {
      id: data.pedidoId,
      condominioId: req.user!.condominioId,
      status: 'ENTREGUE',
    },
    include: { itens: { select: { produtoId: true, produto: { select: { nome: true, vendedorId: true } } } } },
  });

  if (!pedido) {
    throw new AppError(404, 'Pedido não encontrado ou não elegível para avaliação', 'PEDIDO_NOT_ELIGIBLE');
  }

  // Verifica se o usuário é o comprador do pedido
  if (pedido.compradorId !== req.user!.id) {
    throw new AppError(403, 'Apenas o comprador pode avaliar este pedido', 'FORBIDDEN');
  }

  // Cada produto do pedido recebe a sua avaliação
  const produtosDoPedido = [...new Set((pedido.itens ?? []).map((i) => i.produtoId))];
  const produtoId = data.produtoId ?? (produtosDoPedido.length === 1 ? produtosDoPedido[0] : undefined);
  if (!produtoId) {
    throw new AppError(400, 'Informe qual produto do pedido está sendo avaliado', 'PRODUTO_OBRIGATORIO');
  }
  const item = (pedido.itens ?? []).find((i) => i.produtoId === produtoId);
  if (!item) {
    throw new AppError(400, 'Este produto não faz parte do pedido', 'PRODUTO_FORA_DO_PEDIDO');
  }

  const existing = await prisma.avaliacao.findUnique({
    where: { pedidoId_produtoId: { pedidoId: data.pedidoId, produtoId } },
  });

  if (existing) {
    throw new AppError(409, 'Este produto já foi avaliado neste pedido', 'ALREADY_RATED');
  }

  const avaliacao = await prisma.avaliacao.create({
    data: {
      pedidoId: data.pedidoId,
      produtoId,
      compradorId: req.user!.id,
      nota: data.nota,
      comentario: data.comentario || undefined,
    },
    select: { ...avaliacaoSemIdentificacao, pedidoId: true, produto: produtoAvaliado },
  });

  // Aviso ao vendedor, sem dizer quem avaliou (RN02)
  if (item.produto?.vendedorId) {
    await notificar(prisma, [{
      condominioId: req.user!.condominioId,
      usuarioId: item.produto.vendedorId,
      tipo: 'NOVA_AVALIACAO',
      mensagem: `"${item.produto.nome}" recebeu uma avaliação de ${data.nota} ${data.nota === 1 ? 'estrela' : 'estrelas'}.`,
      entidadeTipo: 'PRODUTO',
      entidadeId: produtoId,
    }]);
  }

  res.status(201).json({ avaliacao });
}));

// GET /api/avaliacoes - Listar avaliações (vendedor vê as dos seus produtos; síndico, as do condomínio)
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = querySchema.parse(req.query);
  const { pagina, limite, vendedorId } = query;

  const ehSindico = req.user!.tipo === 'SINDICO';
  let where: Record<string, unknown>;

  if (ehSindico) {
    where = vendedorId
      ? { produto: { vendedorId, condominioId: req.user!.condominioId } }
      : { pedido: { condominioId: req.user!.condominioId } };
  } else if (req.user!.tipo === 'VENDEDOR') {
    // Vendedor vê as avaliações dos seus produtos, exceto as removidas pelo síndico
    where = {
      removidaPor: null,
      produto: { vendedorId: req.user!.id, condominioId: req.user!.condominioId },
    };
  } else {
    throw new AppError(403, 'Acesso negado', 'FORBIDDEN');
  }

  const [avaliacoes, total] = await Promise.all([
    prisma.avaliacao.findMany({
      where,
      select: {
        ...avaliacaoSemIdentificacao,
        // O síndico vê se a avaliação já foi removida, para a fila de moderação
        ...(ehSindico ? { pedidoId: true, removidaPor: true } : {}),
        produto: produtoAvaliado,
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

// GET /api/avaliacoes/produto/:produtoId - Avaliações de um produto, com média e distribuição das notas.
// Qualquer usuário do condomínio vê; quem avaliou nunca é identificado (RN02).
router.get('/produto/:produtoId', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { produtoId } = req.params;

  const avaliacoes = await prisma.avaliacao.findMany({
    where: {
      produtoId,
      produto: { condominioId: req.user!.condominioId },
      removidaPor: null,
    },
    select: avaliacaoSemIdentificacao,
    orderBy: { criadoEm: 'desc' },
  });

  const total = avaliacoes.length;
  const media = total > 0 ? avaliacoes.reduce((soma: number, a: { nota: number }) => soma + a.nota, 0) / total : 0;
  // Quantas avaliações tem cada nota, de 5 a 1 estrelas
  const distribuicao = [5, 4, 3, 2, 1].map((nota) => ({
    nota,
    total: avaliacoes.filter((a: { nota: number }) => a.nota === nota).length,
  }));

  res.json({
    media: Number(media.toFixed(1)),
    total,
    distribuicao,
    avaliacoes,
  });
}));

// PUT /api/avaliacoes/:id - Edição não permitida
// RN02: avaliações são definitivas; depois do envio, apenas o síndico pode removê-las (DELETE).
router.put('/:id', authMiddleware, asyncHandler(async (_req: AuthRequest, _res: Response) => {
  throw new AppError(403, 'Avaliações são definitivas e não podem ser editadas após o envio', 'AVALIACAO_IMUTAVEL');
}));

// DELETE /api/avaliacoes/:id - Remover avaliação (síndico), com justificativa registrada em auditoria (RN02)
router.delete('/:id', authMiddleware, requireRole('SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { justificativa } = removerAvaliacaoSchema.parse(req.body ?? {});

  // Só encontra avaliações de pedidos do condomínio do síndico
  const avaliacao = await prisma.avaliacao.findFirst({
    where: { id, pedido: { condominioId: req.user!.condominioId } },
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