// Dados fixos usados nos testes

export const CONDOMINIO_A = '11111111-1111-4111-8111-111111111111';
export const CONDOMINIO_B = '22222222-2222-4222-8222-222222222222';

export const PRODUTO_1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
export const PRODUTO_2 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2';
export const PEDIDO_1 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';

type Tipo = 'COMPRADOR' | 'VENDEDOR' | 'SINDICO';

const usuario = (id: string, nome: string, unidade: string, tipo: Tipo, condominioId = CONDOMINIO_A) => ({
  id,
  condominioId,
  nome,
  email: `${nome.toLowerCase().replace(/\s+/g, '.')}@teste.com`,
  unidade,
  tipo,
});

export const vendedor = usuario('cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 'Maria Vendedora', 'Apto 202', 'VENDEDOR');
export const comprador = usuario('cccccccc-cccc-4ccc-8ccc-ccccccccccc2', 'Joao Comprador', 'Apto 101', 'COMPRADOR');
export const comprador2 = usuario('cccccccc-cccc-4ccc-8ccc-ccccccccccc3', 'Ana Compradora', 'Apto 303', 'COMPRADOR');
export const comprador3 = usuario('cccccccc-cccc-4ccc-8ccc-ccccccccccc4', 'Pedro Comprador', 'Apto 404', 'COMPRADOR');
export const sindico = usuario('cccccccc-cccc-4ccc-8ccc-ccccccccccc5', 'Carlos Sindico', 'Sala 1', 'SINDICO');

export type UsuarioTeste = typeof vendedor;
