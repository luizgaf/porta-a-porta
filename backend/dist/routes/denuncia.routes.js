"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.denunciaRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.denunciaRoutes = router;
const prisma = new client_1.PrismaClient();
const createDenunciaSchema = zod_1.z.object({
    produtoId: zod_1.z.string().uuid('ID do produto inválido'),
    motivo: zod_1.z.string().min(10, 'Motivo deve ter pelo menos 10 caracteres').max(500),
});
const querySchema = zod_1.z.object({
    pagina: zod_1.z.coerce.number().int().positive().default(1),
    limite: zod_1.z.coerce.number().int().positive().max(50).default(20),
});
// POST /api/denuncias - Criar denúncia
router.post('/', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = createDenunciaSchema.parse(req.body);
    // Verifica se produto existe e pertence ao condomínio
    const produto = await prisma.produto.findFirst({
        where: {
            id: data.produtoId,
            condominioId: req.user.condominioId,
        },
    });
    if (!produto) {
        throw new errorHandler_1.AppError(404, 'Produto não encontrado', 'PRODUTO_NOT_FOUND');
    }
    // Verifica se usuário não está denunciando próprio produto
    if (produto.vendedorId === req.user.id) {
        throw new errorHandler_1.AppError(400, 'Não é possível denunciar seu próprio produto', 'SELF_REPORT');
    }
    // Tenta criar denúncia (constraint unique impede duplicatas)
    try {
        const denuncia = await prisma.denuncia.create({
            data: {
                produtoId: data.produtoId,
                denuncianteId: req.user.id,
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
    }
    catch (error) {
        const prismaErr = error;
        if (prismaErr.code === 'P2002') {
            throw new errorHandler_1.AppError(409, 'Você já denunciou este produto', 'DUPLICATE_DENUNCIA');
        }
        throw error;
    }
}));
// GET /api/denuncias - Listar denúncias (apenas síndico)
router.get('/', auth_1.authMiddleware, (0, auth_1.requireRole)('SINDICO'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const query = querySchema.parse(req.query);
    const { pagina, limite } = query;
    const [denuncias, total] = await Promise.all([
        prisma.denuncia.findMany({
            where: {
                produto: {
                    condominioId: req.user.condominioId,
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
                    condominioId: req.user.condominioId,
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
router.get('/produto/:produtoId', auth_1.authMiddleware, (0, auth_1.requireRole)('SINDICO'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { produtoId } = req.params;
    const denuncias = await prisma.denuncia.findMany({
        where: {
            produtoId,
            produto: {
                condominioId: req.user.condominioId,
            },
        },
        include: {
            denunciante: {
                select: { id: true, nome: true, unidade: true },
            },
        },
        orderBy: { criadoEm: 'desc' },
    });
    res.json({ denuncias });
}));
//# sourceMappingURL=denuncia.routes.js.map