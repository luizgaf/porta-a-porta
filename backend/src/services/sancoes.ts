import { PrismaClient } from '@prisma/client';

type ClienteSancao = Pick<PrismaClient, 'sancao'>;

export type TipoSancao = 'ADVERTENCIA' | 'SUSPENSAO' | 'BANIMENTO';

export interface SancaoAtiva {
  id: string;
  tipo: 'SUSPENSAO' | 'BANIMENTO';
  motivo: string;
  ate: Date | null;
}

const dataHora = (d: Date) =>
  d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

// Suspensão ainda no prazo ou banimento, não revogados pelo síndico. A advertência não bloqueia.
export const sancaoAtiva = async (
  prisma: ClienteSancao,
  usuarioId: string,
  condominioId: string,
): Promise<SancaoAtiva | null> => {
  const sancao = await prisma.sancao.findFirst({
    where: {
      usuarioId,
      condominioId,
      revogadaEm: null,
      tipo: { in: ['SUSPENSAO', 'BANIMENTO'] },
      OR: [{ ate: null }, { ate: { gt: new Date() } }],
    },
    orderBy: { criadoEm: 'desc' },
    select: { id: true, tipo: true, motivo: true, ate: true },
  });
  return (sancao as SancaoAtiva | null) ?? null;
};

// Texto mostrado ao usuário bloqueado (no login e em qualquer chamada àquele condomínio)
export const mensagemDeBloqueio = (s: SancaoAtiva) =>
  s.tipo === 'BANIMENTO'
    ? `Seu acesso a este condomínio foi bloqueado pelo síndico. Motivo: ${s.motivo}`
    : `Seu acesso a este condomínio está suspenso até ${dataHora(s.ate!)}. Motivo: ${s.motivo}`;

export const codigoDeBloqueio = (s: SancaoAtiva) => (s.tipo === 'BANIMENTO' ? 'USUARIO_BANIDO' : 'USUARIO_SUSPENSO');

export { dataHora };
