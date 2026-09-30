import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient, TipoUsuario } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';
import { sendPushNotifications } from '../services/notificationService';

const router = Router();
const prisma = new PrismaClient();

const sendNotificationSchema = z.object({
  usuarioId: z.string().uuid().optional(),
  titulo: z.string().min(1, 'Título é obrigatório'),
  corpo: z.string().min(1, 'Corpo é obrigatório'),
  dados: z.record(z.unknown()).optional(),
});

/**
 * POST /api/notificacoes/enviar
 * Envia uma notificação push — síndico pode enviar para todos do condomínio
 * ou para um usuário específico
 * Acesso: SINDICO
 */
router.post(
  '/enviar',
  authMiddleware,
  requireRole('SINDICO'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = sendNotificationSchema.parse(req.body);

    let tokens: string[] = [];

    if (data.usuarioId) {
      // Notificar usuário específico
      const usuario = await prisma.usuario.findFirst({
        where: {
          id: data.usuarioId,
          condominioId: req.user!.condominioId,
          pushToken: { not: null },
        },
        select: { pushToken: true, tipo: true },
      });

      if (!usuario) {
        throw new AppError(404, 'Usuário não encontrado', 'USER_NOT_FOUND');
      }

      tokens = [usuario.pushToken!];
    } else {
      // Notificar todos os usuários do condomínio
      const usuarios = await prisma.usuario.findMany({
        where: {
          condominioId: req.user!.condominioId,
          pushToken: { not: null },
        },
        select: { pushToken: true },
      });

      tokens = usuarios
        .map(u => u.pushToken!)
        .filter(t => t !== '');
    }

    if (tokens.length === 0) {
      return res.json({
        enviada: false,
        mensagem: 'Nenhum usuário com push token ativo',
      });
    }

    await sendPushNotifications(tokens, data.titulo, data.corpo, data.dados);

    res.json({
      enviada: true,
      destinatarios: tokens.length,
    });
  })
);

/**
 * POST /api/notificacoes/teste
 * Envia uma notificação de teste para o próprio síndico
 * Acesso: SINDICO
 */
router.post(
  '/teste',
  authMiddleware,
  requireRole('SINDICO'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user?.pushToken) {
      throw new AppError(
        400,
        'Você não tem um push token registrado',
        'NO_PUSH_TOKEN'
      );
    }

    await sendPushNotifications(
      [req.user.pushToken],
      'Teste de Notificação',
      'Esta é uma notificação de teste do Porta a Porta',
      { type: 'test' }
    );

    res.json({ enviada: true, destinatario: 1 });
  })
);

export { router as notificacaoRoutes };
