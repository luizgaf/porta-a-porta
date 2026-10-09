import { resetPrismaMock } from './helpers/prismaMock';

// Segredo usado apenas para assinar e validar os tokens dos testes
process.env.JWT_SECRET = 'segredo-apenas-para-testes';

beforeEach(() => {
  resetPrismaMock();
  // O errorHandler registra cada erro no console; nos testes isso só polui a saída
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});
