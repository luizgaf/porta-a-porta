import type { Decimal } from '../utils/format';

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
  criadoEm: string;
  // condominioId é o condomínio ativo; o de origem é o do cadastro
  condominioOrigemId?: string;
  condominioNome?: string;
}

// Condomínios do usuário: o de origem e os vínculos com outros condomínios
export type StatusVinculo = 'PENDENTE' | 'APROVADO' | 'RECUSADO';

export interface MeuCondominio {
  id?: string;
  condominio: { id: string; nome: string; endereco: string };
  unidade: string;
  tipo: TipoUsuario;
  status: StatusVinculo;
  origem: boolean;
}

// Pedido de participação visto pelo síndico
export interface PedidoVinculo {
  id: string;
  nome: string;
  condominioOrigem: string;
  unidade: string;
  tipoSolicitado: TipoUsuario;
  criadoEm: string;
}

// Resumo de vendas do vendedor no condomínio ativo
export interface DashboardVendas {
  totais: {
    vendido: number;
    emAndamento: number;
    pedidos: number;
    ticketMedio: number;
    itensVendidos: number;
    produtosAtivos: number;
    limiteProdutosAtivos: number;
  };
  porStatus: { status: string; quantidade: number }[];
  maisVendidos: { produtoId: string; nome: string; quantidade: number; valor: number }[];
  ultimosMeses: { mes: string; valor: number; pedidos: number }[];
  ultimosPedidos: {
    id: string;
    status: string;
    criadoEm: string;
    unidadeEntrega: string;
    janelaHorario: string;
    valor: number;
    itens: number;
  }[];
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
  preco: Decimal;
  categoria: string;
  status: StatusProduto;
  criadoEm: string;
  atualizadoEm: string;
  imagemUrl?: string | null;
  // Só vem para o síndico e para o vendedor dono, quando o anúncio está em quarentena
  quarentena?: { motivo: string; porSindico: boolean; data: string | null };
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
  precoUnitario: Decimal;
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
  valorTotal: Decimal;
  criadoEm: string;
  atualizadoEm: string;
  itens: ItemPedido[];
  comprador?: {
    id: string;
    nome: string;
    unidade: string;
  };
  avaliacao?: Avaliacao;
}

export interface Avaliacao {
  id: string;
  pedidoId: string;
  compradorId: string;
  nota: number;
  comentario?: string;
  removidaPor?: string | null;
  criadoEm: string;
  // A identidade do avaliador não é exibida a ninguém (RN02); só o nome dos produtos avaliados
  pedido?: {
    id: string;
    itens: Array<{ produto?: { id: string; nome: string; vendedorId: string } }>;
  };
}

export interface Denuncia {
  id: string;
  produtoId: string;
  // A API só devolve a identificação ao próprio autor, na criação da denúncia (RN02)
  denuncianteId?: string;
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

// Aviso interno exibido no aplicativo (RNF01)
export type TipoNotificacao =
  | 'NOVO_PEDIDO'
  | 'STATUS_PEDIDO'
  | 'PEDIDO_CANCELADO'
  | 'ANUNCIO_QUARENTENA'
  | 'ANUNCIO_RESTAURADO'
  | 'DENUNCIA_PARA_ANALISE'
  | 'PEDIDO_VINCULO'
  | 'VINCULO_APROVADO'
  | 'VINCULO_RECUSADO';

export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  mensagem: string;
  entidadeTipo?: 'PEDIDO' | 'PRODUTO' | 'VINCULO' | null;
  entidadeId?: string | null;
  lida: boolean;
  criadoEm: string;
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
  error?: string;
  message?: string;
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

export interface CreateDenunciaData {
  produtoId: string;
  motivo: string;
}

export interface UpdateDenunciaStatusData {
  acao: 'QUARENTENA' | 'RESTAURAR';
  justificativa?: string;
}