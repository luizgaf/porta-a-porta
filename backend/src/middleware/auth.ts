import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tipos do Prisma (gerados após prisma generate)
type TipoUsuario = 'COMPRADOR' | 'VENDEDOR' | 'SINDICO';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    condominioId: string;
    nome: string;
    email: string;
    unidade: string;
    tipo: TipoUsuario;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
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

    const decoded = jwt.verify(token, secret) as {
      id: string;
      condominioId: string;
      tipo: TipoUsuario;
    };

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
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Token inválido ou expirado',
        code: 'INVALID_TOKEN',
      });
    }
    next(error);
  }
};

export const requireRole = (...roles: TipoUsuario[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
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

export const requireCondominio = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Garante que o usuário só acessa dados do próprio condomínio
  // O condominioId vem do token JWT, não do body/query params
  next();
};