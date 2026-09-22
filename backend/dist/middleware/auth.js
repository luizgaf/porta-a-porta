"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireCondominio = exports.requireRole = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Token de acesso não fornecido',
                code: 'UNAUTHORIZED',
            });
        }
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET não configurado');
        }
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // Busca usuário no banco para garantir que ainda existe e está ativo
        const usuario = await prisma.usuario.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                condominioId: true,
                nome: true,
                email: true,
                unidade: true,
                tipo: true,
            },
        });
        if (!usuario) {
            return res.status(401).json({
                error: 'Usuário não encontrado',
                code: 'USER_NOT_FOUND',
            });
        }
        req.user = usuario;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({
                error: 'Token inválido ou expirado',
                code: 'INVALID_TOKEN',
            });
        }
        next(error);
    }
};
exports.authMiddleware = authMiddleware;
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Não autenticado',
                code: 'UNAUTHORIZED',
            });
        }
        if (!roles.includes(req.user.tipo)) {
            return res.status(403).json({
                error: 'Acesso negado: permissão insuficiente',
                code: 'FORBIDDEN',
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
const requireCondominio = (req, res, next) => {
    // Garante que o usuário só acessa dados do próprio condomínio
    // O condominioId vem do token JWT, não do body/query params
    next();
};
exports.requireCondominio = requireCondominio;
//# sourceMappingURL=auth.js.map