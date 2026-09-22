import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const createProdutoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional(),
  preco: z.number().positive('Preço deve ser positivo'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
});

const updateProdutoSchema = createProdutoSchema.partial();

const querySchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(50).default(20),
  categoria: z.string().optional(),
  status: z.enum(['ATIVO', 'PAUSADO', 'QUARENTENA', 'EXCLUIDO']).optional(),
  vendedorId: z.string().uuid().optional(),
  busca: z.string().optional(),
});

// POST /api/produtos - Criar produto (apenas vendedor)
router.post('/', authMiddleware, requireRole('VENDEDOR', 'SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createProdutoSchema.parse(req.body);

  // RN01: Verificar limite de 15 produtos ATIVOS por vendedor
  const ativosCount = await prisma.produto.count({
    where: {
      condominioId: req.user!.condominioId,
      vendedorId: req.user!.id,
      status: 'ATIVO',
    },
  });

  if (ativosCount >= 15) {
    throw new AppError(400, 'Limite de 15 produtos ativos atingido. Pause ou exclua um produto antes de criar outro.', 'LIMIT_EXCEEDED');
  }

  const produto = await prisma.produto.create({
    data: {
      condominioId: req.user!.condominioId,
      vendedorId: req.user!.id,
      nome: data.nome,
      descricao: data.descricao,
      preco: data.preco,
      categoria: data.categoria,
      status: 'ATIVO',
    },
    include: {
      vendedor: {
        select: { id: true, nome: true, unidade: true },
      },
    },
  });

  res.status(201).json({ produto });
}));

// GET /api/produtos - Listar produtos (com filtros e paginação)
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = querySchema.parse(req.query);
  const { pagina, limite, categoria, status, vendedorId, busca } = query;

  const where: Record<string, unknown> = {
    condominioId: req.user!.condominioId,
  };

  // Usuários não-síndicos não veem produtos em quarentena/excluído
  if (req.user!.tipo !== 'SINDICO') {
    where.status = { in: ['ATIVO', 'PAUSADO'] };
  } else if (status) {
    where.status = status;
  }

  if (categoria) where.categoria = categoria;
  if (vendedorId) where.vendedorId = vendedorId;
  if (busca) {
    where.OR = [
      { nome: { contains: busca, mode: 'insensitive' } },
      { descricao: { contains: busca, mode: 'insensitive' } },
    ];
  }

  const [produtos, total] = await Promise.all([
    prisma.produto.findMany({
      where,
      include: {
        vendedor: {
          select: { id: true, nome: true, unidade: true },
        },
      },
      orderBy: { criadoEm: 'desc' },
      skip: (pagina - 1) * limite,
      take: limite,
    }),
    prisma.produto.count({ where }),
  ]);

  res.json({
    produtos,
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas: Math.ceil(total / limite),
    },
  });
}));

// GET /api/produtos/meus - Meus produtos (vendedor)
router.get('/meus', authMiddleware, requireRole('VENDEDOR', 'SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = querySchema.parse(req.query);
  const { pagina, limite, status } = query;

  const where: Record<string, unknown> = {
    condominioId: req.user!.condominioId,
    vendedorId: req.user!.id,
  };

  if (status) where.status = status;

  const [produtos, total] = await Promise.all([
    prisma.produto.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      skip: (pagina - 1) * limite,
      take: limite,
    }),
    prisma.produto.count({ where }),
  ]);

  res.json({
    produtos,
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas: Math.ceil(total / limite),
    },
  });
}));

// GET /api/produtos/:id - Buscar produto por ID
router.get('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const produto = await prisma.produto.findFirst({
    where: {
      id,
      condominioId: req.user!.condominioId,
    },
    include: {
      vendedor: {
        select: { id: true, nome: true, unidade: true, email: true },
      },
    },
  });

  if (!produto) {
    throw new AppError(404, 'Produto não encontrado', 'PRODUTO_NOT_FOUND');
  }

  // Verifica se usuário pode ver produto em quarentena/excluído
  if (['QUARENTENA', 'EXCLUIDO'].includes(produto.status) && req.user!.tipo !== 'SINDICO') {
    throw new AppError(404, 'Produto não encontrado', 'PRODUTO_NOT_FOUND');
  }

  res.json({ produto });
}));

// PUT /api/produtos/:id - Atualizar produto (apenas vendedor dono ou síndico)
router.put('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = updateProdutoSchema.parse(req.body);

  const produto = await prisma.produto.findFirst({
    where: { id, condominioId: req.user!.condominioId },
  });

  if (!produto) {
    throw new AppError(404, 'Produto não encontrado', 'PRODUTO_NOT_FOUND');
  }

  // Verifica permissão
  if (produto.vendedorId !== req.user!.id && req.user!.tipo !== 'SINDICO') {
    throw new AppError(403, 'Não autorizado a editar este produto', 'FORBIDDEN');
  }

  const updated = await prisma.produto.update({
    where: { id },
    data,
    include: {
      vendedor: {
        select: { id: true, nome: true, unidade: true },
      },
    },
  });

  res.json({ produto: updated });
}));

// PATCH /api/produtos/:id/status - Alterar status (vendedor dono ou síndico)
router.patch('/:id/status', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = z.object({
    status: z.enum(['ATIVO', 'PAUSADO', 'QUARENTENA', 'EXCLUIDO']),
  }).parse(req.body);

  const produto = await prisma.produto.findFirst({
    where: { id, condominioId: req.user!.condominioId },
  });

  if (!produto) {
    throw new AppError(404, 'Produto não encontrado', 'PRODUTO_NOT_FOUND');
  }

  // Apenas síndico pode colocar em quarentena/excluído
  if (['QUARENTENA', 'EXCLUIDO'].includes(status) && req.user!.tipo !== 'SINDICO') {
    throw new AppError(403, 'Apenas síndico pode alterar para este status', 'FORBIDDEN');
  }

  // Verifica permissão
  if (produto.vendedorId !== req.user!.id && req.user!.tipo !== 'SINDICO') {
    throw new AppError(403, 'Não autorizado a alterar este produto', 'FORBIDDEN');
  }

  // RN01: Se ativando, verificar limite de 15 produtos ATIVOS
  if (status === 'ATIVO' && produto.status !== 'ATIVO') {
    const ativosCount = await prisma.produto.count({
      where: {
        condominioId: req.user!.condominioId,
        vendedorId: req.user!.id,
        status: 'ATIVO',
      },
    });

    if (ativosCount >= 15) {
      throw new AppError(400, 'Limite de 15 produtos ativos atingido. Pause ou exclua um produto antes de ativar outro.', 'LIMIT_EXCEEDED');
    }
  }

  const updated = await prisma.produto.update({
    where: { id },
    data: { status },
  });

  res.json({ produto: updated });
}));

// DELETE /api/produtos/:id - Excluir produto (apenas vendedor dono ou síndico)
router.delete('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const produto = await prisma.produto.findFirst({
    where: { id, condominioId: req.user!.condominioId },
  });

  if (!produto) {
    throw new AppError(404, 'Produto não encontrado', 'PRODUTO_NOT_FOUND');
  }

  if (produto.vendedorId !== req.user!.id && req.user!.tipo !== 'SINDICO') {
    throw new AppError(403, 'Não autorizado a excluir este produto', 'FORBIDDEN');
  }

  await prisma.produto.update({
    where: { id },
    data: { status: 'EXCLUIDO' },
  });

  res.json({ message: 'Produto excluído com sucesso' });
}));

export { router as produtoRoutes };