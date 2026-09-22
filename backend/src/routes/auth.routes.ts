import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

type TipoUsuario = 'COMPRADOR' | 'VENDEDOR' | 'SINDICO';

// Schemas de validação
const registerSchema = z.object({
  condominioId: z.string().uuid('ID do condomínio inválido'),
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
  const token = jwt.sign(
    { id: usuario.id, condominioId: usuario.condominioId, tipo: usuario.tipo },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );

  res.status(201).json({
    message: 'Usuário criado com sucesso',
    usuario,
    token,
  });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);

  const usuario = await prisma.usuario.findUnique({
    where: { email: data.email },
  });

  if (!usuario) {
    throw new AppError(401, 'Credenciais inválidas', 'INVALID_CREDENTIALS');
  }

  const senhaValida = await bcrypt.compare(data.senha, usuario.senhaHash);

  if (!senhaValida) {
    throw new AppError(401, 'Credenciais inválidas', 'INVALID_CREDENTIALS');
  }

  const token = jwt.sign(
    { id: usuario.id, condominioId: usuario.condominioId, tipo: usuario.tipo },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );

  res.json({
    message: 'Login realizado com sucesso',
    usuario: {
      id: usuario.id,
      condominioId: usuario.condominioId,
      nome: usuario.nome,
      email: usuario.email,
      unidade: usuario.unidade,
      tipo: usuario.tipo,
    },
    token,
  });
}));

// GET /api/auth/me
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'Token não fornecido', 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
    id: string;
    condominioId: string;
    tipo: TipoUsuario;
  };

  const usuario = await prisma.usuario.findUnique({
    where: { id: decoded.id },
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

  if (!usuario) {
    throw new AppError(404, 'Usuário não encontrado', 'USER_NOT_FOUND');
  }

  res.json({ usuario });
}));

export { router as authRoutes };