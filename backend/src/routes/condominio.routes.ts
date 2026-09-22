import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const createCondominioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  endereco: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
});

const updateCondominioSchema = createCondominioSchema.partial();

// POST /api/condominios - Criar condomínio (apenas síndico ou admin)
router.post('/', authMiddleware, requireRole('SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
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
router.get('/meu', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const condominio = await prisma.condominio.findUnique({
    where: { id: req.user!.condominioId },
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
    throw new AppError(404, 'Condomínio não encontrado', 'CONDOMINIO_NOT_FOUND');
  }

  res.json({ condominio });
}));

// GET /api/condominios/:id - Buscar condomínio por ID (apenas síndico do mesmo condomínio)
router.get('/:id', authMiddleware, requireRole('SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (id !== req.user!.condominioId) {
    throw new AppError(403, 'Acesso negado a outro condomínio', 'FORBIDDEN');
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
    throw new AppError(404, 'Condomínio não encontrado', 'CONDOMINIO_NOT_FOUND');
  }

  res.json({ condominio });
}));

// PUT /api/condominios/:id - Atualizar condomínio (apenas síndico)
router.put('/:id', authMiddleware, requireRole('SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = updateCondominioSchema.parse(req.body);

  if (id !== req.user!.condominioId) {
    throw new AppError(403, 'Acesso negado a outro condomínio', 'FORBIDDEN');
  }

  const condominio = await prisma.condominio.update({
    where: { id },
    data,
  });

  res.json({ condominio });
}));

export { router as condominioRoutes };