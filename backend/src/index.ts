import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { setupRoutes } from './routes';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(helmet());

// Request logging (real-time HTTP log)
const logFormat = process.env.NODE_ENV === 'production'
  ? 'combined'
  : 'dev';
app.use(morgan(logFormat));

// CORS configuration - permite localhost, LAN IPs e produção
const allowedOrigins: string[] = [
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  process.env.FRONTEND_URL,
  'https://api.porta-a-porta.com', // placeholder for production
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Allow any localhost/127.0.0.1 or LAN IP on port 8081
    const originStr: string = origin;
    const isAllowedOrigin = allowedOrigins.some(o => originStr.startsWith(o)) ||
      /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+):8081$/.test(originStr);

    if (isAllowedOrigin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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