"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = void 0;
const auth_routes_1 = require("./auth.routes");
const condominio_routes_1 = require("./condominio.routes");
const usuario_routes_1 = require("./usuario.routes");
const produto_routes_1 = require("./produto.routes");
const pedido_routes_1 = require("./pedido.routes");
const denuncia_routes_1 = require("./denuncia.routes");
const avaliacao_routes_1 = require("./avaliacao.routes");
const auditoria_routes_1 = require("./auditoria.routes");
const setupRoutes = (app) => {
    // Rotas públicas
    app.use('/api/auth', auth_routes_1.authRoutes);
    // Rotas protegidas (requerem autenticação)
    app.use('/api/condominios', condominio_routes_1.condominioRoutes);
    app.use('/api/usuarios', usuario_routes_1.usuarioRoutes);
    app.use('/api/produtos', produto_routes_1.produtoRoutes);
    app.use('/api/pedidos', pedido_routes_1.pedidoRoutes);
    app.use('/api/denuncias', denuncia_routes_1.denunciaRoutes);
    app.use('/api/avaliacoes', avaliacao_routes_1.avaliacaoRoutes);
    app.use('/api/auditoria', auditoria_routes_1.auditoriaRoutes);
};
exports.setupRoutes = setupRoutes;
//# sourceMappingURL=index.js.map