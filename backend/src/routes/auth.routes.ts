import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { gerarToken } from '../services/sessao';
import { sancaoAtiva, mensagemDeBloqueio, codigoDeBloqueio } from '../services/sancoes';

const router = Router();
const prisma = new PrismaClient();

type TipoUsuario = 'COMPRADOR' | 'VENDEDOR' | 'SINDICO';

// Schemas de validação
const registerSchema = z.object({
  condominioId: z.string().min(1, 'ID do condomínio inválido'),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  unidade: z.string().min(1, 'Unidade é obrigatória'),
  tipo: z.enum(['COMPRADOR', 'VENDEDOR', 'SINDICO']),
});

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

// POST /api/auth/register
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);

  // Verifica se condomínio existe
  const condominio = await prisma.condominio.findUnique({
    where: { id: data.condominioId },
  });

  if (!condominio) {
    throw new AppError(404, 'Condomínio não encontrado', 'CONDOMINIO_NOT_FOUND');
  }

  // Verifica se CPF ou email já existem no condomínio
  const existingUser = await prisma.usuario.findFirst({
    where: {
      condominioId: data.condominioId,
      OR: [
        { cpf: data.cpf },
        { email: data.email },
      ],
    },
  });

  if (existingUser) {
    throw new AppError(409, 'CPF ou e-mail já cadastrado neste condomínio', 'DUPLICATE_USER');
  }

  // Hash da senha
  const senhaHash = await bcrypt.hash(data.senha, 12);

  // Cria usuário
  const usuario = await prisma.usuario.create({
    data: {
      condominioId: data.condominioId,
      nome: data.nome,
      cpf: data.cpf,
      email: data.email,
      senhaHash,
      unidade: data.unidade,
      tipo: data.tipo as TipoUsuario,
    },
    select: {
      id: true,
      condominioId: true,
      nome: true,
      email: true,
      unidade: true,
      tipo: true,
      criadoEm: true,
    },
  });

  // Gera token JWT
  const token = gerarToken(usuario.id, usuario.condominioId, usuario.tipo);

  res.status(201).json({
    message: 'Usuário criado com sucesso',
    usuario: { ...usuario, condominioOrigemId: usuario.condominioId, condominioNome: condominio.nome },
    token,
  });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);

  const usuario = await prisma.usuario.findUnique({
    where: { email: data.email },
    include: { condominio: { select: { nome: true } } },
  });

  if (!usuario) {
    throw new AppError(401, 'Credenciais inválidas', 'INVALID_CREDENTIALS');
  }

  const senhaValida = await bcrypt.compare(data.senha, usuario.senhaHash);

  if (!senhaValida) {
    throw new AppError(401, 'Credenciais inválidas', 'INVALID_CREDENTIALS');
  }

  const bloqueio = await sancaoAtiva(prisma, usuario.id, usuario.condominioId);
  if (bloqueio) {
    throw new AppError(403, mensagemDeBloqueio(bloqueio), codigoDeBloqueio(bloqueio));
  }

  const token = gerarToken(usuario.id, usuario.condominioId, usuario.tipo);

  res.json({
    message: 'Login realizado com sucesso',
    usuario: {
      id: usuario.id,
      condominioId: usuario.condominioId,
      nome: usuario.nome,
      email: usuario.email,
      unidade: usuario.unidade,
      tipo: usuario.tipo,
      fotoUrl: usuario.fotoUrl,
      condominioOrigemId: usuario.condominioId,
      condominioNome: usuario.condominio?.nome,
    },
    token,
  });
}));

// GET /api/auth/me - Perfil no condomínio ativo (unidade e perfil do vínculo, se for outro condomínio)
router.get('/me', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const [usuario, condominio] = await Promise.all([
    prisma.usuario.findUnique({ where: { id: req.user!.id }, select: { criadoEm: true } }),
    prisma.condominio.findUnique({ where: { id: req.user!.condominioId }, select: { nome: true } }),
  ]);

  res.json({ usuario: { ...req.user, criadoEm: usuario?.criadoEm, condominioNome: condominio?.nome } });
}));

export { router as authRoutes };