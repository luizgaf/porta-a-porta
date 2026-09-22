import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Tipos para erros do Prisma (sem depender do client gerado)
interface PrismaError extends Error {
  code?: string;
  meta?: {
    target?: string[];
  };
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ Error:', err);

  // Zod validation errors
  if (err instanceof ZodError) {
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
  const prismaErr = err as PrismaError;
  if (prismaErr.code === 'P2002') {
    const target = (prismaErr.meta?.target as string[])?.join(', ') || 'campo';
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

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};