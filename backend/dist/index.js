"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.app = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const client_1 = require("@prisma/client");
const errorHandler_1 = require("./middleware/errorHandler");
const routes_1 = require("./routes");
const app = (0, express_1.default)();
exports.app = app;
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
const PORT = process.env.PORT || 3000;
// Middlewares globais
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:8081',
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Disponibiliza Prisma no app
app.set('prisma', prisma);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Rotas da API
(0, routes_1.setupRoutes)(app);
// Middleware de erro (deve ser o último)
app.use(errorHandler_1.errorHandler);
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
    }
    catch (error) {
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
//# sourceMappingURL=index.js.map