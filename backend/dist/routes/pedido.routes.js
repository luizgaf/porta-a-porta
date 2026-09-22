"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pedidoRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.pedidoRoutes = router;
const prisma = new client_1.PrismaClient();
const createPedidoSchema = zod_1.z.object({
    itens: zod_1.z.array(zod_1.z.object({
        produtoId: zod_1.z.string().uuid(),
        quantidade: zod_1.z.number().int().positive(),
    })).min(1, 'Pelo menos um item é obrigatório'),
    unidadeEntrega: zod_1.z.string().min(1, 'Unidade de entrega é obrigatória'),
    tipoEntrega: zod_1.z.enum(['PORTARIA', 'UNIDADE', 'COMBINAR']),
    janelaHorario: zod_1.z.string().min(1, 'Janela de horário é obrigatória'),
});
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['PENDENTE', 'CONFIRMADO', 'EM_PREPARO', 'PRONTO_ENTREGA', 'ENTREGUE', 'CANCELADO']),
});
const querySchema = zod_1.z.object({
    pagina: zod_1.z.coerce.number().int().positive().default(1),
    limite: zod_1.z.coerce.number().int().positive().max(50).default(20),
    status: zod_1.z.enum(['PENDENTE', 'CONFIRMADO', 'EM_PREPARO', 'PRONTO_ENTREGA', 'ENTREGUE', 'CANCELADO']).optional(),
});
// POST /api/pedidos - Criar pedido (comprador)
router.post('/', auth_1.authMiddleware, (0, auth_1.requireRole)('COMPRADOR', 'SINDICO'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = createPedidoSchema.parse(req.body);
    // Busca produtos e valida
    const produtoIds = data.itens.map(i => i.produtoId);
    const produtos = await prisma.produto.findMany({
        where: {
            id: { in: produtoIds },
            condominioId: req.user.condominioId,
            status: 'ATIVO',
        },
    });
    if (produtos.length !== produtoIds.length) {
        throw new errorHandler_1.AppError(400, 'Um ou mais produtos não encontrados ou indisponíveis', 'PRODUTO_INVALIDO');
    }
    // Calcula valor total
    let valorTotal = 0;
    const itensPedido = data.itens.map((item) => {
        const produto = produtos.find((p) => p.id === item.produtoId);
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
                condominioId: req.user.condominioId,
                compradorId: req.user.id,
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
                select: { id: true, nome: true, unidade: true, email: true },
            },
        },
    });
    res.status(201).json({ pedido: pedidoCompleto });
}));
// GET /api/pedidos - Listar pedidos (comprador vê os seus, vendedor vê pedidos dos seus produtos, síndico vê todos)
router.get('/', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const query = querySchema.parse(req.query);
    const { pagina, limite, status } = query;
    const where = {
        condominioId: req.user.condominioId,
    };
    if (req.user.tipo === 'COMPRADOR') {
        where.compradorId = req.user.id;
    }
    else if (req.user.tipo === 'VENDEDOR') {
        where.itens = {
            some: {
                produto: {
                    vendedorId: req.user.id,
                },
            },
        };
    }
    // SINDICO vê todos
    if (status)
        where.status = status;
    const [pedidos, total] = await Promise.all([
        prisma.pedido.findMany({
            where,
            include: {
                itens: {
                    include: {
                        produto: {
                            select: { id: true, nome: true, preco: true },
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
        pedidos,
        paginacao: {
            pagina,
            limite,
            total,
            totalPaginas: Math.ceil(total / limite),
        },
    });
}));
// GET /api/pedidos/:id - Buscar pedido por ID
router.get('/:id', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const pedido = await prisma.pedido.findFirst({
        where: {
            id,
            condominioId: req.user.condominioId,
            // Filtro de permissão
            OR: [
                { compradorId: req.user.id },
                { itens: { some: { produto: { vendedorId: req.user.id } } } },
                ...(req.user.tipo === 'SINDICO' ? [] : []),
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
                select: { id: true, nome: true, unidade: true, email: true },
            },
            avaliacao: true,
        },
    });
    if (!pedido) {
        throw new errorHandler_1.AppError(404, 'Pedido não encontrado', 'PEDIDO_NOT_FOUND');
    }
    res.json({ pedido });
}));
// PATCH /api/pedidos/:id/status - Atualizar status do pedido
router.patch('/:id/status', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status } = updateStatusSchema.parse(req.body);
    const pedido = await prisma.pedido.findFirst({
        where: { id, condominioId: req.user.condominioId },
        include: {
            itens: {
                include: { produto: true },
            },
        },
    });
    if (!pedido) {
        throw new errorHandler_1.AppError(404, 'Pedido não encontrado', 'PEDIDO_NOT_FOUND');
    }
    // Regras de transição de status
    const podeAtualizar = (req.user.tipo === 'VENDEDOR' && pedido.itens.some((i) => i.produto.vendedorId === req.user.id)) ||
        (req.user.tipo === 'COMPRADOR' && pedido.compradorId === req.user.id && ['CANCELADO'].includes(status)) ||
        req.user.tipo === 'SINDICO';
    if (!podeAtualizar) {
        throw new errorHandler_1.AppError(403, 'Não autorizado a alterar este pedido', 'FORBIDDEN');
    }
    // Validações de transição
    const transicoesValidas = {
        PENDENTE: ['CONFIRMADO', 'CANCELADO'],
        CONFIRMADO: ['EM_PREPARO', 'CANCELADO'],
        EM_PREPARO: ['PRONTO_ENTREGA', 'CANCELADO'],
        PRONTO_ENTREGA: ['ENTREGUE', 'CANCELADO'],
        ENTREGUE: [],
        CANCELADO: [],
    };
    if (!transicoesValidas[pedido.status]?.includes(status)) {
        throw new errorHandler_1.AppError(400, `Transição inválida: ${pedido.status} -> ${status}`, 'INVALID_TRANSITION');
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
    res.json({ pedido: updated });
}));
//# sourceMappingURL=pedido.routes.js.map