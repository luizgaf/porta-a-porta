import { Application } from 'express';
import { authRoutes } from './auth.routes';
import { condominioRoutes } from './condominio.routes';
import { usuarioRoutes } from './usuario.routes';
import { produtoRoutes } from './produto.routes';
import { pedidoRoutes } from './pedido.routes';
import { denunciaRoutes } from './denuncia.routes';
import { avaliacaoRoutes } from './avaliacao.routes';
import { auditoriaRoutes } from './auditoria.routes';

export const setupRoutes = (app: Application) => {
  // Rotas públicas
  app.use('/api/auth', authRoutes);

  // Rotas protegidas (requerem autenticação)
  app.use('/api/condominios', condominioRoutes);
  app.use('/api/usuarios', usuarioRoutes);
  app.use('/api/produtos', produtoRoutes);
  app.use('/api/pedidos', pedidoRoutes);
  app.use('/api/denuncias', denunciaRoutes);
  app.use('/api/avaliacoes', avaliacaoRoutes);
  app.use('/api/auditoria', auditoriaRoutes);
};