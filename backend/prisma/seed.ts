import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const senhaHash = async (senha: string) => bcrypt.hash(senha, 10);

const prisma = new PrismaClient();

async function main() {
  // Condomínios de exemplo (10)
  const condominios = await Promise.all(
    Array.from({ length: 10 }).map(async (_, i) => {
      const num = i + 1;
      const nome = `Condomínio Porta a Porta ${num}`;
      const endereco =
        [
          'Rua das Flores',
          'Rua das Árvores',
          'Rua do Sol',
          'Rua da Lua',
          'Rua das Estrelas',
          'Rua do Vento',
          'Rua da Montanha',
          'Rua do Rio',
          'Rua do Mar',
          'Rua do Campo',
        ][i] + ` - ${num * 100}, Bairro Jardim Primavera, Cidade ${num}`;

      return await prisma.condominio.upsert({
        where: { id: `seed-cond-${num}` },
        update: { nome, endereco },
        create: { id: `seed-cond-${num}`, nome, endereco },
      });
    })
  );

  // Síndico para cada condomínio
  const senhaHash = await bcrypt.hash('sindico123', 10);
  const usuarios: { condominioId: string; email: string; nome: string; unidade: string }[] =
    [];

  for (let i = 0; i < condominios.length; i++) {
    const num = i + 1;
    const email = `sindico${num}@porta-a-porta.com`;
    const nome = `Síndico ${num}`;
    const unidade = `Sala ${num}`;
    const cpf = `111.111.1${num.toString().padStart(2, '0')}`.replace(/\./g, '');

    usuarios.push({ condominioId: condominios[i].id, email, nome, unidade });

    await prisma.usuario.upsert({
      where: { email },
      update: {
        nome,
        senhaHash,
        unidade,
        tipo: 'SINDICO',
        condominioId: condominios[i].id,
      },
      create: {
        email,
        nome,
        senhaHash,
        cpf,
        unidade,
        tipo: 'SINDICO',
        condominioId: condominios[i].id,
      },
    });
  }

  // Comprador e vendedor para o primeiro condomínio
  const compradorSenha = await bcrypt.hash('comprador123', 10);
  const vendedorSenha = await bcrypt.hash('vendedor123', 10);

  await prisma.usuario.upsert({
    where: { email: 'comprador1@porta-a-porta.com' },
    update: {},
    create: {
      email: 'comprador1@porta-a-porta.com',
      nome: 'João Comprador',
      senhaHash: compradorSenha,
      cpf: '11111111101',
      unidade: 'Apto 101',
      tipo: 'COMPRADOR',
      condominioId: condominios[0].id,
    },
  });

  await prisma.usuario.upsert({
    where: { email: 'vendedor1@porta-a-porta.com' },
    update: {},
    create: {
      email: 'vendedor1@porta-a-porta.com',
      nome: 'Maria Vendedora',
      senhaHash: vendedorSenha,
      cpf: '11111111102',
      unidade: 'Apto 202',
      tipo: 'VENDEDOR',
      condominioId: condominios[0].id,
    },
  });

  // Produtos de teste para o vendedor1 no condomínio 1
  const produtos = [
    {
      nome: 'Café Torrado Especia',
      descricao: 'Café torrado especial 500g - sachê de papel',
      preco: 18.5,
      categoria: 'Bebidas',
      status: 'ATIVO',
      vendedorId: 0, // updated below
      condominioId: condominios[0].id,
    },
    {
      nome: 'Bolacha de Amendoim',
      descricao: 'Bolacha amanteigada crocante 400g',
      preco: 12.0,
      categoria: 'Doces & Salgados',
      status: 'ATIVO',
      vendedorId: 0,
      condominioId: condominios[0].id,
    },
    {
      nome: 'Manteiga de Amendoim',
      descricao: 'Manteiga de amendoim natural sem açúcar 300g',
      preco: 22.0,
      categoria: 'Produtos Naturais',
      status: 'ATIVO',
      vendedorId: 0,
      condominioId: condominios[0].id,
    },
    {
      nome: 'Leite Condensado',
      descricao: 'Leite condensado 397g',
      preco: 8.5,
      categoria: 'Básicos',
      status: 'PAUSADO',
      vendedorId: 0,
      condominioId: condominios[0].id,
    },
    {
      nome: 'Açaí na Tigela',
      descricao: 'Açaí 500ml na tigela com coberturas',
      preco: 15.0,
      categoria: 'Bebidas',
      status: 'ATIVO',
      vendedorId: 0,
      condominioId: condominios[0].id,
    },
  ];

  // Get vendedor1 ID
  const vendedor = await prisma.usuario.findUnique({
    where: { email: 'vendedor1@porta-a-porta.com' },
  });

  for (const produto of produtos) {
    await prisma.produto.upsert({
      where: { id: `seed-prod-${produto.nome}` },
      update: {
        nome: produto.nome,
        descricao: produto.descricao,
        preco: produto.preco,
        categoria: produto.categoria,
        status: produto.status,
      },
      create: {
        id: `seed-prod-${produto.nome.toLowerCase().replace(/\s+/g, '-')}`,
        nome: produto.nome,
        descricao: produto.descricao,
        preco: produto.preco,
        categoria: produto.categoria,
        status: produto.status,
        vendedorId: vendedor!.id,
        condominioId: produto.condominioId,
      },
    });
  }

  console.log('✅ Seed concluído:');
  console.log(`   - ${condominios.length} condomínios criados`);
  console.log(`   - ${condominios.length} síndicos criados`);
  console.log('   - 1 comprador criado (comprador1@porta-a-porta.com / comprador123)');
  console.log('   - 1 vendedor criado (vendedor1@porta-a-porta.com / vendedor123)');
  console.log(`   - Síndico 1: sindico1@porta-a-porta.com / sindico123`);
  console.log(`   - ${produtos.length} produtos criados`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
