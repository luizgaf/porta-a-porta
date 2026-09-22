"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
exports.authRoutes = router;
const prisma = new client_1.PrismaClient();
// Schemas de validação
const registerSchema = zod_1.z.object({
    condominioId: zod_1.z.string().uuid('ID do condomínio inválido'),
    nome: zod_1.z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    cpf: zod_1.z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
    email: zod_1.z.string().email('E-mail inválido'),
    senha: zod_1.z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    unidade: zod_1.z.string().min(1, 'Unidade é obrigatória'),
    tipo: zod_1.z.enum(['COMPRADOR', 'VENDEDOR', 'SINDICO']),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('E-mail inválido'),
    senha: zod_1.z.string().min(1, 'Senha é obrigatória'),
});
// POST /api/auth/register
router.post('/register', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = registerSchema.parse(req.body);
    // Verifica se condomínio existe
    const condominio = await prisma.condominio.findUnique({
        where: { id: data.condominioId },
    });
    if (!condominio) {
        throw new errorHandler_1.AppError(404, 'Condomínio não encontrado', 'CONDOMINIO_NOT_FOUND');
    }
    // Verifica se CPF ou email já existem no condomínio
    const existingUser = await prisma.usuario.findFirst({
        where: {
            condominioId: data.condominioId,
            OR: [
                { cpf: data.cpf },
                { email: data.email },
            ],
        },
    });
    if (existingUser) {
        throw new errorHandler_1.AppError(409, 'CPF ou e-mail já cadastrado neste condomínio', 'DUPLICATE_USER');
    }
    // Hash da senha
    const senhaHash = await bcryptjs_1.default.hash(data.senha, 12);
    // Cria usuário
    const usuario = await prisma.usuario.create({
        data: {
            condominioId: data.condominioId,
            nome: data.nome,
            cpf: data.cpf,
            email: data.email,
            senhaHash,
            unidade: data.unidade,
            tipo: data.tipo,
        },
        select: {
            id: true,
            condominioId: true,
            nome: true,
            email: true,
            unidade: true,
            tipo: true,
            criadoEm: true,
        },
    });
    // Gera token JWT
    const token = jsonwebtoken_1.default.sign({ id: usuario.id, condominioId: usuario.condominioId, tipo: usuario.tipo }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.status(201).json({
        message: 'Usuário criado com sucesso',
        usuario,
        token,
    });
}));
// POST /api/auth/login
router.post('/login', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const usuario = await prisma.usuario.findUnique({
        where: { email: data.email },
    });
    if (!usuario) {
        throw new errorHandler_1.AppError(401, 'Credenciais inválidas', 'INVALID_CREDENTIALS');
    }
    const senhaValida = await bcryptjs_1.default.compare(data.senha, usuario.senhaHash);
    if (!senhaValida) {
        throw new errorHandler_1.AppError(401, 'Credenciais inválidas', 'INVALID_CREDENTIALS');
    }
    const token = jsonwebtoken_1.default.sign({ id: usuario.id, condominioId: usuario.condominioId, tipo: usuario.tipo }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({
        message: 'Login realizado com sucesso',
        usuario: {
            id: usuario.id,
            condominioId: usuario.condominioId,
            nome: usuario.nome,
            email: usuario.email,
            unidade: usuario.unidade,
            tipo: usuario.tipo,
        },
        token,
    });
}));
// GET /api/auth/me
router.get('/me', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new errorHandler_1.AppError(401, 'Token não fornecido', 'UNAUTHORIZED');
    }
    const token = authHeader.split(' ')[1];
    const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    const usuario = await prisma.usuario.findUnique({
        where: { id: decoded.id },
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
    if (!usuario) {
        throw new errorHandler_1.AppError(404, 'Usuário não encontrado', 'USER_NOT_FOUND');
    }
    res.json({ usuario });
}));
//# sourceMappingURL=auth.routes.js.map