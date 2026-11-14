import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';
import { notificar, formatarValor, STATUS_PEDIDO_TEXTO, NovaNotificacao } from '../services/notificacoes';
import { unidadesNoCondominio } from '../services/unidades';

const router = Router();
const prisma = new PrismaClient();

// RN02: as avaliações do pedido (uma por produto) só aparecem para quem as escreveu; o vendedor
// vê o pedido sem elas, para não ligar a nota ao comprador
//
// Quem não é o comprador vê só os próprios itens e o total deles. Pedidos novos já têm um vendedor
// só, mas os gravados antes da separação por vendedor podem misturar produtos de vendedores
// diferentes, e um vendedor não deve ver o que o comprador levou de outro.
type PedidoComItens = {
  compradorId: string;
  valorTotal?: unknown;
  avaliacoes?: unknown[];
  itens?: { quantidade: number; precoUnitario?: unknown; produto?: { vendedorId?: string } | null }[];
};
const ocultarAvaliacaoDeTerceiros = <T extends PedidoComItens>(pedido: T, usuarioId: string): T => {
  if (pedido.compradorId === usuarioId) return pedido;
  const todos = pedido.itens ?? [];
  const meus = todos.filter((i) => i.produto?.vendedorId === usuarioId);
  if (meus.length === 0 || meus.length === todos.length) return { ...pedido, avaliacoes: [] };
  const valorTotal = meus.reduce((soma, i) => soma + Number(i.precoUnitario ?? 0) * i.quantidade, 0);
  return { ...pedido, itens: meus, valorTotal, avaliacoes: [] };
};

const avaliacoesDoPedido = {
  select: { id: true, produtoId: true, nota: true, comentario: true, criadoEm: true, removidaPor: true },
} as const;

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

  // Um carrinho com produtos de vendedores diferentes vira um pedido por vendedor. Cada vendedor
  // só vê e conduz o próprio pedido (status, itens e total), e o comprador acompanha cada um.
  const porVendedor = new Map<string, { produtoId: string; quantidade: number; precoUnitario: number }[]>();
  for (const item of data.itens) {
    const produto = produtos.find((p: typeof produtos[0]) => p.id === item.produtoId)!;
    const chave = (produto as { vendedorId?: string }).vendedorId ?? '';
    const itens = porVendedor.get(chave) ?? [];
    // Preço do banco, congelado no item (RN03); o que o app manda é ignorado
    itens.push({ produtoId: item.produtoId, quantidade: item.quantidade, precoUnitario: Number(produto.preco) });
    porVendedor.set(chave, itens);
  }

  const totalDe = (itens: { quantidade: number; precoUnitario: number }[]) =>
    itens.reduce((soma, item) => soma + item.precoUnitario * item.quantidade, 0);

  // Todos os pedidos são gravados juntos: ou o carrinho inteiro vira pedido, ou nada é gravado
  const criados = await prisma.$transaction(async (tx) => {
    const resultado: { id: string; vendedorId: string; valorTotal: number; quantidade: number }[] = [];
    for (const [vendedorId, itens] of porVendedor) {
      const valorTotal = totalDe(itens);
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
        data: itens.map((item) => ({ ...item, pedidoId: novoPedido.id })),
      });

      resultado.push({
        id: novoPedido.id,
        vendedorId,
        valorTotal,
        quantidade: itens.reduce((soma, item) => soma + item.quantidade, 0),
      });
    }
    return resultado;
  });

  // Aviso interno para o vendedor de cada pedido (HU04), com o total só dos itens dele
  await notificar(prisma, criados.filter((c) => c.vendedorId).map((c) => ({
    condominioId: req.user!.condominioId,
    usuarioId: c.vendedorId,
    tipo: 'NOVO_PEDIDO' as const,
    mensagem: `Novo pedido para entrega em ${data.unidadeEntrega}: ${c.quantidade} ${c.quantidade === 1 ? 'item' : 'itens'}, janela ${data.janelaHorario}. Total do pedido: ${formatarValor(c.valorTotal)}.`,
    entidadeTipo: 'PEDIDO' as const,
    entidadeId: c.id,
  })));

  const pedidos = await prisma.pedido.findMany({
    where: { id: { in: criados.map((c) => c.id) } },
    include: {
      itens: {
        include: {
          produto: {
            select: { id: true, nome: true, descricao: true, categoria: true, vendedorId: true },
          },
        },
      },
      comprador: {
        select: { id: true, nome: true, unidade: true },
      },
    },
  });

  // "pedido" continua para quem espera um só (o primeiro); "pedidos" traz todos, um por vendedor
  res.status(201).json({ pedido: pedidos?.[0] ?? null, pedidos: pedidos ?? [] });
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
              select: { id: true, nome: true, preco: true, vendedorId: true, imagemUrl: true },
            },
          },
        },
        comprador: {
          select: { id: true, nome: true, unidade: true },
        },
        avaliacoes: avaliacoesDoPedido,
      },
      orderBy: { criadoEm: 'desc' },
      skip: (pagina - 1) * limite,
      take: limite,
    }),
    prisma.pedido.count({ where }),
  ]);

  await unidadesNoCondominio(prisma, req.user!.condominioId, pedidos.map((p) => p.comprador));

  res.json({
    pedidos: pedidos.map((p: PedidoComItens) => ocultarAvaliacaoDeTerceiros(p, req.user!.id)),
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas: Math.ceil(total / limite),
    },
  });
}));

// GET /api/pedidos/dashboard - Resumo das vendas do vendedor no condomínio ativo.
// Um pedido pode ter produtos de mais de um vendedor, então os valores somam só os itens dele.
const EM_ANDAMENTO = ['PENDENTE', 'CONFIRMADO', 'EM_PREPARO', 'PRONTO_ENTREGA'];
const ORDEM_STATUS = [...EM_ANDAMENTO, 'ENTREGUE', 'CANCELADO'];

router.get('/dashboard', authMiddleware, requireRole('VENDEDOR'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const condominioId = req.user!.condominioId;
  const vendedorId = req.user!.id;

  const [itens, produtosAtivos] = await Promise.all([
    prisma.itemPedido.findMany({
      where: { produto: { vendedorId }, pedido: { condominioId } },
      select: {
        quantidade: true,
        precoUnitario: true,
        produto: { select: { id: true, nome: true } },
        pedido: { select: { id: true, status: true, criadoEm: true, unidadeEntrega: true, janelaHorario: true } },
      },
    }),
    prisma.produto.count({ where: { vendedorId, condominioId, status: 'ATIVO' } }),
  ]);

  type Resumo = { id: string; status: string; criadoEm: Date; unidadeEntrega: string; janelaHorario: string; valor: number; itens: number };
  const pedidos = new Map<string, Resumo>();
  const produtos = new Map<string, { produtoId: string; nome: string; quantidade: number; valor: number }>();

  for (const item of itens ?? []) {
    const subtotal = Number(item.precoUnitario) * item.quantidade;
    const p = item.pedido;
    const resumo = pedidos.get(p.id) ?? { ...p, valor: 0, itens: 0 };
    resumo.valor += subtotal;
    resumo.itens += item.quantidade;
    pedidos.set(p.id, resumo);

    if (p.status !== 'CANCELADO') {
      const prod = produtos.get(item.produto.id) ?? { produtoId: item.produto.id, nome: item.produto.nome, quantidade: 0, valor: 0 };
      prod.quantidade += item.quantidade;
      prod.valor += subtotal;
      produtos.set(item.produto.id, prod);
    }
  }

  const lista = [...pedidos.values()];
  const soma = (filtro: (p: Resumo) => boolean) => lista.filter(filtro).reduce((t, p) => t + p.valor, 0);
  const entregues = lista.filter((p) => p.status === 'ENTREGUE');
  const arred = (v: number) => Math.round(v * 100) / 100;

  // Vendas entregues nos últimos 6 meses, incluindo o atual
  const agora = new Date();
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - 5 + i, 1);
    return { mes: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, valor: 0, pedidos: 0 };
  });
  for (const p of entregues) {
    const d = new Date(p.criadoEm);
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const mes = meses.find((m) => m.mes === chave);
    if (mes) {
      mes.valor += p.valor;
      mes.pedidos += 1;
    }
  }

  res.json({
    totais: {
      vendido: arred(soma((p) => p.status === 'ENTREGUE')),
      emAndamento: arred(soma((p) => EM_ANDAMENTO.includes(p.status))),
      pedidos: lista.filter((p) => p.status !== 'CANCELADO').length,
      ticketMedio: entregues.length ? arred(soma((p) => p.status === 'ENTREGUE') / entregues.length) : 0,
      itensVendidos: entregues.reduce((t, p) => t + p.itens, 0),
      produtosAtivos,
      limiteProdutosAtivos: 15,
    },
    porStatus: ORDEM_STATUS.map((status) => ({ status, quantidade: lista.filter((p) => p.status === status).length })),
    maisVendidos: [...produtos.values()]
      .sort((a, b) => b.quantidade - a.quantidade || b.valor - a.valor)
      .slice(0, 5)
      .map((p) => ({ ...p, valor: arred(p.valor) })),
    ultimosMeses: meses.map((m) => ({ ...m, valor: arred(m.valor) })),
    ultimosPedidos: lista
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
      .slice(0, 5)
      .map((p) => ({ ...p, valor: arred(p.valor) })),
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
            select: { id: true, nome: true, descricao: true, preco: true, categoria: true, vendedorId: true, imagemUrl: true },
          },
        },
      },
      comprador: {
        select: { id: true, nome: true, unidade: true },
      },
      avaliacoes: avaliacoesDoPedido,
    },
  });

  if (!pedido) {
    throw new AppError(404, 'Pedido não encontrado', 'PEDIDO_NOT_FOUND');
  }

  await unidadesNoCondominio(prisma, req.user!.condominioId, [pedido.comprador]);

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