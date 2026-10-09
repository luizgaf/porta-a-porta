// Prisma serializa campos Decimal (preco, valorTotal, precoUnitario) como string no JSON.
// Sempre converter antes de calcular ou formatar.
export type Decimal = number | string;

export const toNumber = (value: Decimal | null | undefined): number => {
  const n = typeof value === 'number' ? value : parseFloat(value ?? '');
  return Number.isFinite(n) ? n : 0;
};

export const formatBRL = (value: Decimal | null | undefined): string =>
  `R$ ${toNumber(value).toFixed(2).replace('.', ',')}`;
