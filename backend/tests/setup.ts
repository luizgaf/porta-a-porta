import os from 'os';
import path from 'path';
import { resetPrismaMock } from './helpers/prismaMock';

// Segredo usado apenas para assinar e validar os tokens dos testes
process.env.JWT_SECRET = 'segredo-apenas-para-testes';
// Fotos enviadas nos testes vão para uma pasta temporária, nunca para backend/uploads
process.env.UPLOAD_DIR = path.join(os.tmpdir(), `porta-a-porta-testes-${process.pid}`);

beforeEach(() => {
  resetPrismaMock();
  // O errorHandler registra cada erro no console; nos testes isso só polui a saída
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});
