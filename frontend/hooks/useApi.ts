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
} from '../types';

export const useApi = () => {
  const { token, logout } = useAuth();

  // Auth
  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await api.post<{ message: string; usuario: any; token: string }>(
      '/auth/login',
      credentials
    );
    await api.setToken(response.token);
    return response;
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const response = await api.post<{ message: string; usuario: any; token: string }>(
      '/auth/register',
      data
    );
    await api.setToken(response.token);
    return response;
  }, []);

  const logoutApi = useCallback(async () => {
    await api.removeToken();
    logout();
  }, [logout]);

  const getMe = useCallback(async () => {
    return api.get<{ usuario: any }>('/auth/me');
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

  const updateAvaliacao = useCallback(async (pedidoId: string, data: UpdateAvaliacaoData) => {
    return api.put<{ avaliacao: Avaliacao }>(`/avaliacoes/${pedidoId}`, data);
  }, []);

  const deleteAvaliacao = useCallback(async (pedidoId: string) => {
    return api.delete<{ message: string }>(`/avaliacoes/${pedidoId}`);
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
    updateAvaliacao,
    deleteAvaliacao,

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

export interface UpdateAvaliacaoData {
  nota?: number;
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