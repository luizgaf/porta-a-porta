import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { setupRoutes } from './routes';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8081',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Disponibiliza Prisma no app
app.set('prisma', prisma);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas da API
setupRoutes(app);

// Middleware de erro (deve ser o último)
app.use(errorHandler);

// Inicialização do servidor
async function startServer() {
  try {
    // Testa conexão com o banco
    await prisma.$connect();
    console.log('✅ Conectado ao PostgreSQL');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

export { app, prisma };