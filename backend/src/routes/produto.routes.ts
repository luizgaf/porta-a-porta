import express, { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';
import {
  TAMANHO_MAXIMO_IMAGEM,
  TIPOS_DE_IMAGEM,
  extensaoPelaAssinatura,
  salvarImagem,
  removerImagem,
  lerArquivoEnviado,
  LIMITE_CORPO_UPLOAD,
  tipoDeclaradoAceitavel,
} from '../services/imagens';
import { unidadesNoCondominio } from '../services/unidades';
import { motivosDeQuarentena } from '../services/quarentena';

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
  vendedorId: z.string().min(1).optional(),
  busca: z.string().optional(),
});

// POST /api/produtos - Criar produto (apenas vendedor)
router.post('/', authMiddleware, requireRole('VENDEDOR'), asyncHandler(async (req: AuthRequest, res: Response) => {
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

  // Anúncio em quarentena só aparece para o síndico e para o vendedor dono (RN02); excluídos não aparecem
  if (req.user!.tipo === 'SINDICO') {
    where.status = status ?? { not: 'EXCLUIDO' };
  } else {
    where.AND = [
      {
        OR: [
          { status: { in: ['ATIVO', 'PAUSADO'] } },
          { status: 'QUARENTENA', vendedorId: req.user!.id },
        ],
      },
    ];
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

  await unidadesNoCondominio(prisma, req.user!.condominioId, produtos.map((p) => p.vendedor));

  res.json({
    produtos: await comMotivoDeQuarentena(produtos),
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas: Math.ceil(total / limite),
    },
  });
}));

// Acrescenta o motivo da quarentena aos anúncios suspensos. Só é chamada nas respostas que
// chegam ao síndico ou ao vendedor dono, pois os demais não recebem anúncios em quarentena.
const comMotivoDeQuarentena = async <T extends { id: string; status: string }>(produtos: T[]) => {
  const suspensos = produtos.filter((p) => p.status === 'QUARENTENA').map((p) => p.id);
  if (suspensos.length === 0) return produtos;
  const motivos = await motivosDeQuarentena(prisma, suspensos);
  return produtos.map((p) => (p.status === 'QUARENTENA' ? { ...p, quarentena: motivos.get(p.id) } : p));
};

// GET /api/produtos/meus - Meus produtos (vendedor)
router.get('/meus', authMiddleware, requireRole('VENDEDOR'), asyncHandler(async (req: AuthRequest, res: Response) => {
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
    produtos: await comMotivoDeQuarentena(produtos),
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
        select: { id: true, nome: true, unidade: true },
      },
    },
  });

  if (!produto) {
    throw new AppError(404, 'Produto não encontrado', 'PRODUTO_NOT_FOUND');
  }

  // Verifica se usuário pode ver produto em quarentena/excluído
  // Em quarentena, só o síndico e o vendedor dono veem o anúncio; excluído, só o síndico
  const ehDono = produto.vendedorId === req.user!.id;
  const ehSindico = req.user!.tipo === 'SINDICO';
  if ((produto.status === 'QUARENTENA' && !ehDono && !ehSindico) || (produto.status === 'EXCLUIDO' && !ehSindico)) {
    throw new AppError(404, 'Produto não encontrado', 'PRODUTO_NOT_FOUND');
  }

  await unidadesNoCondominio(prisma, req.user!.condominioId, [produto.vendedor]);

  const [comMotivo] = await comMotivoDeQuarentena([produto]);
  res.json({ produto: comMotivo });
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

  // RN02: anúncio em quarentena só sai dela por decisão do síndico; o vendedor não reativa nem pausa.
  // Anúncio excluído também não volta pela troca de status.
  if (produto.status === 'QUARENTENA' && req.user!.tipo !== 'SINDICO') {
    throw new AppError(403, 'Anúncio em quarentena: só o síndico pode reativá-lo', 'PRODUTO_EM_QUARENTENA');
  }
  if (produto.status === 'EXCLUIDO' && req.user!.tipo !== 'SINDICO') {
    throw new AppError(403, 'Anúncio excluído não pode ser reativado', 'PRODUTO_EXCLUIDO');
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

// PUT /api/produtos/:id/imagem - Envia ou troca a foto do produto (dono ou síndico)
// O corpo da requisição é o próprio arquivo, com Content-Type image/jpeg, image/png ou image/webp (RNF05)
router.put(
  '/:id/imagem',
  authMiddleware,
  express.raw({ type: () => true, limit: LIMITE_CORPO_UPLOAD }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const produto = await prisma.produto.findFirst({
      where: { id, condominioId: req.user!.condominioId },
    });

    if (!produto) {
      throw new AppError(404, 'Produto não encontrado', 'PRODUTO_NOT_FOUND');
    }

    if (produto.vendedorId !== req.user!.id && req.user!.tipo !== 'SINDICO') {
      throw new AppError(403, 'Não autorizado a alterar este produto', 'FORBIDDEN');
    }

    // Arquivo direto no corpo ou em multipart/form-data (como o app envia)
    const { conteudo: arquivo, tipo } = lerArquivoEnviado(req.body, req.headers['content-type']);
    if (arquivo.length > TAMANHO_MAXIMO_IMAGEM) {
      throw new AppError(413, 'A foto deve ter no máximo 5 MB', 'ARQUIVO_MUITO_GRANDE');
    }
    const extensao = extensaoPelaAssinatura(arquivo);

    if (!tipoDeclaradoAceitavel(tipo) || !extensao) {
      throw new AppError(415, 'Envie uma imagem JPEG, PNG ou WebP', 'FORMATO_INVALIDO');
    }

    const imagemUrl = await salvarImagem(arquivo, extensao);
    const updated = await prisma.produto.update({
      where: { id },
      data: { imagemUrl },
    });
    await removerImagem(produto.imagemUrl);

    res.json({ produto: updated });
  }),
);

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