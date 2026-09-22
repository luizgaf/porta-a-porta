"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditoriaRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.auditoriaRoutes = router;
const prisma = new client_1.PrismaClient();
const querySchema = zod_1.z.object({
    pagina: zod_1.z.coerce.number().int().positive().default(1),
    limite: zod_1.z.coerce.number().int().positive().max(50).default(20),
    entidadeId: zod_1.z.string().optional(),
    acao: zod_1.z.string().optional(),
});
// POST /api/auditoria - Registrar ação de auditoria (apenas síndico)
router.post('/', auth_1.authMiddleware, (0, auth_1.requireRole)('SINDICO'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = zod_1.z.object({
        acao: zod_1.z.string().min(1, 'Ação é obrigatória'),
        entidadeId: zod_1.z.string().min(1, 'ID da entidade é obrigatório'),
        justificativa: zod_1.z.string().optional(),
    }).parse(req.body);
    const log = await prisma.logAuditoria.create({
        data: {
            sindicoId: req.user.id,
            acao: data.acao,
            entidadeId: data.entidadeId,
            justificativa: data.justificativa,
        },
        include: {
            sindico: {
                select: { id: true, nome: true, unidade: true },
            },
        },
    });
    res.status(201).json({ log });
}));
// GET /api/auditoria - Listar logs de auditoria (apenas síndico)
router.get('/', auth_1.authMiddleware, (0, auth_1.requireRole)('SINDICO'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const query = querySchema.parse(req.query);
    const { pagina, limite, entidadeId, acao } = query;
    const where = {
        sindico: {
            condominioId: req.user.condominioId,
        },
    };
    if (entidadeId)
        where.entidadeId = entidadeId;
    if (acao)
        where.acao = { contains: acao, mode: 'insensitive' };
    const [logs, total] = await Promise.all([
        prisma.logAuditoria.findMany({
            where,
            include: {
                sindico: {
                    select: { id: true, nome: true, unidade: true },
                },
            },
            orderBy: { criadoEm: 'desc' },
            skip: (pagina - 1) * limite,
            take: limite,
        }),
        prisma.logAuditoria.count({ where }),
    ]);
    res.json({
        logs,
        paginacao: {
            pagina,
            limite,
            total,
            totalPaginas: Math.ceil(total / limite),
        },
    });
}));
//# sourceMappingURL=auditoria.routes.js.map