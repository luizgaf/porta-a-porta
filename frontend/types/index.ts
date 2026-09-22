export type TipoUsuario = 'COMPRADOR' | 'VENDEDOR' | 'SINDICO';

export type StatusProduto = 'ATIVO' | 'PAUSADO' | 'QUARENTENA' | 'EXCLUIDO';

export type StatusPedido = 'PENDENTE' | 'CONFIRMADO' | 'EM_PREPARO' | 'PRONTO_ENTREGA' | 'ENTREGUE' | 'CANCELADO';

export type TipoEntrega = 'PORTARIA' | 'UNIDADE' | 'COMBINAR';

export interface Usuario {
  id: string;
  condominioId: string;
  nome: string;
  email: string;
  unidade: string;
  tipo: TipoUsuario;
  pushToken?: string;
  criadoEm: string;
}

export interface Condominio {
  id: string;
  nome: string;
  endereco: string;
  criadoEm: string;
}

export interface Produto {
  id: string;
  condominioId: string;
  vendedorId: string;
  nome: string;
  descricao?: string;
  preco: number;
  categoria: string;
  status: StatusProduto;
  criadoEm: string;
  atualizadoEm: string;
  imagem_url?: string;
  media_avaliacoes?: number;
  total_avaliacoes?: number;
  vendedor?: {
    id: string;
    nome: string;
    unidade: string;
  };
}

export interface ItemPedido {
  id: string;
  pedidoId: string;
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
  produto?: Produto;
}

export interface Pedido {
  id: string;
  condominioId: string;
  compradorId: string;
  unidadeEntrega: string;
  tipoEntrega: TipoEntrega;
  janelaHorario: string;
  status: StatusPedido;
  valorTotal: number;
  criadoEm: string;
  atualizadoEm: string;
  itens: ItemPedido[];
  comprador?: {
    id: string;
    nome: string;
    unidade: string;
    email: string;
  };
  avaliacao?: Avaliacao;
}

export interface Avaliacao {
  id: string;
  pedidoId: string;
  compradorId: string;
  nota: number;
  comentario?: string;
  removidaPor?: string;
  criadoEm: string;
  comprador?: {
    id: string;
    nome: string;
    unidade: string;
  };
}

export interface Denuncia {
  id: string;
  produtoId: string;
  denuncianteId: string;
  motivo: string;
  criadoEm: string;
  produto?: {
    id: string;
    nome: string;
    status?: string;
  };
  denunciante?: {
    id: string;
    nome: string;
    unidade: string;
  };
}

export interface LogAuditoria {
  id: string;
  sindicoId: string;
  acao: string;
  entidadeId: string;
  justificativa?: string;
  criadoEm: string;
  sindico?: {
    id: string;
    nome: string;
    unidade: string;
  };
}

export interface PaginacaoResponse<T> {
  produtos?: T[];
  pedidos?: T[];
  denuncias?: T[];
  avaliacoes?: T[];
  data?: T[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
}

export interface Paginacao<T> {
  produtos?: T[];
  pedidos?: T[];
  denuncias?: T[];
  avaliacoes?: T[];
  data?: T[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
}

export interface AuthResponse {
  message: string;
  usuario: Usuario;
  token: string;
}

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface RegisterData {
  condominioId: string;
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  unidade: string;
  tipo: TipoUsuario;
}

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
  tipoEntrega: TipoEntrega;
  janelaHorario: string;
}

export interface UpdatePedidoStatusData {
  status: StatusPedido;
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