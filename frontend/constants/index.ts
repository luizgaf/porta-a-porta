export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:3000/api'
  : 'https://api.porta-a-porta.com/api';

export const STORAGE_KEYS = {
  TOKEN: '@porta_a_porta:token',
  USER: '@porta_a_porta:user',
  CONDOMINIO_ID: '@porta_a_porta:condominio_id',
} as const;

export type TipoUsuario = 'COMPRADOR' | 'VENDEDOR' | 'SINDICO';
export type TipoEntrega = 'PORTARIA' | 'UNIDADE' | 'COMBINAR';
export type StatusProduto = 'ATIVO' | 'PAUSADO' | 'QUARENTENA' | 'EXCLUIDO';
export type StatusPedido = 'PENDENTE' | 'CONFIRMADO' | 'EM_PREPARO' | 'PRONTO_ENTREGA' | 'ENTREGUE' | 'CANCELADO';

export const STATUS_LABELS: Record<string, string> = {
  // Produto
  ATIVO: 'Ativo',
  PAUSADO: 'Pausado',
  QUARENTENA: 'Quarentena',
  EXCLUIDO: 'Excluído',

  // Pedido
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  EM_PREPARO: 'Em Preparo',
  PRONTO_ENTREGA: 'Pronto para Entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',

  // Usuario
  COMPRADOR: 'Comprador',
  VENDEDOR: 'Vendedor',
  SINDICO: 'Síndico',
};

export const TIPO_ENTREGA_LABELS: Record<TipoEntrega, string> = {
  PORTARIA: 'Portaria',
  UNIDADE: 'Unidade',
  COMBINAR: 'Combinar',
};

export const CATEGORIAS = [
  'Alimentos',
  'Bebidas',
  'Limpeza',
  'Higiene',
  'Papelaria',
  'Eletrônicos',
  'Roupas',
  'Outros',
];

export const TABS = [
  { name: 'home', label: 'Início', icon: 'home' },
  { name: 'search', label: 'Buscar', icon: 'search' },
  { name: 'cart', label: 'Carrinho', icon: 'cart' },
  { name: 'orders', label: 'Pedidos', icon: 'list' },
  { name: 'profile', label: 'Perfil', icon: 'person' },
] as const;