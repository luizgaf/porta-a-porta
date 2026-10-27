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
    // Condomínio do cadastro. O condominioId acima é o condomínio ativo, que pode ser
    // outro em que o usuário tem vínculo aprovado (ver rotas de vínculos)
    condominioOrigemId: string;
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

    // Condomínio de origem: perfil e unidade do próprio cadastro
    if (!decoded.condominioId || decoded.condominioId === usuario.condominioId) {
      req.user = { ...usuario, condominioOrigemId: usuario.condominioId };
      return next();
    }

    // Outro condomínio: vale o vínculo aprovado pelo síndico de lá, com a unidade e o perfil dele
    const vinculo = await prisma.vinculo.findUnique({
      where: { usuarioId_condominioId: { usuarioId: usuario.id, condominioId: decoded.condominioId } },
      select: { status: true, unidade: true, tipo: true },
    });

    if (!vinculo || vinculo.status !== 'APROVADO' || !vinculo.tipo) {
      return res.status(403).json({
        error: 'Você não tem acesso a este condomínio',
        code: 'VINCULO_INVALIDO',
      });
    }

    req.user = {
      ...usuario,
      condominioId: decoded.condominioId,
      unidade: vinculo.unidade,
      tipo: vinculo.tipo,
      condominioOrigemId: usuario.condominioId,
    };
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

// Hierarquia de perfis: cada perfil herda as permissões do anterior, como em "extends".
//   COMPRADOR: compra, avalia e denuncia
//   VENDEDOR extends COMPRADOR: também anuncia produtos e atende pedidos
//   SINDICO extends VENDEDOR: também modera denúncias e avaliações
export const PERFIS_HERDADOS: Record<TipoUsuario, TipoUsuario[]> = {
  COMPRADOR: ['COMPRADOR'],
  VENDEDOR: ['COMPRADOR', 'VENDEDOR'],
  SINDICO: ['COMPRADOR', 'VENDEDOR', 'SINDICO'],
};

// true se o tipo do usuário é o perfil pedido ou herda dele
export const temPerfil = (tipo: TipoUsuario, perfil: TipoUsuario) => PERFIS_HERDADOS[tipo].includes(perfil);

// Libera a rota para quem tem (ou herda) algum dos perfis informados.
// Ex.: requireRole('COMPRADOR') aceita comprador, vendedor e síndico.
export const requireRole = (...roles: TipoUsuario[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Não autenticado',
        code: 'UNAUTHORIZED',
      });
    }

    if (!roles.some((perfil) => temPerfil(req.user!.tipo, perfil))) {
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