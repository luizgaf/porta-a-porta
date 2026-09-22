"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.avaliacaoRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.avaliacaoRoutes = router;
const prisma = new client_1.PrismaClient();
const createAvaliacaoSchema = zod_1.z.object({
    pedidoId: zod_1.z.string().uuid('ID do pedido inválido'),
    nota: zod_1.z.number().int().min(1).max(5, 'Nota deve ser entre 1 e 5'),
    comentario: zod_1.z.string().max(500).optional(),
});
const updateAvaliacaoSchema = zod_1.z.object({
    nota: zod_1.z.number().int().min(1).max(5).optional(),
    comentario: zod_1.z.string().max(500).optional(),
});
const querySchema = zod_1.z.object({
    pagina: zod_1.z.coerce.number().int().positive().default(1),
    limite: zod_1.z.coerce.number().int().positive().max(50).default(20),
    vendedorId: zod_1.z.string().uuid().optional(),
});
// POST /api/avaliacoes - Criar avaliação (apenas comprador do pedido)
router.post('/', auth_1.authMiddleware, (0, auth_1.requireRole)('COMPRADOR', 'SINDICO'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = createAvaliacaoSchema.parse(req.body);
    // Verifica se pedido existe, pertence ao condomínio e está entregue
    const pedido = await prisma.pedido.findFirst({
        where: {
            id: data.pedidoId,
            condominioId: req.user.condominioId,
            status: 'ENTREGUE',
        },
    });
    if (!pedido) {
        throw new errorHandler_1.AppError(404, 'Pedido não encontrado ou não elegível para avaliação', 'PEDIDO_NOT_ELIGIBLE');
    }
    // Verifica se o usuário é o comprador do pedido
    if (pedido.compradorId !== req.user.id && req.user.tipo !== 'SINDICO') {
        throw new errorHandler_1.AppError(403, 'Apenas o comprador pode avaliar este pedido', 'FORBIDDEN');
    }
    // Verifica se já existe avaliação
    const existing = await prisma.avaliacao.findUnique({
        where: { pedidoId: data.pedidoId },
    });
    if (existing) {
        throw new errorHandler_1.AppError(409, 'Este pedido já foi avaliado', 'ALREADY_RATED');
    }
    const avaliacao = await prisma.avaliacao.create({
        data: {
            pedidoId: data.pedidoId,
            compradorId: req.user.id,
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
router.get('/', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const query = querySchema.parse(req.query);
    const { pagina, limite, vendedorId } = query;
    const where = {};
    if (req.user.tipo === 'VENDEDOR') {
        // Vendedor vê avaliações dos seus produtos
        where.pedido = {
            itens: {
                some: {
                    produto: {
                        vendedorId: req.user.id,
                        condominioId: req.user.condominioId,
                    },
                },
            },
        };
    }
    else if (req.user.tipo === 'SINDICO') {
        if (vendedorId) {
            where.pedido = {
                itens: {
                    some: {
                        produto: {
                            vendedorId,
                            condominioId: req.user.condominioId,
                        },
                    },
                },
            };
        }
        else {
            where.pedido = {
                condominioId: req.user.condominioId,
            };
        }
    }
    else {
        throw new errorHandler_1.AppError(403, 'Acesso negado', 'FORBIDDEN');
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
router.get('/produto/:produtoId', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { produtoId } = req.params;
    const avaliacoes = await prisma.avaliacao.findMany({
        where: {
            pedido: {
                itens: {
                    some: {
                        produtoId,
                        produto: {
                            condominioId: req.user.condominioId,
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
        ? avaliacoes.reduce((sum, a) => sum + a.nota, 0) / avaliacoes.length
        : 0;
    res.json({
        media: Number(media.toFixed(1)),
        total: avaliacoes.length,
        avaliacoes,
    });
}));
// PUT /api/avaliacoes/:pedidoId - Atualizar avaliação (apenas comprador)
router.put('/:pedidoId', auth_1.authMiddleware, (0, auth_1.requireRole)('COMPRADOR', 'SINDICO'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { pedidoId } = req.params;
    const data = updateAvaliacaoSchema.parse(req.body);
    const avaliacao = await prisma.avaliacao.findUnique({
        where: { pedidoId },
        include: { pedido: true },
    });
    if (!avaliacao) {
        throw new errorHandler_1.AppError(404, 'Avaliação não encontrada', 'AVALIACAO_NOT_FOUND');
    }
    if (avaliacao.compradorId !== req.user.id && req.user.tipo !== 'SINDICO') {
        throw new errorHandler_1.AppError(403, 'Não autorizado', 'FORBIDDEN');
    }
    const updated = await prisma.avaliacao.update({
        where: { pedidoId },
        data,
        include: {
            comprador: { select: { id: true, nome: true, unidade: true } },
        },
    });
    res.json({ avaliacao: updated });
}));
// DELETE /api/avaliacoes/:pedidoId - Remover avaliação (síndico)
router.delete('/:pedidoId', auth_1.authMiddleware, (0, auth_1.requireRole)('SINDICO'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { pedidoId } = req.params;
    await prisma.avaliacao.update({
        where: { pedidoId },
        data: { removidaPor: req.user.id },
    });
    res.json({ message: 'Avaliação removida com sucesso' });
}));
//# sourceMappingURL=avaliacao.routes.js.map