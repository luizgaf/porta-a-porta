import express, { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';
import {
  TAMANHO_MAXIMO_IMAGEM,
  LIMITE_CORPO_UPLOAD,
  tipoDeclaradoAceitavel,
  extensaoPelaAssinatura,
  lerArquivoEnviado,
  salvarImagem,
  removerImagem,
} from '../services/imagens';
import { sancaoAtiva, dataHora } from '../services/sancoes';
import { notificar, TipoNotificacao } from '../services/notificacoes';

type TipoSancao = Extract<TipoNotificacao, 'ADVERTENCIA' | 'SUSPENSAO' | 'BANIMENTO'>;

const router = Router();
const prisma = new PrismaClient();

const updateUsuarioSchema = z.object({
  nome: z.string().min(2).optional(),
  unidade: z.string().min(1).optional(),
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
      fotoUrl: true,
      criadoEm: true,
    },
  });

  res.json({ usuario });
}));

// PUT /api/usuarios/me - Atualizar próprio perfil
router.put('/me', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = updateUsuarioSchema.parse(req.body);
  const emOutroCondominio = req.user!.condominioId !== req.user!.condominioOrigemId;

  // Em outro condomínio, a unidade é a do vínculo com aquele condomínio
  if (emOutroCondominio && data.unidade) {
    await prisma.vinculo.update({
      where: { usuarioId_condominioId: { usuarioId: req.user!.id, condominioId: req.user!.condominioId } },
      data: { unidade: data.unidade },
    });
  }

  const atualizado = await prisma.usuario.update({
    where: { id: req.user!.id },
    data: {
      nome: data.nome,
      unidade: emOutroCondominio ? undefined : data.unidade,
    },
    select: {
      id: true,
      condominioId: true,
      nome: true,
      email: true,
      unidade: true,
      tipo: true,
      fotoUrl: true,
      criadoEm: true,
    },
  });

  // Devolve o perfil no condomínio ativo
  const usuario = emOutroCondominio
    ? { ...atualizado, condominioId: req.user!.condominioId, tipo: req.user!.tipo, unidade: data.unidade ?? req.user!.unidade }
    : atualizado;

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
      fotoUrl: true,
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


// ------------------------------------------------------------------ Foto de perfil

// PUT /api/usuarios/me/foto - Envia ou troca a foto de perfil (JPEG, PNG ou WebP, até 5 MB)
// O app envia como multipart/form-data; o arquivo direto no corpo também é aceito
router.put(
  '/me/foto',
  authMiddleware,
  express.raw({ type: () => true, limit: LIMITE_CORPO_UPLOAD }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { conteudo, tipo } = lerArquivoEnviado(req.body, req.headers['content-type']);
    if (conteudo.length > TAMANHO_MAXIMO_IMAGEM) {
      throw new AppError(413, 'A foto deve ter no máximo 5 MB', 'ARQUIVO_MUITO_GRANDE');
    }
    const extensao = extensaoPelaAssinatura(conteudo);
    if (!tipoDeclaradoAceitavel(tipo) || !extensao) {
      throw new AppError(415, 'Envie uma imagem JPEG, PNG ou WebP', 'FORMATO_INVALIDO');
    }

    const anterior = req.user!.fotoUrl;
    const fotoUrl = await salvarImagem(conteudo, extensao);
    await prisma.usuario.update({ where: { id: req.user!.id }, data: { fotoUrl } });
    await removerImagem(anterior);

    res.json({ fotoUrl });
  }),
);

// DELETE /api/usuarios/me/foto - Remove a foto de perfil
router.delete('/me/foto', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.usuario.update({ where: { id: req.user!.id }, data: { fotoUrl: null } });
  await removerImagem(req.user!.fotoUrl);
  res.json({ fotoUrl: null });
}));

// ------------------------------------------------------------------ Painel de usuários do síndico

const DIAS_NOVO = 30;
const PERFIL_TEXTO = { COMPRADOR: 'comprador', VENDEDOR: 'vendedor', SINDICO: 'síndico' } as const;

// Membros do condomínio ativo: moradores de origem e participantes com vínculo aprovado,
// cada um com a unidade e o perfil que valem neste condomínio
const membrosDoCondominio = async (condominioId: string) => {
  const [moradores, participantes] = await Promise.all([
    prisma.usuario.findMany({
      where: { condominioId },
      select: { id: true, nome: true, unidade: true, tipo: true, fotoUrl: true, criadoEm: true },
    }),
    prisma.vinculo.findMany({
      where: { condominioId, status: 'APROVADO' },
      select: {
        unidade: true,
        tipo: true,
        decididoEm: true,
        criadoEm: true,
        usuario: { select: { id: true, nome: true, fotoUrl: true, condominio: { select: { nome: true } } } },
      },
    }),
  ]);

  return [
    ...(moradores ?? []).map((u) => ({
      id: u.id,
      nome: u.nome,
      unidade: u.unidade,
      tipo: u.tipo as string,
      fotoUrl: u.fotoUrl,
      entrouEm: u.criadoEm,
      origem: 'MORADOR' as const,
      condominioOrigem: null as string | null,
    })),
    ...(participantes ?? []).map((v) => ({
      id: v.usuario.id,
      nome: v.usuario.nome,
      unidade: v.unidade,
      tipo: (v.tipo ?? 'COMPRADOR') as string,
      fotoUrl: v.usuario.fotoUrl,
      entrouEm: v.decididoEm ?? v.criadoEm,
      origem: 'PARTICIPANTE' as const,
      condominioOrigem: v.usuario.condominio.nome as string | null,
    })),
  ];
};

// GET /api/usuarios/painel - Resumo e lista dos usuários do condomínio (síndico)
// Não envia e-mail nem CPF: o síndico vê o necessário para moderar (privacidade por padrão)
router.get('/painel', authMiddleware, requireRole('SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const condominioId = req.user!.condominioId;
  const agora = new Date();
  const corte = new Date(agora.getTime() - DIAS_NOVO * 24 * 60 * 60 * 1000);

  const [membros, sancoes, pendentes] = await Promise.all([
    membrosDoCondominio(condominioId),
    prisma.sancao.findMany({
      where: { condominioId },
      select: { usuarioId: true, tipo: true, motivo: true, ate: true, revogadaEm: true, criadoEm: true },
      orderBy: { criadoEm: 'desc' },
    }),
    prisma.vinculo.count({ where: { condominioId, status: 'PENDENTE' } }),
  ]);

  const usuarios = membros
    .map((m) => {
      const doUsuario = (sancoes ?? []).filter((s) => s.usuarioId === m.id);
      const bloqueio = doUsuario.find(
        (s) => !s.revogadaEm && s.tipo !== 'ADVERTENCIA' && (!s.ate || new Date(s.ate) > agora),
      );
      return {
        ...m,
        novo: new Date(m.entrouEm) >= corte,
        situacao: bloqueio ? (bloqueio.tipo === 'BANIMENTO' ? 'BANIDO' : 'SUSPENSO') : 'ATIVO',
        bloqueio: bloqueio ? { motivo: bloqueio.motivo, ate: bloqueio.ate } : null,
        advertencias: doUsuario.filter((s) => s.tipo === 'ADVERTENCIA').length,
      };
    })
    .sort((a, b) => new Date(b.entrouEm).getTime() - new Date(a.entrouEm).getTime());

  res.json({
    resumo: {
      total: usuarios.length,
      novos: usuarios.filter((u) => u.novo).length,
      diasNovo: DIAS_NOVO,
      compradores: usuarios.filter((u) => u.tipo === 'COMPRADOR').length,
      vendedores: usuarios.filter((u) => u.tipo === 'VENDEDOR').length,
      sindicos: usuarios.filter((u) => u.tipo === 'SINDICO').length,
      participantes: usuarios.filter((u) => u.origem === 'PARTICIPANTE').length,
      suspensos: usuarios.filter((u) => u.situacao === 'SUSPENSO').length,
      banidos: usuarios.filter((u) => u.situacao === 'BANIDO').length,
      comAdvertencia: usuarios.filter((u) => u.advertencias > 0).length,
      pedidosParticipacao: pendentes ?? 0,
    },
    usuarios,
  });
}));

// Confere se o usuário participa do condomínio ativo e se pode ser punido pelo síndico
const alvoDaModeracao = async (req: AuthRequest) => {
  const membros = await membrosDoCondominio(req.user!.condominioId);
  const alvo = membros.find((m) => m.id === req.params.id);
  if (!alvo) {
    throw new AppError(404, 'Usuário não encontrado neste condomínio', 'USER_NOT_FOUND');
  }
  if (alvo.id === req.user!.id) {
    throw new AppError(400, 'Você não pode aplicar uma sanção a si mesmo', 'SANCAO_PROPRIA');
  }
  if (alvo.tipo === 'SINDICO') {
    throw new AppError(403, 'Não é possível aplicar sanção a um síndico', 'FORBIDDEN');
  }
  return alvo;
};

// GET /api/usuarios/:id/sancoes - Histórico de sanções do usuário neste condomínio (síndico)
router.get('/:id/sancoes', authMiddleware, requireRole('SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const membros = await membrosDoCondominio(req.user!.condominioId);
  if (!membros.some((m) => m.id === req.params.id)) {
    throw new AppError(404, 'Usuário não encontrado neste condomínio', 'USER_NOT_FOUND');
  }
  const sancoes = await prisma.sancao.findMany({
    where: { usuarioId: req.params.id, condominioId: req.user!.condominioId },
    select: { id: true, tipo: true, motivo: true, ate: true, revogadaEm: true, criadoEm: true },
    orderBy: { criadoEm: 'desc' },
  });
  res.json({ sancoes });
}));

const sancaoSchema = z
  .object({
    tipo: z.enum(['ADVERTENCIA', 'SUSPENSAO', 'BANIMENTO']),
    motivo: z.string().trim().min(5, 'Informe o motivo (mínimo 5 caracteres); o usuário vai ler este texto').max(500),
    dias: z.number().int().min(1).max(90).optional(),
  })
  .refine((d) => d.tipo !== 'SUSPENSAO' || d.dias, { message: 'Informe por quantos dias (1 a 90)', path: ['dias'] });

const ACAO_LOG = { ADVERTENCIA: 'ADVERTIR_USUARIO', SUSPENSAO: 'SUSPENDER_USUARIO', BANIMENTO: 'BANIR_USUARIO' } as const;

// POST /api/usuarios/:id/sancoes - Advertir, suspender (por dias) ou banir (síndico)
router.post('/:id/sancoes', authMiddleware, requireRole('SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = sancaoSchema.parse(req.body);
  const alvo = await alvoDaModeracao(req);
  const condominioId = req.user!.condominioId;

  const atual = await sancaoAtiva(prisma, alvo.id, condominioId);
  if (atual?.tipo === 'BANIMENTO' && data.tipo !== 'ADVERTENCIA') {
    throw new AppError(409, 'Este usuário já está banido', 'JA_BANIDO');
  }
  if (atual?.tipo === 'SUSPENSAO' && data.tipo === 'SUSPENSAO') {
    throw new AppError(409, 'Este usuário já está suspenso; reative-o antes de aplicar outra suspensão', 'JA_SUSPENSO');
  }

  const ate = data.tipo === 'SUSPENSAO' ? new Date(Date.now() + data.dias! * 24 * 60 * 60 * 1000) : null;
  const bloqueia = data.tipo !== 'ADVERTENCIA';

  const sancao = await prisma.$transaction(async (tx) => {
    // Banimento substitui a suspensão em andamento
    if (atual && data.tipo === 'BANIMENTO') {
      await tx.sancao.update({ where: { id: atual.id }, data: { revogadaEm: new Date(), revogadaPor: req.user!.id } });
    }
    const criada = await tx.sancao.create({
      data: { usuarioId: alvo.id, condominioId, sindicoId: req.user!.id, tipo: data.tipo, motivo: data.motivo, ate },
      select: { id: true, tipo: true, motivo: true, ate: true, criadoEm: true },
    });
    // Usuário bloqueado: os anúncios ativos dele saem da vitrine deste condomínio
    if (bloqueia) {
      await tx.produto.updateMany({
        where: { vendedorId: alvo.id, condominioId, status: 'ATIVO' },
        data: { status: 'PAUSADO' },
      });
    }
    await tx.logAuditoria.create({
      data: { sindicoId: req.user!.id, acao: ACAO_LOG[data.tipo], entidadeId: alvo.id, justificativa: data.motivo },
    });
    return criada;
  });

  const mensagem =
    data.tipo === 'ADVERTENCIA'
      ? `Você recebeu uma advertência do síndico. Motivo: ${data.motivo}`
      : data.tipo === 'SUSPENSAO'
        ? `Seu acesso a este condomínio foi suspenso por ${data.dias} ${data.dias === 1 ? 'dia' : 'dias'}, até ${dataHora(ate!)}. Motivo: ${data.motivo}`
        : `Seu acesso a este condomínio foi bloqueado pelo síndico. Motivo: ${data.motivo}`;
  await notificar(prisma, [{ condominioId, usuarioId: alvo.id, tipo: data.tipo as TipoSancao, mensagem }]);

  res.status(201).json({ message: `${data.tipo === 'ADVERTENCIA' ? 'Advertência registrada' : data.tipo === 'SUSPENSAO' ? 'Usuário suspenso' : 'Usuário banido'}`, sancao });
}));

// POST /api/usuarios/:id/reativar - Encerra a suspensão ou o banimento (síndico)
router.post('/:id/reativar', authMiddleware, requireRole('SINDICO'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { justificativa } = z.object({ justificativa: z.string().trim().max(500).optional() }).parse(req.body ?? {});
  const alvo = await alvoDaModeracao(req);
  const condominioId = req.user!.condominioId;

  const atual = await sancaoAtiva(prisma, alvo.id, condominioId);
  if (!atual) {
    throw new AppError(409, 'Este usuário não está suspenso nem banido', 'SEM_BLOQUEIO');
  }

  await prisma.$transaction(async (tx) => {
    await tx.sancao.update({ where: { id: atual.id }, data: { revogadaEm: new Date(), revogadaPor: req.user!.id } });
    await tx.logAuditoria.create({
      data: {
        sindicoId: req.user!.id,
        acao: 'REATIVAR_USUARIO',
        entidadeId: alvo.id,
        justificativa: justificativa || `Encerrou ${atual.tipo === 'BANIMENTO' ? 'o banimento' : 'a suspensão'} de ${PERFIL_TEXTO[alvo.tipo as keyof typeof PERFIL_TEXTO] ?? 'usuário'}`,
      },
    });
  });

  await notificar(prisma, [{
    condominioId,
    usuarioId: alvo.id,
    tipo: 'REATIVACAO',
    mensagem: 'O síndico reativou o seu acesso ao condomínio. Seus anúncios continuam pausados; ative-os no painel Vender.',
  }]);

  res.json({ message: 'Usuário reativado' });
}));

export { router as usuarioRoutes };