import { PrismaClient } from '@prisma/client';

type ClienteLog = Pick<PrismaClient, 'logAuditoria'>;

export interface InfoQuarentena {
  motivo: string;
  // true quando o síndico colocou ou manteve o anúncio em quarentena; false na suspensão automática
  porSindico: boolean;
  data: Date | null;
}

export const MOTIVO_AUTOMATICO =
  'Suspenso automaticamente após denúncias de 3 moradores diferentes. Aguardando a análise do síndico.';

// Motivo da quarentena de cada anúncio, para mostrar ao vendedor e ao síndico (RN02).
// Vale a última decisão do síndico registrada na auditoria; se a última foi uma restauração
// (ou não há decisão), a quarentena atual é a automática, por denúncias.
export const motivosDeQuarentena = async (prisma: ClienteLog, produtoIds: string[]) => {
  const resultado = new Map<string, InfoQuarentena>();
  if (produtoIds.length === 0) return resultado;

  const logs =
    (await prisma.logAuditoria.findMany({
      where: { entidadeId: { in: produtoIds }, acao: { in: ['APLICAR_QUARENTENA', 'RESTAURAR_PRODUTO'] } },
      orderBy: { criadoEm: 'desc' },
      select: { entidadeId: true, acao: true, justificativa: true, criadoEm: true },
    })) ?? [];

  for (const id of produtoIds) {
    const ultimo = logs.find((l) => l.entidadeId === id);
    resultado.set(
      id,
      ultimo?.acao === 'APLICAR_QUARENTENA'
        ? { motivo: ultimo.justificativa || 'Suspenso pelo síndico.', porSindico: true, data: ultimo.criadoEm }
        : { motivo: MOTIVO_AUTOMATICO, porSindico: false, data: null },
    );
  }
  return resultado;
};
