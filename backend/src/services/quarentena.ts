import { PrismaClient } from '@prisma/client';

type Cliente = Pick<PrismaClient, 'logAuditoria' | 'denuncia'>;

export interface InfoQuarentena {
  motivo: string;
  // true quando o síndico colocou ou manteve o anúncio em quarentena; false na suspensão automática
  porSindico: boolean;
  data: Date | null;
  // Motivos escritos por quem denunciou, sem nenhuma identificação (RN02)
  denuncias: string[];
}

export const MOTIVO_AUTOMATICO = 'Muitas denúncias: produto sob análise do síndico.';

// Motivo da quarentena de cada anúncio, para mostrar ao vendedor e ao síndico (RN02).
// Vale a última decisão do síndico registrada na auditoria; se a última foi uma restauração
// (ou não há decisão), a quarentena atual é a automática, por denúncias.
export const motivosDeQuarentena = async (prisma: Cliente, produtoIds: string[]) => {
  const resultado = new Map<string, InfoQuarentena>();
  if (produtoIds.length === 0) return resultado;

  const [logs, denuncias] = await Promise.all([
    prisma.logAuditoria.findMany({
      where: { entidadeId: { in: produtoIds }, acao: { in: ['APLICAR_QUARENTENA', 'RESTAURAR_PRODUTO'] } },
      orderBy: { criadoEm: 'desc' },
      select: { entidadeId: true, acao: true, justificativa: true, criadoEm: true },
    }),
    // Só o produto e o motivo: quem denunciou nunca sai daqui
    prisma.denuncia.findMany({
      where: { produtoId: { in: produtoIds } },
      orderBy: { criadoEm: 'asc' },
      select: { produtoId: true, motivo: true },
    }),
  ]);

  for (const id of produtoIds) {
    const ultimo = (logs ?? []).find((l) => l.entidadeId === id);
    const motivosDenuncia = (denuncias ?? []).filter((d) => d.produtoId === id).map((d) => d.motivo);
    resultado.set(
      id,
      ultimo?.acao === 'APLICAR_QUARENTENA'
        ? { motivo: ultimo.justificativa || MOTIVO_AUTOMATICO, porSindico: true, data: ultimo.criadoEm, denuncias: motivosDenuncia }
        : { motivo: MOTIVO_AUTOMATICO, porSindico: false, data: null, denuncias: motivosDenuncia },
    );
  }
  return resultado;
};
