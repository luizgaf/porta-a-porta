"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.condominioRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.condominioRoutes = router;
const prisma = new client_1.PrismaClient();
const createCondominioSchema = zod_1.z.object({
    nome: zod_1.z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    endereco: zod_1.z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
});
const updateCondominioSchema = createCondominioSchema.partial();
// POST /api/condominios - Criar condomínio (apenas síndico ou admin)
router.post('/', auth_1.authMiddleware, (0, auth_1.requireRole)('SINDICO'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = createCondominioSchema.parse(req.body);
    const condominio = await prisma.condominio.create({
        data: {
            nome: data.nome,
            endereco: data.endereco,
        },
    });
    res.status(201).json({ condominio });
}));
// GET /api/condominios/meu - Buscar condomínio do usuário logado
router.get('/meu', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const condominio = await prisma.condominio.findUnique({
        where: { id: req.user.condominioId },
        include: {
            _count: {
                select: {
                    usuarios: true,
                    produtos: true,
                    pedidos: true,
                },
            },
        },
    });
    if (!condominio) {
        throw new errorHandler_1.AppError(404, 'Condomínio não encontrado', 'CONDOMINIO_NOT_FOUND');
    }
    res.json({ condominio });
}));
// GET /api/condominios/:id - Buscar condomínio por ID (apenas síndico do mesmo condomínio)
router.get('/:id', auth_1.authMiddleware, (0, auth_1.requireRole)('SINDICO'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (id !== req.user.condominioId) {
        throw new errorHandler_1.AppError(403, 'Acesso negado a outro condomínio', 'FORBIDDEN');
    }
    const condominio = await prisma.condominio.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    usuarios: true,
                    produtos: true,
                    pedidos: true,
                },
            },
        },
    });
    if (!condominio) {
        throw new errorHandler_1.AppError(404, 'Condomínio não encontrado', 'CONDOMINIO_NOT_FOUND');
    }
    res.json({ condominio });
}));
// PUT /api/condominios/:id - Atualizar condomínio (apenas síndico)
router.put('/:id', auth_1.authMiddleware, (0, auth_1.requireRole)('SINDICO'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const data = updateCondominioSchema.parse(req.body);
    if (id !== req.user.condominioId) {
        throw new errorHandler_1.AppError(403, 'Acesso negado a outro condomínio', 'FORBIDDEN');
    }
    const condominio = await prisma.condominio.update({
        where: { id },
        data,
    });
    res.json({ condominio });
}));
//# sourceMappingURL=condominio.routes.js.map