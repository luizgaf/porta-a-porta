import { PrismaClient } from '@prisma/client';

// Avisos internos do aplicativo (RNF01). O servidor grava o aviso no banco e o app
// consulta a lista ao abrir ou atualizar a tela; não há envio de push.

export type TipoNotificacao =
  | 'NOVO_PEDIDO'
  | 'STATUS_PEDIDO'
  | 'PEDIDO_CANCELADO'
  | 'ANUNCIO_QUARENTENA'
  | 'ANUNCIO_RESTAURADO'
  | 'DENUNCIA_PARA_ANALISE'
  | 'PEDIDO_VINCULO'
  | 'VINCULO_APROVADO'
  | 'VINCULO_RECUSADO'
  | 'ADVERTENCIA'
  | 'SUSPENSAO'
  | 'BANIMENTO'
  | 'REATIVACAO';

export interface NovaNotificacao {
  condominioId: string;
  usuarioId: string;
  tipo: TipoNotificacao;
  mensagem: string;
  entidadeTipo?: 'PEDIDO' | 'PRODUTO' | 'VINCULO';
  entidadeId?: string;
}

type ClienteNotificacao = Pick<PrismaClient, 'notificacao'>;

export const STATUS_PEDIDO_TEXTO: Record<string, string> = {
  PENDENTE: 'pendente',
  CONFIRMADO: 'confirmado',
  EM_PREPARO: 'em preparo',
  PRONTO_ENTREGA: 'pronto para entrega',
  ENTREGUE: 'entregue',
  CANCELADO: 'cancelado',
};

export const formatarValor = (valor: number) => `R$ ${valor.toFixed(2).replace('.', ',')}`;

// Grava os avisos sem interromper a ação principal: se a gravação falhar,
// o pedido ou a moderação já foram concluídos e o erro só é registrado no log.
export const notificar = async (prisma: ClienteNotificacao, avisos: NovaNotificacao[]) => {
  if (avisos.length === 0) return;
  try {
    await prisma.notificacao.createMany({ data: avisos });
  } catch (error) {
    console.error('❌ Erro ao gravar notificações:', error);
  }
};
