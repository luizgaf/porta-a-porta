import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined;

export const API_BASE_URL = __DEV__
  ? (extra?.apiBaseUrl ?? 'http://localhost:3000/api')
  : 'https://api.porta-a-porta.com/api';

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

// Texto dos botões que levam o pedido ao próximo status
export const ACAO_STATUS_LABELS: Record<StatusPedido, string> = {
  PENDENTE: 'Voltar para Pendente',
  CONFIRMADO: 'Confirmar',
  EM_PREPARO: 'Iniciar Preparo',
  PRONTO_ENTREGA: 'Marcar como Pronto',
  ENTREGUE: 'Marcar como Entregue',
  CANCELADO: 'Cancelar Pedido',
};

export const TIPO_ENTREGA_LABELS: Record<TipoEntrega, string> = {
  PORTARIA: 'Portaria',
  UNIDADE: 'Unidade',
  COMBINAR: 'Combinar',
};

export const CATEGORIAS = [
  'Padaria',
  'Doces & Salgados',
  'Bebidas',
  'Laticínios',
  'Frutas & Horti',
  'Ovos & Carnes',
  'Básicos',
  'Produtos Naturais',
  'Limpeza',
  'Higiene',
  'Papelaria',
  'Roupas',
  'Eletrônicos',
  'Outros',
];

export const TABS = [
  { name: 'home', label: 'Início', icon: 'home' },
  { name: 'search', label: 'Buscar', icon: 'search' },
  { name: 'cart', label: 'Carrinho', icon: 'cart' },
  { name: 'orders', label: 'Pedidos', icon: 'list' },
  { name: 'profile', label: 'Perfil', icon: 'person' },
] as const;