import { PrismaClient, TipoUsuario } from '@prisma/client';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const prisma = new PrismaClient();
const expo = new Expo();

/**
 * Mensagens de notificação para diferentes eventos do negócio
 */
const notificationMessages = {
  newOrder: (compradorNome: string, unidade: string, totalItens: number) => ({
    title: 'Novo pedido recebido!',
    body: `${compradorNome} (${unidade}) fez um pedido com ${totalItens} item(s).`,
    data: { type: 'new_order' },
  }),
  orderStatusChanged: (status: string, pedidoId: string) => ({
    title: 'Status do seu pedido atualizado',
    body: `Seu pedido está ${status}.`,
    data: { type: 'order_status', pedidoId },
  }),
  orderCancelled: () => ({
    title: 'Pedido cancelado',
    body: 'Seu pedido foi cancelado.',
    data: { type: 'order_cancelled' },
  }),
};

/**
 * Busca todos os push tokens de vendedores que possuem produtos nos itens do pedido
 */
async function getVendorTokens(pedidoId: string): Promise<string[]> {
  const tokens = await prisma.$queryRaw<Array<{ push_token: string }>>`
    SELECT DISTINCT u."push_token" as push_token
    FROM "Usuario" u
    INNER JOIN "Produto" p ON p."vendedor_id" = u."id"
    INNER JOIN "ItemPedido" ip ON ip."produto_id" = p."id"
    WHERE ip."pedido_id" = ${pedidoId}
      AND u."push_token" IS NOT NULL
      AND u."push_token" != ''
  `;
  return tokens.map(t => t.push_token);
}

/**
 * Envia notificação push para um ou mais tokens
 */
export async function sendPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const messages: ExpoPushMessage[] = [];

  for (const token of tokens) {
    // Verifica se o token é um token Expo válido
    if (!Expo.isExpoPushToken(token)) {
      console.warn(`Token inválido: ${token}`);
      continue;
    }

    messages.push({
      to: token,
      title,
      body,
      data,
      sound: 'default',
    });
  }

  // Envia em chunks (máx 100 por vez)
  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const ticket = await expo.sendPushNotificationsAsync(chunk);
      // Aqui poderíamos salvar os tickets para verificar o status depois
      // ticket.forEach(t => { ... save to DB for later retrieval })
    } catch (error) {
      console.error('Erro ao enviar notificações:', error);
    }
  }
}

/**
 * Notifica vendedores quando um novo pedido é criado
 */
export async function notifyNewOrder(
  pedidoId: string,
  compradorNome: string,
  unidade: string,
  totalItens: number
): Promise<void> {
  const tokens = await getVendorTokens(pedidoId);
  if (tokens.length === 0) return;

  const msg = notificationMessages.newOrder(compradorNome, unidade, totalItens);
  await sendPushNotifications(tokens, msg.title, msg.body, msg.data);
}

/**
 * Notifica o comprador quando o status do pedido muda
 */
export async function notifyOrderStatusChanged(
  pedidoId: string,
  compradorId: string,
  newStatus: string
): Promise<void> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: compradorId },
    select: { pushToken: true },
  });

  if (!usuario?.pushToken) return;

  const msg = notificationMessages.orderStatusChanged(
    newStatus,
    pedidoId
  );

  await sendPushNotifications(
    [usuario.pushToken],
    msg.title,
    msg.body,
    { ...msg.data, pedidoId }
  );
}

export { notificationMessages };
