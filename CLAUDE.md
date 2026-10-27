# Porta a Porta - Documentação do Projeto

## Visão Geral
Sistema móvel para organizar comércio interno em condomínios residenciais. Vitrine digital segura com carrinho, pedidos vinculados à unidade e moderação.

**Stack:** React Native (Expo) + TypeScript | Node.js/Express + TypeScript | PostgreSQL + Prisma ORM

---

## Estado Atual (Tasks 1-7 Concluídas)

### Backend (/backend)
- ✅ **Task 1**: Projeto Node.js + TypeScript + Express + Prisma ORM configurado
- ✅ **Task 2**: Autenticação JWT completa (Register, Login, Me) + Middleware auth com roles
- ✅ **Task 3**: CRUD de Produtos com RN01 (limite 15 ativos/vendedor) + listagem pública
- ✅ **Task 4**: Sistema de Pedidos completo (cálculo backend, transações, máquina de estados)
- ✅ **Task 5**: Denúncias e Moderação — Auto-quarentena 3+ denúncias + Auditoria do síndico
- ✅ **Task 6**: Avaliações — 1-5 estrelas pós-entrega, síndico remove
- ✅ **Task 7**: Auditoria — Logs de ações do síndico

### Estrutura do Banco (schema.prisma)
```
Condominio (id, nome, endereco, criado_em)
Usuario (id, condominio_id, nome, cpf, email, senha_hash, unidade, tipo, foto_url)
Produto (id, condominio_id, vendedor_id, nome, descricao, preco, categoria, status)
Pedido (id, condominio_id, comprador_id, unidade_entrega, tipo_entrega, janela_horario, status, valor_total)
ItemPedido (id, pedido_id, produto_id, quantidade, preco_unitario)
Denuncia (id, produto_id, denunciante_id, motivo) — UNIQUE(produto_id, denunciante_id)
Avaliacao (id, pedido_id, comprador_id, nota, comentario, removida_por) — UNIQUE(pedido_id)
LogAuditoria (id, sindico_id, acao, entidade_id, justificativa)
Notificacao (id, condominio_id, usuario_id, tipo, mensagem, entidade_tipo, entidade_id, lida)
Vinculo (id, usuario_id, condominio_id, unidade, tipo_solicitado, tipo, status, decidido_por, decidido_em) — UNIQUE(usuario_id, condominio_id)
Sancao (id, usuario_id, condominio_id, sindico_id, tipo ADVERTENCIA|SUSPENSAO|BANIMENTO, motivo, ate, revogada_em, revogada_por)
Produto.imagem_url — foto do produto guardada no servidor (pasta backend/uploads, servida em /uploads)
```

### Perfis (com herança, em `backend/src/middleware/auth.ts` e `frontend/store/authStore.ts`)
- COMPRADOR: compra, avalia e denuncia
- VENDEDOR extends COMPRADOR: também anuncia e atende pedidos
- SINDICO extends VENDEDOR: também modera (denúncias, quarentena, avaliações, auditoria)
- `requireRole('COMPRADOR')` aceita os três perfis. Ninguém compra o próprio produto (400 `PRODUTO_PROPRIO`)
- Pedidos: cada usuário vê os pedidos em que é comprador ou vendedor; quem vende conduz o status e quem comprou só cancela

### Vários condomínios (vínculos)
- `Usuario.condominioId` é o condomínio de origem (cadastro). O token traz o **condomínio ativo**
- Para participar de outro condomínio, o usuário pede (unidade + se quer vender); o síndico de lá aprova definindo o perfil (COMPRADOR ou VENDEDOR) ou recusa com motivo. Decisões vão para LogAuditoria (`APROVAR_VINCULO`/`RECUSAR_VINCULO`)
- No authMiddleware, se o condomínio ativo não é o de origem, valem a unidade e o perfil do vínculo aprovado; sem vínculo aprovado, 403 `VINCULO_INVALIDO` (RNF02)
- Todas as rotas continuam usando `req.user.condominioId` (ativo). RN01 (15 ativos) vale por condomínio
- Anúncios e pedidos mostram a unidade do vínculo de quem é de outro condomínio (`services/unidades.ts`)

### Enums
- `TipoUsuario`: COMPRADOR, VENDEDOR, SINDICO
- `StatusProduto`: ATIVO, PAUSADO, QUARENTENA, EXCLUIDO
- `StatusPedido`: PENDENTE, CONFIRMADO, EM_PREPARO, PRONTO_ENTREGA, ENTREGUE, CANCELADO
- `TipoEntrega`: PORTARIA, UNIDADE, COMBINAR

### Regras de Negócio Implementadas
- **RN01**: Máx. 15 produtos ATIVOS por vendedor (validado na criação e ativação)
- **RN02**: `valor_total` do pedido calculado no backend (preço atual do banco)
- **RN03**: Preço congelado no `ItemPedido.precoUnitario` no momento do pedido
- **RN04**: Transição de status do pedido validada (máquina de estados)
- **RN05**: Auto-quarentena de produto com 3+ denúncias distintas
- **Quarentena**: anúncio em quarentena só aparece para o síndico e para o vendedor dono, com `produto.quarentena = { motivo, porSindico, data, denuncias }` (motivo da última decisão do síndico ou "Muitas denúncias: produto sob análise do síndico." na suspensão automática; `denuncias` = motivos das denúncias, sem identificação). Só o síndico tira da quarentena; para colocar um anúncio ativo em quarentena o motivo é obrigatório, para manter um que já está em quarentena é opcional
- **Multitenancy**: `condominio_id` em todas as entidades + isolamento via token JWT

---

## Scripts Backend
```bash
cd backend
npm run dev          # Desenvolvimento (tsx watch)
npm run build        # Compilar (tsc)
npm run start        # Produção (node dist/index.js)
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

---

## API Endpoints Resumo

### Auth
- `POST /api/auth/register` — Registro (condominio_id, unidade obrigatórios)
- `POST /api/auth/login` — Login → JWT
- `GET /api/auth/me` — Perfil do usuário logado

### Produtos
- `POST /api/produtos` — Criar (VENDEDOR, valida RN01)
- `GET /api/produtos` — Listar ATIVOS/PAUSADOS (filtro categoria, busca)
- `GET /api/produtos/meus` — Meus produtos (VENDEDOR)
- `GET /api/produtos/:id` — Detalhes
- `PUT /api/produtos/:id` — Atualizar (dono/SINDICO)
- `PATCH /api/produtos/:id/status` — Alterar status (valida RN01 ao ativar)
- `DELETE /api/produtos/:id` — Soft delete (status=EXCLUIDO)

### Pedidos
- `POST /api/pedidos` — Criar (COMPRADOR, calcula valor_total no backend)
- `GET /api/pedidos` — Listar (filtrado por role: comprador/vendedor/síndico)
- `GET /api/pedidos/:id` — Detalhes
- `PATCH /api/pedidos/:id/status` — Atualizar status (máquina de estados validada)

### Denúncias (Task 5)
- `POST /api/denuncias` — Criar denúncia (auto-quarentena se ≥3)
- `GET /api/denuncias` — Listar, sem identificação do denunciante (SINDICO)
- `GET /api/denuncias/produto/:produtoId` — Ver denúncias do produto, sem identificação do denunciante (SINDICO, LogAuditoria)
- `PATCH /api/denuncias/:produtoId/quarentena` — Aplicar/restaurar quarentena (SINDICO, LogAuditoria)

### Avaliações (Task 6)
- `POST /api/avaliacoes` — Criar (COMPRADOR, pedido ENTREGUE)
- `GET /api/avaliacoes` — Listar (VENDEDOR/SINDICO)
- `GET /api/avaliacoes/produto/:produtoId` — Média por produto
- `PUT /api/avaliacoes/:pedidoId` — Edição bloqueada (403): avaliações são definitivas
- `DELETE /api/avaliacoes/:pedidoId` — Remover (SINDICO), corpo `{ justificativa }` obrigatório; grava LogAuditoria `REMOVER_AVALIACAO`
- Respostas de avaliação nunca identificam o avaliador; o vendedor não recebe nem o pedidoId (RN02)

### Vínculos com outros condomínios
- `GET /api/vinculos` — Condomínios do usuário (origem + vínculos) e o ativo
- `POST /api/vinculos` — Pedir para participar `{ condominioId, unidade, querVender }` (avisa os síndicos de lá)
- `POST /api/vinculos/trocar` — `{ condominioId }` → token novo com o condomínio ativo trocado
- `GET /api/vinculos/pendentes` — Pedidos pendentes do condomínio (SINDICO)
- `PATCH /api/vinculos/:id` — `{ aprovar, tipo?, justificativa? }` (SINDICO; motivo obrigatório na recusa)

### Usuários: foto de perfil e painel do síndico
- `PUT /api/usuarios/me/foto` — Foto de perfil (multipart `foto` ou arquivo no corpo; JPEG/PNG/WebP até 5 MB). `DELETE /api/usuarios/me/foto` remove
- `GET /api/usuarios/painel` — SINDICO: resumo (total, novos em 30 dias, por perfil, suspensos, banidos, advertidos, pedidos de participação) e lista de moradores e participantes do condomínio ativo, sem e-mail/CPF
- `GET /api/usuarios/:id/sancoes` — Histórico de sanções no condomínio (SINDICO)
- `POST /api/usuarios/:id/sancoes` — `{ tipo: ADVERTENCIA|SUSPENSAO|BANIMENTO, motivo, dias? }` (SINDICO; dias 1-90 na suspensão). Suspensão e banimento pausam os anúncios ativos do usuário naquele condomínio; LogAuditoria `ADVERTIR_USUARIO`/`SUSPENDER_USUARIO`/`BANIR_USUARIO`; aviso ao usuário
- `POST /api/usuarios/:id/reativar` — Encerra suspensão/banimento (SINDICO; LogAuditoria `REATIVAR_USUARIO`)
- Não vale contra o próprio síndico nem contra outro síndico. Suspenso/banido recebe 403 `USUARIO_SUSPENSO`/`USUARIO_BANIDO` em qualquer chamada àquele condomínio e no login (condomínio de origem); o app encerra a sessão e mostra o motivo
- Fotos (produto e perfil) são enviadas pelo app como multipart/form-data (`api.enviarFoto`), sem `fetch(uri).blob()`

### Dashboard de vendas
- `GET /api/pedidos/dashboard` — VENDEDOR: total vendido (entregues), em andamento, pedidos por status, mais vendidos, últimos 6 meses e últimos pedidos, no condomínio ativo, somando só os itens do vendedor

### Auditoria (Task 7)
- `POST /api/auditoria` — Registrar log (SINDICO)
- `GET /api/auditoria` — Listar logs (SINDICO)

### Foto do produto
- `PUT /api/produtos/:id/imagem` — Corpo = arquivo (image/jpeg, image/png ou image/webp, até 5 MB - RNF05). Dono ou SINDICO. 415 se não for imagem, 413 se passar do limite

### Notificações internas (avisos, sem push)
- `GET /api/notificacoes` — Avisos do usuário logado + `naoLidas` (query `apenasNaoLidas=true`)
- `PATCH /api/notificacoes/:id/lida` — Marca um aviso como lido (só os próprios)
- `PATCH /api/notificacoes/lidas` — Marca todos como lidos
- Gerados em: novo pedido (vendedor), mudança de status (comprador; vendedor se o comprador cancelar), quarentena automática (síndico e vendedor), decisão do síndico na quarentena (vendedor), pedido de participação (síndicos do condomínio pedido) e decisão sobre ele (no condomínio de origem do usuário)

---

## Frontend (/frontend) — Task 8 Concluída

### Stack Frontend
- Expo Router (file-based routing)
- React Native + TypeScript
- Zustand (state management) + AsyncStorage
- Axios com interceptors JWT
- @expo/vector-icons (Ionicons)

### Estrutura de Pastas
```
frontend/
├── app/
│   ├── _layout.tsx                 # Root layout com Providers
│   ├── (auth)/                     # Auth stack (não autenticado)
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx             # Boas-vindas
│   │   ├── login.tsx               # Login
│   │   ├── register.tsx            # Cadastro
│   │   ├── role-selection.tsx      # Seleção de papel
│   │   └── community-selection.tsx # Seleção de condomínio
│   ├── (tabs)/                     # Main tabs (autenticado)
│   │   ├── _layout.tsx             # Tab navigator com roles
│   │   ├── home.tsx                # Vitrine de produtos (redesign: horizontal cards + Door Tag)
│   │   ├── search.tsx              # Busca com filtros
│   │   ├── cart.tsx                # Carrinho + checkout
│   │   ├── orders.tsx              # Lista de pedidos
│   │   ├── profile.tsx             # Perfil + configurações
│   │   ├── seller.tsx              # Painel vendedor (VENDEDOR/SINDICO)
│   │   └── moderator.tsx           # Painel moderação (SINDICO)
│   ├── product/
│   │   ├── [id].tsx                # Detalhe do produto
│   │   └── new.tsx                 # Criar produto
│   ├── order/
│   │   └── [id].tsx                # Detalhe do pedido + timeline
│   └── settings/
│       ├── privacy.tsx
│       ├── help.tsx
│       └── about.tsx
├── components/
│   ├── ui/                         # Componentes base (atualizados com design tokens)
│   │   ├── Button.tsx              # Variants: primary, secondary, outline, danger, ghost
│   │   ├── Input.tsx               # Com design tokens, tipografia DM Sans
│   │   ├── Card.tsx                # Elevation levels, bordas com design tokens
│   │   ├── Avatar.tsx              # Atualizado com design tokens
│   │   ├── CategoryChip.tsx        # Novo: chip de categoria com estado ativo terracotta
│   │   ├── DoorTag.tsx             # Novo: elemento assinatura "Door Tag"
│   │   ├── ProductCard.tsx         # Novo: card horizontal de produto
│   │   └── index.ts
│   └── Providers.tsx               # Auth provider
├── hooks/
│   ├── useAuth.ts                  # Hook de autenticação
│   ├── useApi.ts                   # Hook de chamadas API
│   └── index.ts
├── store/
│   ├── authStore.ts                # Zustand auth + persist (token_ki_auth, token_ki_user, token_ki_condominio_id)
│   ├── cartStore.ts                # Zustand carrinho + persist (token_ki_cart)
│   └── index.ts
├── utils/
│   └── api.ts                      # Axios client com interceptors (usa AsyncStorage, chaves token_ki_*)
├── constants/
│   ├── index.ts                    # Constants, labels, config
│   └── design.ts                   # Design system tokens (cores, tipografia, spacing, shadows)
└── types/
    └── index.ts                    # TypeScript types
```

### Rotas Principais
| Rota | Descrição | Acesso |
|------|-----------|--------|
| `/(auth)/welcome` | Boas-vindas | Público |
| `/(auth)/login` | Login | Público |
| `/(auth)/register` | Cadastro completo | Público |
| `/(auth)/role-selection` | Escolher comprador/vendedor | Público |
| `/(auth)/community-selection` | Selecionar condomínio | Público |
| `/(tabs)/home` | Vitrine produtos | Autenticado |
| `/(tabs)/search` | Busca (aberta pelo campo da vitrine; fora da barra de abas) | Autenticado |
| `/(tabs)/cart` | Carrinho + checkout | Autenticado |
| `/(tabs)/orders` | Meus pedidos | Autenticado |
| `/(tabs)/profile` | Perfil + configurações | Autenticado |
| `/(tabs)/dashboard` | Painel de vendas (dashboard) | VENDEDOR/SINDICO |
| `/(tabs)/seller` | Anúncios do vendedor | VENDEDOR/SINDICO |
| `/condominios` | Trocar de condomínio / pedir para participar de outro | Autenticado |
| `/(tabs)/moderator` | Moderação: denúncias, avaliações e usuários (painel do condomínio, pedidos de participação, sanções) | SINDICO |
| `/product/[id]` | Detalhe produto | Autenticado |
| `/product/new` | Criar produto | VENDEDOR/SINDICO |
| `/order/[id]` | Detalhe pedido + ações | Autenticado |
| `/settings/*` | Configurações | Autenticado |

### Scripts Frontend
```bash
cd frontend
npm run dev          # Expo dev server
npm run build:web    # Build para web
npm run lint         # ESLint
```

---

## Design System (Implementado)
- **Paleta**: Porta Navy (#1B2A3A), Morning Fog (#E8EBEF), Warm Terracotta (#C65D3B), Cream Paper (#FDFBF7), Charcoal Ink (#2D2D2D), Muted Slate (#6B7A8A)
- **Tipografia**: Fraunces (display), DM Sans (body/UI), JetBrains Mono (dados/preços)
- **Componentes assinatura**: Door Tag (tag "Apto 101"), Product Card horizontal, Category Chip (terracotta ativo)
- **Tokens**: constants/design.ts com cores, spacing, borderRadius, typography, shadows, layout

---

## Próximas Tasks Planejadas
- ✅ **Task 8**: Frontend completo (Expo Router, telas, navegação, Zustand, Axios JWT)
- ✅ **Design System**: Tokens, componentes atualizados (Button, Card, Input, Avatar), novos componentes (CategoryChip, DoorTag, ProductCard)
- ✅ **Task 9**: Notificações internas no app (tabela `notificacoes` + tela de avisos). Push ficou fora do escopo
- [ ] Task 10: Testes E2E (Detox) + Unit (Jest)
- [ ] Task 11: Deploy Backend (Docker + Railway/Render)
- [ ] Task 12: Deploy Frontend (EAS Build + App Store/Play Store)
- [ ] Task 13: CI/CD Pipeline (GitHub Actions)

---

## Contas de Teste (Seed)
- **Síndico 1**: `sindico1@pap.com` / `sindico123`
- **Compradores do condomínio 1**: `comprador1@pap.com` (Apto 101) e `comprador2@pap.com` (Apto 102) / `comprador123`
- **Vendedor**: `vendedor1@pap.com` / `vendedor123` (Maria Vendedora, 15 produtos; o "Café da Manhã Completo" começa em quarentena com 3 denúncias)
- **Compradores 3-10 e vendedores 2-10**: `compradorN@pap.com` / `comprador123` e `vendedorN@pap.com` / `vendedor123`, no condomínio N; cada vendedorN tem 1 produto copiado da Maria
- **Síndicos 2-10**: `sindico2@pap.com` … `sindico10@pap.com` / `sindico123`
- 10 condomínios seed-cond-1 … seed-cond-10

## Status TypeScript Frontend
✅ Compilação limpa (npx tsc --noEmit sem erros)

## Storage Keys (AsyncStorage)
- `token_ki_auth` — JWT token + auth state (authStore persist)
- `token_ki_user` — Usuario JSON (sincronizado por authStore/api)
- `token_ki_condominio_id` — Condomínio ID string (sincronizado por authStore/api)
- `token_ki_cart` — Carrinho Zustand persist (cartStore)