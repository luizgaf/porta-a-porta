import { PrismaClient } from '@prisma/client';

type ClienteVinculo = Pick<PrismaClient, 'vinculo'>;
type Pessoa = { id: string; unidade: string };

// A unidade gravada no usuário é a do condomínio de origem. Quem participa de outro condomínio
// por vínculo tem lá outra unidade; esta função troca a unidade das pessoas informadas pela
// unidade do vínculo com o condomínio exibido (vendedor no anúncio, comprador no pedido).
export const unidadesNoCondominio = async (prisma: ClienteVinculo, condominioId: string, pessoas: Pessoa[]) => {
  const ids = [...new Set(pessoas.map((p) => p.id))];
  if (ids.length === 0) return;

  const vinculos =
    (await prisma.vinculo.findMany({
      where: { condominioId, status: 'APROVADO', usuarioId: { in: ids } },
      select: { usuarioId: true, unidade: true },
    })) ?? [];

  const porUsuario = new Map(vinculos.map((v) => [v.usuarioId, v.unidade]));
  for (const pessoa of pessoas) {
    const unidade = porUsuario.get(pessoa.id);
    if (unidade) pessoa.unidade = unidade;
  }
};
