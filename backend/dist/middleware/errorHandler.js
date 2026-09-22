"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = exports.AppError = void 0;
const zod_1 = require("zod");
class AppError extends Error {
    statusCode;
    message;
    code;
    details;
    constructor(statusCode, message, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.code = code;
        this.details = details;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err);
    // Zod validation errors
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            error: 'Erro de validação',
            code: 'VALIDATION_ERROR',
            details: err.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
    }
    // Prisma errors (verifica por duck typing)
    const prismaErr = err;
    if (prismaErr.code === 'P2002') {
        const target = prismaErr.meta?.target?.join(', ') || 'campo';
        return res.status(409).json({
            error: `Já existe um registro com este ${target}`,
            code: 'DUPLICATE_ENTRY',
        });
    }
    if (prismaErr.code === 'P2025') {
        return res.status(404).json({
            error: 'Registro não encontrado',
            code: 'NOT_FOUND',
        });
    }
    // App errors (custom)
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: err.message,
            code: err.code,
            details: err.details,
        });
    }
    // Default error
    return res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
    });
};
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map