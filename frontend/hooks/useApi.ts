import { useCallback } from 'react';
import { api } from '../utils/api';
import { useAuth } from './useAuth';
import type {
  Produto,
  Pedido,
  Avaliacao,
  Denuncia,
  Paginacao,
  LoginCredentials,
  RegisterData,
  Condominio,
  Notificacao,
  MeuCondominio,
  PedidoVinculo,
  DashboardVendas,
  Usuario,
} from '../types';
import { useCartStore } from '../store/cartStore';

export const useApi = () => {
  const { logout, login: setAuth } = useAuth();

  // Auth
  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await api.post<{ message: string; usuario: any; token: string }>(
      '/auth/login',
      credentials
    );
    await api.setToken(response.token);
    await api.setUser(response.usuario);
    if (response.usuario.condominioId) {
      await api.setCondominioId(response.usuario.condominioId);
    }
    await setAuth(response.usuario, response.token);
    return response;
  }, [setAuth]);

  const register = useCallback(async (data: RegisterData) => {
    const response = await api.post<{ message: string; usuario: any; token: string }>(
      '/auth/register',
      data
    );
    await api.setToken(response.token);
    await api.setUser(response.usuario);
    if (response.usuario.condominioId) {
      await api.setCondominioId(response.usuario.condominioId);
    }
    await setAuth(response.usuario, response.token);
    return response;
  }, [setAuth]);

  const logoutApi = useCallback(async () => {
    await api.removeToken();
    logout();
  }, [logout]);

  const getMe = useCallback(async () => {
    return api.get<{ usuario: any }>('/auth/me');
  }, []);

  const updateUsuario = useCallback(async (data: { nome?: string; unidade?: string }) => {
    return api.put<{ usuario: any }>('/usuarios/me', data);
  }, []);

  // Condomínios
  const getCondominios = useCallback(async () => {
    return api.get<{ condominios: Condominio[] }>('/condominios');
  }, []);

  // Condomínios do usuário (origem e vínculos) e troca do condomínio ativo
  const getMeusCondominios = useCallback(async () => {
    return api.get<{ condominioAtivoId: string; condominios: MeuCondominio[] }>('/vinculos');
  }, []);

  const pedirParticipacao = useCallback(async (data: { condominioId: string; unidade: string; querVender: boolean }) => {
    return api.post<{ message: string }>('/vinculos', data);
  }, []);

  // A API devolve um token novo com o outro condomínio ativo; o carrinho é esvaziado,
  // porque os produtos dele são do condomínio anterior
  const trocarCondominio = useCallback(async (condominioId: string) => {
    const response = await api.post<{ token: string; usuario: Usuario }>('/vinculos/trocar', { condominioId });
    await api.setToken(response.token);
    await api.setUser(response.usuario);
    await api.setCondominioId(response.usuario.condominioId);
    useCartStore.getState().clearCart();
    await setAuth(response.usuario, response.token);
    return response;
  }, [setAuth]);

  const getPedidosParticipacao = useCallback(async () => {
    return api.get<{ pedidos: PedidoVinculo[] }>('/vinculos/pendentes');
  }, []);

  const decidirParticipacao = useCallback(
    async (id: string, data: { aprovar: boolean; tipo?: 'COMPRADOR' | 'VENDEDOR'; justificativa?: string }) => {
      return api.patch<{ message: string }>(`/vinculos/${id}`, data);
    },
    []
  );

  // Dashboard de vendas do vendedor
  const getDashboardVendas = useCallback(async () => {
    return api.get<DashboardVendas>('/pedidos/dashboard');
  }, []);

  // Produtos
  const getProdutos = useCallback(async (params?: {
    pagina?: number;
    limite?: number;
    categoria?: string;
    status?: string;
    busca?: string;
  }) => {
    return api.get<Paginacao<Produto>>('/produtos', params);
  }, []);

  const getMeusProdutos = useCallback(async (params?: {
    pagina?: number;
    limite?: number;
    status?: string;
  }) => {
    return api.get<Paginacao<Produto>>('/produtos/meus', params);
  }, []);

  const getProduto = useCallback(async (id: string) => {
    return api.get<{ produto: Produto }>(`/produtos/${id}`);
  }, []);

  const createProduto = useCallback(async (data: CreateProdutoData) => {
    return api.post<{ produto: Produto }>('/produtos', data);
  }, []);

  const updateProduto = useCallback(async (id: string, data: UpdateProdutoData) => {
    return api.put<{ produto: Produto }>(`/produtos/${id}`, data);
  }, []);

  const updateProdutoStatus = useCallback(async (id: string, status: string) => {
    return api.patch<{ produto: Produto }>(`/produtos/${id}/status`, { status });
  }, []);

  const deleteProduto = useCallback(async (id: string) => {
    return api.delete<{ message: string }>(`/produtos/${id}`);
  }, []);

  // Pedidos
  const getPedidos = useCallback(async (params?: {
    pagina?: number;
    limite?: number;
    status?: string;
  }) => {
    return api.get<Paginacao<Pedido>>('/pedidos', params);
  }, []);

  const getPedido = useCallback(async (id: string) => {
    return api.get<{ pedido: Pedido }>(`/pedidos/${id}`);
  }, []);

  const createPedido = useCallback(async (data: CreatePedidoData) => {
    return api.post<{ pedido: Pedido }>('/pedidos', data);
  }, []);

  const updatePedidoStatus = useCallback(async (id: string, data: UpdatePedidoStatusData) => {
    return api.patch<{ pedido: Pedido }>(`/pedidos/${id}/status`, data);
  }, []);

  // Avaliações
  const getAvaliacoes = useCallback(async (params?: {
    pagina?: number;
    limite?: number;
    vendedorId?: string;
  }) => {
    return api.get<Paginacao<Avaliacao>>('/avaliacoes', params);
  }, []);

  const getAvaliacoesProduto = useCallback(async (produtoId: string) => {
    return api.get<{ media: number; total: number; avaliacoes: Avaliacao[] }>(
      `/avaliacoes/produto/${produtoId}`
    );
  }, []);

  const createAvaliacao = useCallback(async (data: CreateAvaliacaoData) => {
    return api.post<{ avaliacao: Avaliacao }>('/avaliacoes', data);
  }, []);

  // Remoção pelo síndico; a justificativa fica registrada na auditoria (RN02)
  const deleteAvaliacao = useCallback(async (pedidoId: string, justificativa: string) => {
    return api.delete<{ message: string }>(`/avaliacoes/${pedidoId}`, { justificativa });
  }, []);

  // Foto do produto (uma por produto, até 5 MB)
  const uploadImagemProduto = useCallback(async (produtoId: string, uri: string, tipo: string) => {
    return api.uploadImagemProduto<{ produto: Produto }>(produtoId, uri, tipo);
  }, []);

  // Notificações internas (avisos)
  const getNotificacoes = useCallback(async (params?: { pagina?: number; limite?: number; apenasNaoLidas?: boolean }) => {
    return api.get<Paginacao<Notificacao> & { notificacoes: Notificacao[]; naoLidas: number }>('/notificacoes', params);
  }, []);

  const marcarNotificacaoLida = useCallback(async (id: string) => {
    return api.patch<{ message: string }>(`/notificacoes/${id}/lida`);
  }, []);

  const marcarTodasNotificacoesLidas = useCallback(async () => {
    return api.patch<{ atualizadas: number }>('/notificacoes/lidas');
  }, []);

  // Denúncias
  const getDenuncias = useCallback(async (params?: {
    pagina?: number;
    limite?: number;
  }) => {
    return api.get<Paginacao<Denuncia>>('/denuncias', params);
  }, []);

  const getDenunciasProduto = useCallback(async (produtoId: string) => {
    return api.get<{ denuncias: Denuncia[] }>(`/denuncias/produto/${produtoId}`);
  }, []);

  const createDenuncia = useCallback(async (data: CreateDenunciaData) => {
    return api.post<{ denuncia: Denuncia }>('/denuncias', data);
  }, []);

  const updateDenunciaStatus = useCallback(
    async (produtoId: string, data: UpdateDenunciaStatusData) => {
      return api.patch<{ message: string; produto: Produto }>(
        `/denuncias/${produtoId}/quarentena`,
        data
      );
    },
    []
  );

  return {
    // Auth
    login,
    register,
    logout: logoutApi,
    getMe,
    updateUsuario,

    getCondominios,
    getMeusCondominios,
    pedirParticipacao,
    trocarCondominio,
    getPedidosParticipacao,
    decidirParticipacao,
    getDashboardVendas,

    // Produtos
    getProdutos,
    getMeusProdutos,
    getProduto,
    createProduto,
    updateProduto,
    updateProdutoStatus,
    deleteProduto,

    // Pedidos
    getPedidos,
    getPedido,
    createPedido,
    updatePedidoStatus,

    // Avaliações
    getAvaliacoes,
    getAvaliacoesProduto,
    createAvaliacao,
    deleteAvaliacao,

    // Foto do produto
    uploadImagemProduto,

    // Notificações
    getNotificacoes,
    marcarNotificacaoLida,
    marcarTodasNotificacoesLidas,

    // Denúncias
    getDenuncias,
    getDenunciasProduto,
    createDenuncia,
    updateDenunciaStatus,
  };
};

// Tipos para os dados de entrada
export interface CreateProdutoData {
  nome: string;
  descricao?: string;
  preco: number;
  categoria: string;
}

export interface UpdateProdutoData {
  nome?: string;
  descricao?: string;
  preco?: number;
  categoria?: string;
}

export interface CreatePedidoData {
  itens: Array<{
    produtoId: string;
    quantidade: number;
  }>;
  unidadeEntrega: string;
  tipoEntrega: 'PORTARIA' | 'UNIDADE' | 'COMBINAR';
  janelaHorario: string;
}

export interface UpdatePedidoStatusData {
  status: 'PENDENTE' | 'CONFIRMADO' | 'EM_PREPARO' | 'PRONTO_ENTREGA' | 'ENTREGUE' | 'CANCELADO';
}

export interface CreateAvaliacaoData {
  pedidoId: string;
  nota: number;
  comentario?: string;
}

export interface CreateDenunciaData {
  produtoId: string;
  motivo: string;
}

export interface UpdateDenunciaStatusData {
  acao: 'QUARENTENA' | 'RESTAURAR';
  justificativa?: string;
}