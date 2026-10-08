import express from 'express';
import http from 'http';
import { AddressInfo } from 'net';
import jwt from 'jsonwebtoken';
import { setupRoutes } from '../../src/routes';
import { errorHandler } from '../../src/middleware/errorHandler';
import { prismaMock } from './prismaMock';
import { UsuarioTeste } from './dados';

// Monta a API como o src/index.ts, mas sem abrir a porta 3000 nem conectar ao banco
const criarApp = () => {
  const app = express();
  app.use(express.json());
  setupRoutes(app);
  app.use(errorHandler);
  return app;
};

let servidor: http.Server;
let urlBase: string;

export const iniciarApi = async () => {
  servidor = http.createServer(criarApp());
  await new Promise<void>((resolve) => servidor.listen(0, '127.0.0.1', resolve));
  urlBase = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
};

export const encerrarApi = async () => {
  servidor.closeAllConnections();
  await new Promise<void>((resolve) => servidor.close(() => resolve()));
};

// Gera um token válido e faz o middleware de autenticação encontrar o usuário no "banco"
export const entrarComo = (usuario: UsuarioTeste) => {
  prismaMock.usuario.findUnique.mockResolvedValue(usuario);
  return jwt.sign(
    { id: usuario.id, condominioId: usuario.condominioId, tipo: usuario.tipo },
    process.env.JWT_SECRET!,
  );
};

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export const chamar = async (metodo: Metodo, caminho: string, token?: string, corpo?: unknown) => {
  const resposta = await fetch(`${urlBase}${caminho}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      Connection: 'close',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  return { status: resposta.status, corpo: (await resposta.json()) as any };
};
