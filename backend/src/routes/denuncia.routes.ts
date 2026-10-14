import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';
import { notificar } from '../services/notificacoes';

const router = Router();
const prisma = new PrismaClient();

const createDenunciaSchema = z.object({
  produtoId: z.string().min(1, 'ID do produto inválido'),
  motivo: z.string().min(10, 'Motivo deve ter pelo menos 10 caracteres').max(500),
});

const querySchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(50).default(20),
});

const updateDenunciaStatusSchema = z.object({
  acao: z.enum(['QUARENTENA', 'RESTAURAR']),
  justificativa: z.string().optional(),
});

// RN02: a denúncia é exibida sem nenhum dado que identifique o denunciante, inclusive para o síndico.
// O vínculo com o autor fica apenas no banco (contagem de denúncias distintas e bloqueio de duplicatas).
const denunciaSemIdentificacao = {
  id: true,
  produtoId: true,
  motivo: true,
  criadoEm: true,
} as const;

// Garante que nenhum campo de identificação saia na resposta, mesmo que a consulta mude
const paraModeracao = (denuncia: Record<string, unknown>) => {
  const { denuncianteId, denunciante, ...semIdentificacao } = denuncia;
  return semIdentificacao;
};

// POST /api/denuncias - Criar denúncia
router.post('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createDenunciaSchema.parse(req.body);

  // Verifica se produto existe e pertence ao condomínio
  const produto = await prisma.produto.findFirst({
    where: {
      id: data.produtoId,
      condominioId: req.user!.condominioId,
    },
  });

  if (!produto) {
    throw new AppError(404, 'Produto não encontrado', 'PRODUTO_NOT_FOUND');
  }

  // Verifica se usuário não está denunciando próprio produto
  if (produto.vendedorId === req.user!.id) {
    throw new AppError(400, 'Não é possível denunciar seu próprio produto', 'SELF_REPORT');
  }

  // Tenta criar denúncia (constraint unique impede duplicatas)
  try {
    const denuncia = await prisma.denuncia.create({
      data: {
        produtoId: data.produtoId,
        denuncianteId: req.user!.id,
        motivo: data.motivo,
      },
      include: {
        produto: {
          select: { id: true, nome: true },
        },
      },
    });

    // Se produto atingir 3 denúncias, colocar em quarentena
    const count = await prisma.denuncia.count({
      where: { produtoId: data.produtoId },
    });

    if (count >= 3 && produto.status !== 'QUARENTENA') {
      await prisma.produto.update({
        where: { id: data.produtoId },
        data: { status: 'QUARENTENA' },
      });

      // RN02 (a): alerta ao síndico para análise humana e aviso ao vendedor, sem identificar denunciantes
      const sindicos = await prisma.usuario.findMany({
        where: { condominioId: req.user!.condominioId, tipo: 'SINDICO' },
        select: { id: true },
      });
      await notificar(prisma, [
        ...(sindicos ?? []).map((sindico: { id: string }) => ({
          condominioId: req.user!.condominioId,
          usuarioId: sindico.id,
          tipo: 'DENUNCIA_PARA_ANALISE' as const,
          mensagem: `O anúncio "${produto.nome}" recebeu ${count} denúncias e foi suspenso automaticamente. Analise no painel de moderação.`,
          entidadeTipo: 'PRODUTO' as const,
          entidadeId: produto.id,
        })),
        {
          condominioId: req.user!.condominioId,
          usuarioId: produto.vendedorId,
          tipo: 'ANUNCIO_QUARENTENA' as const,
          mensagem: `Seu anúncio "${produto.nome}" foi suspenso por denúncias e aguarda a análise do síndico.`,
          entidadeTipo: 'PRODUTO' as const,
          entidadeId: produto.id,
        },
      ]);
    }

    res.status(201).json({ denuncia });
  } catch (error: unknown) {
    const prismaErr = error as { code?: string };
    if (prismaErr.code === 'P2002') {
      throw new AppError(409, 'Você já denunciou este produto', 'DUPLICATE_DENUNCIA');
    }
    throw error;
  }
}));

// GET /api/denuncias - Listar denúncias (apenas síndico)
router.get('/', authMiddleware, requireRole('SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = querySchema.parse(req.query);
  const { pagina, limite } = query;

  const [denuncias, total] = await Promise.all([
    prisma.denuncia.findMany({
      where: {
        produto: {
          condominioId: req.user!.condominioId,
        },
      },
      select: {
        ...denunciaSemIdentificacao,
        produto: {
          select: { id: true, nome: true, status: true, vendedorId: true },
        },
      },
      orderBy: { criadoEm: 'desc' },
      skip: (pagina - 1) * limite,
      take: limite,
    }),
    prisma.denuncia.count({
      where: {
        produto: {
          condominioId: req.user!.condominioId,
        },
      },
    }),
  ]);

  res.json({
    denuncias: denuncias.map(paraModeracao),
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas: Math.ceil(total / limite),
    },
  });
}));

// GET /api/denuncias/produto/:produtoId - Ver denúncias de um produto, sem identificação (síndico)
router.get('/produto/:produtoId', authMiddleware, requireRole('SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { produtoId } = req.params;

  const denuncias = await prisma.denuncia.findMany({
    where: {
      produtoId,
      produto: {
        condominioId: req.user!.condominioId,
      },
    },
    select: denunciaSemIdentificacao,
    orderBy: { criadoEm: 'desc' },
  });

  // LOG AUDITORIA: Síndico consultou as denúncias do anúncio (sem identificação dos denunciantes)
  await prisma.logAuditoria.create({
    data: {
      sindicoId: req.user!.id,
      acao: 'VISUALIZAR_DENUNCIAS',
      entidadeId: produtoId,
      justificativa: 'Consulta das denúncias do anúncio para moderação',
    },
  });

  res.json({ denuncias: denuncias.map(paraModeracao) });
}));

// PATCH /api/denuncias/:produtoId/quarentena - Síndico gerencia quarentena (aceitar/restaurar)
router.patch('/:produtoId/quarentena', authMiddleware, requireRole('SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { produtoId } = req.params;
  const { acao, justificativa } = updateDenunciaStatusSchema.parse(req.body);

  const produto = await prisma.produto.findFirst({
    where: { id: produtoId, condominioId: req.user!.condominioId },
  });

  if (!produto) {
    throw new AppError(404, 'Produto não encontrado', 'PRODUTO_NOT_FOUND');
  }

  let novoStatus: 'QUARENTENA' | 'ATIVO';
  let acaoLog: string;

  if (acao === 'QUARENTENA') {
    novoStatus = 'QUARENTENA';
    acaoLog = 'APLICAR_QUARENTENA';
  } else {
    novoStatus = 'ATIVO';
    acaoLog = 'RESTAURAR_PRODUTO';
  }

  // Atualiza status do produto
  const updated = await prisma.produto.update({
    where: { id: produtoId },
    data: { status: novoStatus },
  });

  // LOG AUDITORIA: Ação do síndico na quarentena
  await prisma.logAuditoria.create({
    data: {
      sindicoId: req.user!.id,
      acao: acaoLog,
      entidadeId: produtoId,
      justificativa: justificativa || `Produto movido para ${novoStatus} pelo síndico`,
    },
  });

  // Aviso ao vendedor sobre a decisão do síndico
  await notificar(prisma, [{
    condominioId: produto.condominioId,
    usuarioId: produto.vendedorId,
    tipo: acao === 'QUARENTENA' ? 'ANUNCIO_QUARENTENA' : 'ANUNCIO_RESTAURADO',
    mensagem: acao === 'QUARENTENA'
      ? `O síndico manteve seu anúncio "${produto.nome}" suspenso.`
      : `Seu anúncio "${produto.nome}" foi restaurado pelo síndico e voltou para a vitrine.`,
    entidadeTipo: 'PRODUTO',
    entidadeId: produto.id,
  }]);

  res.json({
    message: acao === 'QUARENTENA' ? 'Produto colocado em quarentena' : 'Produto restaurado',
    produto: updated
  });
}));

export { router as denunciaRoutes };