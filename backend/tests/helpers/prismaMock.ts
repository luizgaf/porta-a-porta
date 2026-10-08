// Substituto do PrismaClient nos testes de unidade (ver moduleNameMapper em jest.config.js).
// Cada teste define o que o "banco" devolve e verifica o que a rota tentou gravar.

const criarModelo = () => ({
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
});

export const prismaMock = {
  usuario: criarModelo(),
  condominio: criarModelo(),
  produto: criarModelo(),
  pedido: criarModelo(),
  itemPedido: criarModelo(),
  denuncia: criarModelo(),
  avaliacao: criarModelo(),
  logAuditoria: criarModelo(),
  $transaction: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

type Modelo = ReturnType<typeof criarModelo>;

export const resetPrismaMock = () => {
  for (const valor of Object.values(prismaMock)) {
    if (typeof valor === 'function') {
      (valor as jest.Mock).mockReset();
    } else {
      Object.values(valor as Modelo).forEach((fn) => fn.mockReset());
    }
  }
  // Transações executam o callback usando o próprio simulado como cliente
  prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof prismaMock) => unknown) => fn(prismaMock));
};

// Todas as rotas fazem `new PrismaClient()`; aqui todas recebem o mesmo simulado
export class PrismaClient {
  constructor() {
    return prismaMock as unknown as PrismaClient;
  }
}
