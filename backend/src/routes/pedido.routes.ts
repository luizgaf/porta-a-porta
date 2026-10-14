import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';
import { notificar, formatarValor, STATUS_PEDIDO_TEXTO, NovaNotificacao } from '../services/notificacoes';

const router = Router();
const prisma = new PrismaClient();

// RN02: a avaliação só aparece para quem a escreveu; o vendedor vê o pedido sem ela,
// para não ligar a nota ao comprador
const ocultarAvaliacaoDeTerceiros = <T extends { compradorId: string; avaliacao?: unknown }>(pedido: T, usuarioId: string) =>
  pedido.compradorId === usuarioId ? pedido : { ...pedido, avaliacao: null };

const createPedidoSchema = z.object({
  itens: z.array(z.object({
    produtoId: z.string().min(1),
    quantidade: z.number().int().positive(),
  })).min(1, 'Pelo menos um item é obrigatório'),
  unidadeEntrega: z.string().min(1, 'Unidade de entrega é obrigatória'),
  tipoEntrega: z.enum(['PORTARIA', 'UNIDADE', 'COMBINAR']),
  janelaHorario: z.string().min(1, 'Janela de horário é obrigatória'),
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDENTE', 'CONFIRMADO', 'EM_PREPARO', 'PRONTO_ENTREGA', 'ENTREGUE', 'CANCELADO']),
});

const querySchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(50).default(20),
  status: z.enum(['PENDENTE', 'CONFIRMADO', 'EM_PREPARO', 'PRONTO_ENTREGA', 'ENTREGUE', 'CANCELADO']).optional(),
});

// POST /api/pedidos - Criar pedido (comprador)
router.post('/', authMiddleware, requireRole('COMPRADOR'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createPedidoSchema.parse(req.body);

  // Busca produtos e valida
  const produtoIds = data.itens.map(i => i.produtoId);
  const produtos = await prisma.produto.findMany({
    where: {
      id: { in: produtoIds },
      condominioId: req.user!.condominioId,
      status: 'ATIVO',
    },
  });

  if (produtos.length !== produtoIds.length) {
    throw new AppError(400, 'Um ou mais produtos não encontrados ou indisponíveis', 'PRODUTO_INVALIDO');
  }

  // Vendedor e síndico também compram, mas não os próprios produtos
  if (produtos.some((p: { vendedorId?: string }) => p.vendedorId === req.user!.id)) {
    throw new AppError(400, 'Você não pode comprar o seu próprio produto', 'PRODUTO_PROPRIO');
  }

  // Calcula valor total
  let valorTotal = 0;
  const itensPedido = data.itens.map((item) => {
    const produto = produtos.find((p: typeof produtos[0]) => p.id === item.produtoId)!;
    const precoUnitario = Number(produto.preco);
    valorTotal += precoUnitario * item.quantidade;
    return {
      produtoId: item.produtoId,
      quantidade: item.quantidade,
      precoUnitario,
    };
  });

  // Cria pedido com transação
  const pedido = await prisma.$transaction(async (tx) => {
    const novoPedido = await tx.pedido.create({
      data: {
        condominioId: req.user!.condominioId,
        compradorId: req.user!.id,
        unidadeEntrega: data.unidadeEntrega,
        tipoEntrega: data.tipoEntrega,
        janelaHorario: data.janelaHorario,
        valorTotal,
        status: 'PENDENTE',
      },
    });

    await tx.itemPedido.createMany({
      data: itensPedido.map((item) => ({
        ...item,
        pedidoId: novoPedido.id,
      })),
    });

    return novoPedido;
  });

  // Aviso interno para cada vendedor com item no pedido (HU04)
  const vendedores = [...new Set(produtos.map((p: { vendedorId?: string }) => p.vendedorId).filter(Boolean))] as string[];
  await notificar(prisma, vendedores.map((vendedorId) => {
    const itensDoVendedor = data.itens.filter((item) =>
      produtos.some((p: { id: string; vendedorId?: string }) => p.id === item.produtoId && p.vendedorId === vendedorId));
    const quantidade = itensDoVendedor.reduce((soma, item) => soma + item.quantidade, 0);
    return {
      condominioId: req.user!.condominioId,
      usuarioId: vendedorId,
      tipo: 'NOVO_PEDIDO' as const,
      mensagem: `Novo pedido para entrega em ${data.unidadeEntrega}: ${quantidade} ${quantidade === 1 ? 'item' : 'itens'}, janela ${data.janelaHorario}. Total do pedido: ${formatarValor(valorTotal)}.`,
      entidadeTipo: 'PEDIDO' as const,
      entidadeId: pedido.id,
    };
  }));

  const pedidoCompleto = await prisma.pedido.findUnique({
    where: { id: pedido.id },
    include: {
      itens: {
        include: {
          produto: {
            select: { id: true, nome: true, descricao: true, categoria: true },
          },
        },
      },
      comprador: {
        select: { id: true, nome: true, unidade: true },
      },
    },
  });

  res.status(201).json({ pedido: pedidoCompleto });
}));

// GET /api/pedidos - Pedidos em que o usuário é comprador ou vendedor de algum item.
// Vale para todos os perfis: o vendedor e o síndico também compram, e o síndico não vê pedidos de terceiros.
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = querySchema.parse(req.query);
  const { pagina, limite, status } = query;

  const where: Record<string, unknown> = {
    condominioId: req.user!.condominioId,
  };

  where.OR = [
    { compradorId: req.user!.id },
    { itens: { some: { produto: { vendedorId: req.user!.id } } } },
  ];

  if (status) where.status = status;

  const [pedidos, total] = await Promise.all([
    prisma.pedido.findMany({
      where,
      include: {
        itens: {
          include: {
            produto: {
              // vendedorId: o app separa as compras das vendas do usuário na mesma lista
              select: { id: true, nome: true, preco: true, vendedorId: true },
            },
          },
        },
        comprador: {
          select: { id: true, nome: true, unidade: true },
        },
        avaliacao: true,
      },
      orderBy: { criadoEm: 'desc' },
      skip: (pagina - 1) * limite,
      take: limite,
    }),
    prisma.pedido.count({ where }),
  ]);

  res.json({
    pedidos: pedidos.map((p: { compradorId: string; avaliacao?: unknown }) => ocultarAvaliacaoDeTerceiros(p, req.user!.id)),
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas: Math.ceil(total / limite),
    },
  });
}));

// GET /api/pedidos/:id - Buscar pedido por ID
router.get('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const pedido = await prisma.pedido.findFirst({
    where: {
      id,
      condominioId: req.user!.condominioId,
      // Filtro de permissão
      OR: [
        { compradorId: req.user!.id },
        { itens: { some: { produto: { vendedorId: req.user!.id } } } },
      ],
    },
    include: {
      itens: {
        include: {
          produto: {
            select: { id: true, nome: true, descricao: true, preco: true, categoria: true, vendedorId: true },
          },
        },
      },
      comprador: {
        select: { id: true, nome: true, unidade: true },
      },
      avaliacao: true,
    },
  });

  if (!pedido) {
    throw new AppError(404, 'Pedido não encontrado', 'PEDIDO_NOT_FOUND');
  }

  res.json({ pedido: ocultarAvaliacaoDeTerceiros(pedido, req.user!.id) });
}));

// PATCH /api/pedidos/:id/status - Atualizar status do pedido
router.patch('/:id/status', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = updateStatusSchema.parse(req.body);

  const pedido = await prisma.pedido.findFirst({
    where: { id, condominioId: req.user!.condominioId },
    include: {
      itens: {
        include: { produto: true },
      },
    },
  });

  if (!pedido) {
    throw new AppError(404, 'Pedido não encontrado', 'PEDIDO_NOT_FOUND');
  }

  // Permissão pela relação com o pedido, não pelo perfil: quem vende algum item conduz o pedido
  // e quem comprou só pode cancelar
  const ehVendedorDoPedido = pedido.itens.some((i: { produto: { vendedorId: string } }) => i.produto.vendedorId === req.user!.id);
  const ehCompradorDoPedido = pedido.compradorId === req.user!.id;
  const podeAtualizar = ehVendedorDoPedido || (ehCompradorDoPedido && status === 'CANCELADO');

  if (!podeAtualizar) {
    throw new AppError(403, 'Não autorizado a alterar este pedido', 'FORBIDDEN');
  }

  // Validações de transição
  const transicoesValidas: Record<string, string[]> = {
    PENDENTE: ['CONFIRMADO', 'CANCELADO'],
    CONFIRMADO: ['EM_PREPARO', 'CANCELADO'],
    EM_PREPARO: ['PRONTO_ENTREGA', 'CANCELADO'],
    PRONTO_ENTREGA: ['ENTREGUE', 'CANCELADO'],
    ENTREGUE: [],
    CANCELADO: [],
  };

  if (!transicoesValidas[pedido.status]?.includes(status)) {
    throw new AppError(400, `Transição inválida: ${pedido.status} -> ${status}`, 'INVALID_TRANSITION');
  }

  const updated = await prisma.pedido.update({
    where: { id },
    data: { status },
    include: {
      itens: {
        include: { produto: { select: { id: true, nome: true } } },
      },
      comprador: { select: { id: true, nome: true, unidade: true } },
    },
  });

  // Aviso interno para a outra parte do pedido (HU04)
  const avisos: NovaNotificacao[] = [];
  if (req.user!.id !== pedido.compradorId) {
    avisos.push({
      condominioId: pedido.condominioId,
      usuarioId: pedido.compradorId,
      tipo: 'STATUS_PEDIDO',
      mensagem: `Seu pedido agora está ${STATUS_PEDIDO_TEXTO[status]}.`,
      entidadeTipo: 'PEDIDO',
      entidadeId: pedido.id,
    });
  } else if (status === 'CANCELADO') {
    const vendedores = [...new Set(pedido.itens.map((i: { produto: { vendedorId: string } }) => i.produto.vendedorId))];
    for (const vendedorId of vendedores) {
      avisos.push({
        condominioId: pedido.condominioId,
        usuarioId: vendedorId,
        tipo: 'PEDIDO_CANCELADO',
        mensagem: `O pedido para entrega em ${pedido.unidadeEntrega} foi cancelado pelo comprador.`,
        entidadeTipo: 'PEDIDO',
        entidadeId: pedido.id,
      });
    }
  }
  await notificar(prisma, avisos);

  res.json({ pedido: updated });
}));

export { router as pedidoRoutes };