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
Usuario (id, condominio_id, nome, cpf, email, senha_hash, unidade, tipo, push_token)
Produto (id, condominio_id, vendedor_id, nome, descricao, preco, categoria, status)
Pedido (id, condominio_id, comprador_id, unidade_entrega, tipo_entrega, janela_horario, status, valor_total)
ItemPedido (id, pedido_id, produto_id, quantidade, preco_unitario)
Denuncia (id, produto_id, denunciante_id, motivo) — UNIQUE(produto_id, denunciante_id)
Avaliacao (id, pedido_id, comprador_id, nota, comentario, removida_por) — UNIQUE(pedido_id)
LogAuditoria (id, sindico_id, acao, entidade_id, justificativa)
```

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
- `GET /api/denuncias` — Listar (SINDICO)
- `GET /api/denuncias/produto/:produtoId` — Ver denúncias + identidades (SINDICO, LogAuditoria)
- `PATCH /api/denuncias/:produtoId/quarentena` — Aplicar/restaurar quarentena (SINDICO, LogAuditoria)

### Avaliações (Task 6)
- `POST /api/avaliacoes` — Criar (COMPRADOR, pedido ENTREGUE)
- `GET /api/avaliacoes` — Listar (VENDEDOR/SINDICO)
- `GET /api/avaliacoes/produto/:produtoId` — Média por produto
- `PUT /api/avaliacoes/:pedidoId` — Atualizar (COMPRADOR)
- `DELETE /api/avaliacoes/:pedidoId` — Remover (SINDICO)

### Auditoria (Task 7)
- `POST /api/auditoria` — Registrar log (SINDICO)
- `GET /api/auditoria` — Listar logs (SINDICO)

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
│       ├── notifications.tsx
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
| `/(tabs)/search` | Busca avançada | Autenticado |
| `/(tabs)/cart` | Carrinho + checkout | Autenticado |
| `/(tabs)/orders` | Meus pedidos | Autenticado |
| `/(tabs)/profile` | Perfil + configurações | Autenticado |
| `/(tabs)/seller` | Painel vendedor | VENDEDOR/SINDICO |
| `/(tabs)/moderator` | Painel moderação | SINDICO |
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

## Notificações Push (Task 9 — Implementado)

### Arquitetura do Sistema
```
Evento no Backend → notificationService.ts → Expo Server SDK → Expo Push Service → Dispositivo
                 ↑                              ↑
          pedido.routes.ts           expo-server-sdk (npm)
                 ↑                              ↑
         notificacao.routes.ts      ExpoPushMessage[] (chunked em 100)

Frontend Hook ←→ Device Token ←→ Expo Notifications ←→ API /usuarios/me
```

### Backend

#### `src/services/notificationService.ts`
Serviço central de envio de notificações push usando `expo-server-sdk`:

- `notificationMessages` — templates para `newOrder`, `orderStatusChanged`, `orderCancelled`
- `getVendorTokens(pedidoId)` — SQL raw query que busca tokens de vendedores cujos produtos estão nos itens do pedido
- `sendPushNotifications(tokens, title, body, data)` — valida tokens com `Expo.isExpoPushToken()`, chunka em grupos de 100, envia via `expo.sendPushNotificationsAsync()`
- `notifyNewOrder(pedidoId, compradorNome, unidade, totalItens)` — notifica vendedores quando um novo pedido é criado
- `notifyOrderStatusChanged(pedidoId, compradorId, newStatus)` — notifica o comprador quando o status do pedido muda

#### `src/routes/notificacao.routes.ts`
Dois endpoints SINDICO-only:

- `POST /api/notificacoes/enviar` — envia notificação para um usuário específico (via `usuarioId`) ou para todos os usuários do condomínio. Usa zod schema para validação.
- `POST /api/notificacoes/teste` — envia notificação de teste para o próprio dispositivo do síndico autenticado

#### Fluxo no `src/routes/pedido.routes.ts`
- Após criar pedido: `void notifyNewOrder(pedido.id, comprador.nome, comprador.unidade, totalItens).catch(...)` — fire-and-forget
- Após atualizar status: `void notifyOrderStatusChanged(pedidoId, pedido.compradorId, newStatus).catch(...)`

#### `src/middleware/auth.ts` (modificado)
- Adicionado `pushToken?: string | null` à interface `AuthRequest.user`
- Adicionado `pushToken: true` ao select do Prisma para incluir o token no objeto de usuário autenticado

### Frontend

#### `frontend/services/notificationService.ts`
Configura o notification handler e gerencia permissões/tokens no dispositivo:

- `requestUserPermission()` — solicita permissões de notificação via `Notifications.getPermissionsAsync()`
- `registerForPushNotifications()` — obtém token via `Notifications.getExpoPushTokenAsync()`, salva via `PUT /usuarios/me`
- `setupNotificationChannel()` — configura canal Android com ícone e cores
- `getNotificationData(response)` — extrai dados da notificação para navegação (type, pedidoId)

#### `frontend/hooks/usePushNotifications.ts`
Hook que gerencia o ciclo de vida das notificações:

- `register()` — chama `registerForPushNotifications()`, atualiza o Zustand store com `updateUsuario({ pushToken })`
- `handleNotificationResponse()` — listener para toque na notificação, navega para `/order/:id` quando `pedidoId` está presente
- Configura `Notifications.addNotificationResponseReceivedListener` no useEffect

#### `frontend/hooks/useApi.ts` (modificado)
- Adicionado `updateUsuario` — `useCallback` que faz `PUT /usuarios/me` para salvar o push token no backend

#### `frontend/hooks/index.ts` (modificado)
- Adicionado `export { usePushNotifications } from './usePushNotifications'`

#### `frontend/components/Providers.tsx` (modificado)
- Após autenticação bem-sucedida, chama `register()` do hook `usePushNotifications` se o usuário não tem push token

#### `frontend/app/settings/notifications.tsx`
Tela de configurações com:

- Status do dispositivo (push token ativo/inativo)
- Botão "Ativar Notificações" (registra token)
- Toggles para tipos de notificação (pedidos, novos produtos, promoções, avaliações, denúncias, anúncios)
- Horário silencioso (22:00–08:00)
- Botão "Enviar Notificação de Teste"
- Botão "Enviar Comunicado para Todos" (apenas SINDICO)

### Fluxo Completo
1. **Login/Registro** → `Providers.tsx` detecta usuário autenticado → chama `usePushNotifications.register()` → `registerForPushNotifications()` obtém token Expo → salva via `PUT /usuarios/me`
2. **Novo Pedido** → `pedido.routes.ts` cria pedido → chama `notifyNewOrder()` → `getVendorTokens()` busca vendedores via SQL → `sendPushNotifications()` envia via Expo Server SDK → vendedores recebem notificação
3. **Status atualizado** → `pedido.routes.ts` atualiza status → chama `notifyOrderStatusChanged()` → busca buyer token → envia notificação → buyer recebe atualização
4. **Síndico envia comunicado** → `/notificacoes/enviar` → busca todos tokens do condomínio → envia notificação para todos
5. **Usuário toca na notificação** → `usePushNotifications` listener captura → navega para `/order/:id`

### Dependências
**Backend** (`package.json`):
- `expo-server-sdk` — SDK Expo para envio de push notifications do servidor

**Frontend** (`package.json`):
- `expo-notifications` — gerenciamento de notificações no dispositivo
- `expo-device` — utilitários para verificar se é dispositivo físico

---

## Próximas Tasks Planejadas
- ✅ **Task 8**: Frontend completo (Expo Router, telas, navegação, Zustand, Axios JWT)
- ✅ **Design System**: Tokens, componentes atualizados (Button, Card, Input, Avatar), novos componentes (CategoryChip, DoorTag, ProductCard)
- ✅ **Task 9**: Notificações Push (Expo Notifications)
- [ ] Task 10: Testes E2E (Detox) + Unit (Jest)
- [ ] Task 11: Deploy Backend (Docker + Railway/Render)
- [ ] Task 12: Deploy Frontend (EAS Build + App Store/Play Store)
- [ ] Task 13: CI/CD Pipeline (GitHub Actions)

---

## Status TypeScript Frontend
✅ Compilação limpa (npx tsc --noEmit sem erros)

## Storage Keys (AsyncStorage)
- `token_ki_auth` — JWT token + auth state (authStore persist)
- `token_ki_user` — Usuario JSON (sincronizado por authStore/api)
- `token_ki_condominio_id` — Condomínio ID string (sincronizado por authStore/api)
- `token_ki_cart` — Carrinho Zustand persist (cartStore)