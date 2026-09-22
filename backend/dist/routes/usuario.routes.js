"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usuarioRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.usuarioRoutes = router;
const prisma = new client_1.PrismaClient();
const updateUsuarioSchema = zod_1.z.object({
    nome: zod_1.z.string().min(2).optional(),
    unidade: zod_1.z.string().min(1).optional(),
    pushToken: zod_1.z.string().optional(),
});
// GET /api/usuarios/me - Perfil do usuário logado
router.get('/me', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const usuario = await prisma.usuario.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            condominioId: true,
            nome: true,
            email: true,
            unidade: true,
            tipo: true,
            pushToken: true,
            criadoEm: true,
        },
    });
    res.json({ usuario });
}));
// PUT /api/usuarios/me - Atualizar próprio perfil
router.put('/me', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = updateUsuarioSchema.parse(req.body);
    const usuario = await prisma.usuario.update({
        where: { id: req.user.id },
        data: {
            nome: data.nome,
            unidade: data.unidade,
            pushToken: data.pushToken,
        },
        select: {
            id: true,
            condominioId: true,
            nome: true,
            email: true,
            unidade: true,
            tipo: true,
            pushToken: true,
            criadoEm: true,
        },
    });
    res.json({ usuario });
}));
// GET /api/usuarios - Listar usuários do condomínio (apenas síndico)
router.get('/', auth_1.authMiddleware, (0, auth_1.requireRole)('SINDICO'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const usuarios = await prisma.usuario.findMany({
        where: { condominioId: req.user.condominioId },
        select: {
            id: true,
            nome: true,
            email: true,
            unidade: true,
            tipo: true,
            criadoEm: true,
        },
        orderBy: { criadoEm: 'desc' },
    });
    res.json({ usuarios });
}));
// GET /api/usuarios/vendedores - Listar vendedores do condomínio
router.get('/vendedores', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const vendedores = await prisma.usuario.findMany({
        where: {
            condominioId: req.user.condominioId,
            tipo: 'VENDEDOR',
        },
        select: {
            id: true,
            nome: true,
            unidade: true,
        },
        orderBy: { nome: 'asc' },
    });
    res.json({ vendedores });
}));
//# sourceMappingURL=usuario.routes.js.map