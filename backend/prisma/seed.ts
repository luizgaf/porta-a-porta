import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { pastaDeImagens, extensaoPelaAssinatura, TAMANHO_MAXIMO_IMAGEM, PREFIXO_URL_IMAGENS } from '../src/services/imagens';

// Fotos padrão dos produtos de teste: prisma/seed-images/<nome-do-produto>.jpg (ver o README da pasta)
const PASTA_FOTOS_SEED = path.join(__dirname, 'seed-images');

// "Pão de Queijo" -> "pao-de-queijo"
const nomeDoArquivo = (nomeProduto: string) =>
  nomeProduto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// Copia a foto do produto para a pasta de uploads e devolve a URL, ou null se não houver foto válida
const copiarFotoSeed = (nomeProduto: string): string | null => {
  const base = nomeDoArquivo(nomeProduto);
  const arquivo = ['jpg', 'jpeg', 'png', 'webp']
    .map((ext) => path.join(PASTA_FOTOS_SEED, `${base}.${ext}`))
    .find((caminho) => fs.existsSync(caminho));
  if (!arquivo) return null;

  const conteudo = fs.readFileSync(arquivo);
  const extensao = extensaoPelaAssinatura(conteudo);
  if (!extensao || conteudo.length > TAMANHO_MAXIMO_IMAGEM) {
    console.warn(`⚠️  Foto ignorada (precisa ser JPEG, PNG ou WebP de até 5 MB): ${path.basename(arquivo)}`);
    return null;
  }

  // Nome fixo, para não acumular cópias quando o seed roda de novo
  const destino = `seed-${base}.${extensao}`;
  fs.mkdirSync(pastaDeImagens(), { recursive: true });
  fs.writeFileSync(path.join(pastaDeImagens(), destino), conteudo);
  return `${PREFIXO_URL_IMAGENS}/${destino}`;
};

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

  // Cria ou atualiza um usuário de teste. Procura pelo CPF e depois pelo e-mail, para também
  // corrigir bancos criados por versões antigas do seed (mesmo CPF com outro e-mail, ou o contrário).
  // E-mail, senha e demais dados sempre voltam aos valores documentados.
  type UsuarioSeed = {
    cpf: string;
    email: string;
    nome: string;
    senhaHash: string;
    unidade: string;
    tipo: 'SINDICO' | 'COMPRADOR' | 'VENDEDOR';
    condominioId: string;
  };

  const garantirUsuario = async (dados: UsuarioSeed) => {
    const existente =
      (await prisma.usuario.findUnique({ where: { cpf: dados.cpf } })) ??
      (await prisma.usuario.findUnique({ where: { email: dados.email } }));

    if (existente) {
      await prisma.usuario.update({ where: { id: existente.id }, data: dados });
    } else {
      await prisma.usuario.create({ data: dados });
    }
  };

  // Síndico para cada condomínio
  const senhaHash = await bcrypt.hash('sindico123', 10);
  const usuarios: { condominioId: string; email: string; nome: string; unidade: string }[] =
    [];

  for (let i = 0; i < condominios.length; i++) {
    const num = i + 1;
    const email = `sindico${num}@pap.com`;
    const nome = `Síndico ${num}`;
    const unidade = `Sala ${num}`;
    const cpf = `111.111.1${num.toString().padStart(2, '0')}`.replace(/\./g, '');

    usuarios.push({ condominioId: condominios[i].id, email, nome, unidade });

    await garantirUsuario({
      cpf,
      email,
      nome,
      senhaHash,
      unidade,
      tipo: 'SINDICO',
      condominioId: condominios[i].id,
    });
  }

  // Comprador e vendedor para o primeiro condomínio
  const compradorSenha = await bcrypt.hash('comprador123', 10);
  const vendedorSenha = await bcrypt.hash('vendedor123', 10);

  await garantirUsuario({
    cpf: '11111111101',
    email: 'comprador1@pap.com',
    nome: 'João Comprador',
    senhaHash: compradorSenha,
    unidade: 'Apto 101',
    tipo: 'COMPRADOR',
    condominioId: condominios[0].id,
  });

  await garantirUsuario({
    cpf: '11111111102',
    email: 'vendedor1@pap.com',
    nome: 'Maria Vendedora',
    senhaHash: vendedorSenha,
    unidade: 'Apto 202',
    tipo: 'VENDEDOR',
    condominioId: condominios[0].id,
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
    {
      nome: 'Pão Francês',
      descricao: 'Pão francês fresco - pacote com 6 unidades',
      preco: 9.5,
      categoria: 'Padaria',
      status: 'ATIVO',
      vendedorId: 0,
      condominioId: condominios[0].id,
    },
    {
      nome: 'Ovos de Codornin',
      descricao: 'Ovos de codornin frescos - bandejada com 15 unidades',
      preco: 28.0,
      categoria: 'Ovos & Carnes',
      status: 'ATIVO',
      vendedorId: 0,
      condominioId: condominios[0].id,
    },
    {
      nome: 'Queijo Minas Frescal',
      descricao: 'Queijo minas frescal artesanal 500g',
      preco: 16.0,
      categoria: 'Laticínios',
      status: 'ATIVO',
      vendedorId: 0,
      condominioId: condominios[0].id,
    },
    {
      nome: 'Creme de Leite',
      descricao: 'Creme de leite líquido 200ml',
      preco: 5.5,
      categoria: 'Básicos',
      status: 'ATIVO',
      vendedorId: 0,
      condominioId: condominios[0].id,
    },
    {
      nome: 'Banana Prata',
      descricao: 'Banana prata fresca - kilo',
      preco: 6.0,
      categoria: 'Frutas & Horti',
      status: 'ATIVO',
      vendedorId: 0,
      condominioId: condominios[0].id,
    },
    {
      nome: 'Feijão Carioca',
      descricao: 'Feijão carioca 1kg - grão inteiro',
      preco: 11.0,
      categoria: 'Básicos',
      status: 'PAUSADO',
      vendedorId: 0,
      condominioId: condominios[0].id,
    },
    {
      nome: 'Brigadeiro de Colher',
      descricao: 'Brigadeiro de colher caseiro 300g',
      preco: 14.0,
      categoria: 'Doces & Salgados',
      status: 'ATIVO',
      vendedorId: 0,
      condominioId: condominios[0].id,
    },
    {
      nome: 'Suco de Laranja Natural',
      descricao: 'Suco de laranja natural 500ml - sem adição de açúcar',
      preco: 12.0,
      categoria: 'Bebidas',
      status: 'ATIVO',
      vendedorId: 0,
      condominioId: condominios[0].id,
    },
    {
      nome: 'Pão de Queijo',
      descricao: 'Pão de queijo mineiro - unidade',
      preco: 3.5,
      categoria: 'Padaria',
      status: 'ATIVO',
      vendedorId: 0,
      condominioId: condominios[0].id,
    },
    {
      nome: 'Café da Manhã Completo',
      descricao: 'Café da manhã: pão francês, manteiga, geleia, café - porção única',
      preco: 18.0,
      categoria: 'Doces & Salgados',
      status: 'QUARENTENA',
      vendedorId: 0,
      condominioId: condominios[0].id,
    },
  ];

  // Get vendedor1 ID
  const vendedor = await prisma.usuario.findUnique({
    where: { email: 'vendedor1@pap.com' },
  });

  let fotos = 0;
  for (const produto of produtos) {
    // O mesmo id no where e no create, para o seed poder ser executado mais de uma vez
    const id = `seed-prod-${produto.nome.toLowerCase().replace(/\s+/g, '-')}`;

    // Usa a foto padrão, sem substituir uma foto que o vendedor já tenha enviado pelo app
    const fotoSeed = copiarFotoSeed(produto.nome);
    const atual = await prisma.produto.findUnique({ where: { id }, select: { imagemUrl: true } });
    const podeTrocarFoto = !atual?.imagemUrl || atual.imagemUrl.startsWith(`${PREFIXO_URL_IMAGENS}/seed-`);
    const imagemUrl = fotoSeed && podeTrocarFoto ? fotoSeed : undefined;
    if (imagemUrl) fotos++;

    await prisma.produto.upsert({
      where: { id },
      update: {
        nome: produto.nome,
        descricao: produto.descricao,
        preco: produto.preco,
        categoria: produto.categoria,
        status: produto.status,
        ...(imagemUrl ? { imagemUrl } : {}),
      },
      create: {
        id,
        imagemUrl,
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
  console.log('   - 1 comprador criado (comprador1@pap.com / comprador123)');
  console.log('   - 1 vendedor criado (vendedor1@pap.com / vendedor123)');
  console.log(`   - Síndico 1: sindico1@pap.com / sindico123`);
  console.log(`   - ${produtos.length} produtos criados (${fotos} com foto padrão)`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
