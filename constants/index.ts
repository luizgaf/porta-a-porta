export const APP_CONFIG = {
  name: 'Porta a Porta',
  version: '1.0.0',
  supportEmail: 'suporte@portaaporta.com.br',
  termsUrl: 'https://portaaporta.com.br/termos',
  privacyUrl: 'https://portaaporta.com.br/privacidade',
};

export const STORAGE_KEYS = {
  auth: 'auth-storage',
  cart: 'cart-storage',
  userPreferences: 'user-preferences',
  recentSearches: 'recent-searches',
  onboardingComplete: 'onboarding-complete',
};

export const PAYMENT_METHODS = {
  pix: { label: 'PIX', icon: '🏦', color: '#34C759' },
  credit_card: { label: 'Cartão de crédito', icon: '💳', color: '#007AFF' },
  debit_card: { label: 'Cartão de débito', icon: '💳', color: '#BF5AF2' },
  cash: { label: 'Dinheiro', icon: '💵', color: '#FF9500' },
  mercado_pago: { label: 'Mercado Pago', icon: 'MP', color: '#009EE3' },
} as const;

export const ORDER_STATUS_CONFIG = {
  pending: { label: 'Pendente', color: '#FF9500', icon: 'time' },
  confirmed: { label: 'Confirmado', color: '#007AFF', icon: 'checkmark-circle' },
  preparing: { label: 'Preparando', color: '#BF5AF2', icon: 'restaurant' },
  ready: { label: 'Pronto', color: '#34C759', icon: 'checkmark-done' },
  out_for_delivery: { label: 'Saiu para entrega', color: '#007AFF', icon: 'bicycle' },
  delivered: { label: 'Entregue', color: '#34C759', icon: 'checkmark-done-circle' },
  cancelled: { label: 'Cancelado', color: '#FF3B30', icon: 'close-circle' },
  disputed: { label: 'Em disputa', color: '#FF9500', icon: 'alert-circle' },
} as const;

export const USER_ROLES = {
  customer: { label: 'Cliente', color: '#007AFF' },
  seller: { label: 'Vendedor', color: '#34C759' },
  moderator: { label: 'Moderador', color: '#FF9500' },
} as const;

export const CATEGORIES = [
  { id: 'all', name: 'Todos', icon: 'restaurant' },
  { id: 'pizza', name: 'Pizza', icon: 'pizza' },
  { id: 'burger', name: 'Hambúrguer', icon: 'fast-food' },
  { id: 'japanese', name: 'Japonês', icon: 'fish' },
  { id: 'italian', name: 'Italiano', icon: 'wine' },
  { id: 'brazilian', name: 'Brasileiro', icon: 'leaf' },
  { id: 'healthy', name: 'Saudável', icon: 'fitness' },
  { id: 'dessert', name: 'Doces', icon: 'ice-cream' },
  { id: 'drinks', name: 'Bebidas', icon: 'wine' },
];

export const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export const CURRENCY_FORMAT = {
  locale: 'pt-BR',
  currency: 'BRL',
};

export const DATE_FORMAT = {
  locale: 'pt-BR',
  dateStyle: 'short' as const,
  timeStyle: 'short' as const,
};