import { PrismaClient } from '@prisma/client';

type Cliente = Pick<PrismaClient, 'avaliacao'>;

export interface ResumoAvaliacoes {
  mediaAvaliacoes: number;
  totalAvaliacoes: number;
}

const SEM_AVALIACAO: ResumoAvaliacoes = { mediaAvaliacoes: 0, totalAvaliacoes: 0 };

// Média e quantidade de avaliações de cada produto, para a vitrine e o detalhe do anúncio.
// Avaliações removidas pelo síndico não entram na conta.
export const resumoDasAvaliacoes = async (prisma: Cliente, produtoIds: string[]) => {
  const resultado = new Map<string, ResumoAvaliacoes>();
  if (produtoIds.length === 0) return resultado;

  const grupos = await prisma.avaliacao.groupBy({
    by: ['produtoId'],
    where: { produtoId: { in: produtoIds }, removidaPor: null },
    _avg: { nota: true },
    _count: { _all: true },
  });

  for (const g of grupos ?? []) {
    resultado.set(g.produtoId, {
      mediaAvaliacoes: Number((g._avg.nota ?? 0).toFixed(1)),
      totalAvaliacoes: g._count._all,
    });
  }
  return resultado;
};

// Acrescenta mediaAvaliacoes e totalAvaliacoes a cada produto da lista
export const comAvaliacoes = async <T extends { id: string }>(prisma: Cliente, produtos: T[]) => {
  const resumo = await resumoDasAvaliacoes(prisma, produtos.map((p) => p.id));
  return produtos.map((p) => ({ ...p, ...(resumo.get(p.id) ?? SEM_AVALIACAO) }));
};
