import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const updateUsuarioSchema = z.object({
  nome: z.string().min(2).optional(),
  unidade: z.string().min(1).optional(),
  pushToken: z.string().optional(),
});

// GET /api/usuarios/me - Perfil do usuário logado
router.get('/me', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.user!.id },
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
router.put('/me', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = updateUsuarioSchema.parse(req.body);

  const usuario = await prisma.usuario.update({
    where: { id: req.user!.id },
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
router.get('/', authMiddleware, requireRole('SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const usuarios = await prisma.usuario.findMany({
    where: { condominioId: req.user!.condominioId },
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
router.get('/vendedores', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const vendedores = await prisma.usuario.findMany({
    where: {
      condominioId: req.user!.condominioId,
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

export { router as usuarioRoutes };