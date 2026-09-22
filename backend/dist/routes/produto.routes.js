"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.produtoRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.produtoRoutes = router;
const prisma = new client_1.PrismaClient();
const createProdutoSchema = zod_1.z.object({
    nome: zod_1.z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    descricao: zod_1.z.string().optional(),
    preco: zod_1.z.number().positive('Preço deve ser positivo'),
    categoria: zod_1.z.string().min(1, 'Categoria é obrigatória'),
});
const updateProdutoSchema = createProdutoSchema.partial();
const querySchema = zod_1.z.object({
    pagina: zod_1.z.coerce.number().int().positive().default(1),
    limite: zod_1.z.coerce.number().int().positive().max(50).default(20),
    categoria: zod_1.z.string().optional(),
    status: zod_1.z.enum(['ATIVO', 'PAUSADO', 'QUARENTENA', 'EXCLUIDO']).optional(),
    vendedorId: zod_1.z.string().uuid().optional(),
    busca: zod_1.z.string().optional(),
});
// POST /api/produtos - Criar produto (apenas vendedor)
router.post('/', auth_1.authMiddleware, (0, auth_1.requireRole)('VENDEDOR', 'SINDICO'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = createProdutoSchema.parse(req.body);
    // RN01: Verificar limite de 15 produtos ATIVOS por vendedor
    const ativosCount = await prisma.produto.count({
        where: {
            condominioId: req.user.condominioId,
            vendedorId: req.user.id,
            status: 'ATIVO',
        },
    });
    if (ativosCount >= 15) {
        throw new errorHandler_1.AppError(400, 'Limite de 15 produtos ativos atingido. Pause ou exclua um produto antes de criar outro.', 'LIMIT_EXCEEDED');
    }
    const produto = await prisma.produto.create({
        data: {
            condominioId: req.user.condominioId,
            vendedorId: req.user.id,
            nome: data.nome,
            descricao: data.descricao,
            preco: data.preco,
            categoria: data.categoria,
            status: 'ATIVO',
        },
        include: {
            vendedor: {
                select: { id: true, nome: true, unidade: true },
            },
        },
    });
    res.status(201).json({ produto });
}));
// GET /api/produtos - Listar produtos (com filtros e paginação)
router.get('/', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const query = querySchema.parse(req.query);
    const { pagina, limite, categoria, status, vendedorId, busca } = query;
    const where = {
        condominioId: req.user.condominioId,
    };
    // Usuários não-síndicos não veem produtos em quarentena/excluído
    if (req.user.tipo !== 'SINDICO') {
        where.status = { in: ['ATIVO', 'PAUSADO'] };
    }
    else if (status) {
        where.status = status;
    }
    if (categoria)
        where.categoria = categoria;
    if (vendedorId)
        where.vendedorId = vendedorId;
    if (busca) {
        where.OR = [
            { nome: { contains: busca, mode: 'insensitive' } },
            { descricao: { contains: busca, mode: 'insensitive' } },
        ];
    }
    const [produtos, total] = await Promise.all([
        prisma.produto.findMany({
            where,
            include: {
                vendedor: {
                    select: { id: true, nome: true, unidade: true },
                },
            },
            orderBy: { criadoEm: 'desc' },
            skip: (pagina - 1) * limite,
            take: limite,
        }),
        prisma.produto.count({ where }),
    ]);
    res.json({
        produtos,
        paginacao: {
            pagina,
            limite,
            total,
            totalPaginas: Math.ceil(total / limite),
        },
    });
}));
// GET /api/produtos/meus - Meus produtos (vendedor)
router.get('/meus', auth_1.authMiddleware, (0, auth_1.requireRole)('VENDEDOR', 'SINDICO'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const query = querySchema.parse(req.query);
    const { pagina, limite, status } = query;
    const where = {
        condominioId: req.user.condominioId,
        vendedorId: req.user.id,
    };
    if (status)
        where.status = status;
    const [produtos, total] = await Promise.all([
        prisma.produto.findMany({
            where,
            orderBy: { criadoEm: 'desc' },
            skip: (pagina - 1) * limite,
            take: limite,
        }),
        prisma.produto.count({ where }),
    ]);
    res.json({
        produtos,
        paginacao: {
            pagina,
            limite,
            total,
            totalPaginas: Math.ceil(total / limite),
        },
    });
}));
// GET /api/produtos/:id - Buscar produto por ID
router.get('/:id', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const produto = await prisma.produto.findFirst({
        where: {
            id,
            condominioId: req.user.condominioId,
        },
        include: {
            vendedor: {
                select: { id: true, nome: true, unidade: true, email: true },
            },
        },
    });
    if (!produto) {
        throw new errorHandler_1.AppError(404, 'Produto não encontrado', 'PRODUTO_NOT_FOUND');
    }
    // Verifica se usuário pode ver produto em quarentena/excluído
    if (['QUARENTENA', 'EXCLUIDO'].includes(produto.status) && req.user.tipo !== 'SINDICO') {
        throw new errorHandler_1.AppError(404, 'Produto não encontrado', 'PRODUTO_NOT_FOUND');
    }
    res.json({ produto });
}));
// PUT /api/produtos/:id - Atualizar produto (apenas vendedor dono ou síndico)
router.put('/:id', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const data = updateProdutoSchema.parse(req.body);
    const produto = await prisma.produto.findFirst({
        where: { id, condominioId: req.user.condominioId },
    });
    if (!produto) {
        throw new errorHandler_1.AppError(404, 'Produto não encontrado', 'PRODUTO_NOT_FOUND');
    }
    // Verifica permissão
    if (produto.vendedorId !== req.user.id && req.user.tipo !== 'SINDICO') {
        throw new errorHandler_1.AppError(403, 'Não autorizado a editar este produto', 'FORBIDDEN');
    }
    const updated = await prisma.produto.update({
        where: { id },
        data,
        include: {
            vendedor: {
                select: { id: true, nome: true, unidade: true },
            },
        },
    });
    res.json({ produto: updated });
}));
// PATCH /api/produtos/:id/status - Alterar status (vendedor dono ou síndico)
router.patch('/:id/status', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status } = zod_1.z.object({
        status: zod_1.z.enum(['ATIVO', 'PAUSADO', 'QUARENTENA', 'EXCLUIDO']),
    }).parse(req.body);
    const produto = await prisma.produto.findFirst({
        where: { id, condominioId: req.user.condominioId },
    });
    if (!produto) {
        throw new errorHandler_1.AppError(404, 'Produto não encontrado', 'PRODUTO_NOT_FOUND');
    }
    // Apenas síndico pode colocar em quarentena/excluído
    if (['QUARENTENA', 'EXCLUIDO'].includes(status) && req.user.tipo !== 'SINDICO') {
        throw new errorHandler_1.AppError(403, 'Apenas síndico pode alterar para este status', 'FORBIDDEN');
    }
    // Verifica permissão
    if (produto.vendedorId !== req.user.id && req.user.tipo !== 'SINDICO') {
        throw new errorHandler_1.AppError(403, 'Não autorizado a alterar este produto', 'FORBIDDEN');
    }
    // RN01: Se ativando, verificar limite de 15 produtos ATIVOS
    if (status === 'ATIVO' && produto.status !== 'ATIVO') {
        const ativosCount = await prisma.produto.count({
            where: {
                condominioId: req.user.condominioId,
                vendedorId: req.user.id,
                status: 'ATIVO',
            },
        });
        if (ativosCount >= 15) {
            throw new errorHandler_1.AppError(400, 'Limite de 15 produtos ativos atingido. Pause ou exclua um produto antes de ativar outro.', 'LIMIT_EXCEEDED');
        }
    }
    const updated = await prisma.produto.update({
        where: { id },
        data: { status },
    });
    res.json({ produto: updated });
}));
// DELETE /api/produtos/:id - Excluir produto (apenas vendedor dono ou síndico)
router.delete('/:id', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const produto = await prisma.produto.findFirst({
        where: { id, condominioId: req.user.condominioId },
    });
    if (!produto) {
        throw new errorHandler_1.AppError(404, 'Produto não encontrado', 'PRODUTO_NOT_FOUND');
    }
    if (produto.vendedorId !== req.user.id && req.user.tipo !== 'SINDICO') {
        throw new errorHandler_1.AppError(403, 'Não autorizado a excluir este produto', 'FORBIDDEN');
    }
    await prisma.produto.update({
        where: { id },
        data: { status: 'EXCLUIDO' },
    });
    res.json({ message: 'Produto excluído com sucesso' });
}));
//# sourceMappingURL=produto.routes.js.map