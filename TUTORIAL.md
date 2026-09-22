# Tutorial: Porta a Porta — Commerce Platform for Residential Communities

> A complete guide to understanding, running, and extending the Porta a Porta mobile application for internal condominium commerce.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Getting Started](#getting-started)
4. [Backend Deep Dive](#backend-deep-dive)
5. [Frontend Deep Dive](#frontend-deep-dive)
6. [Design System](#design-system)
7. [API Reference](#api-reference)
8. [Business Rules](#business-rules)
9. [Development Workflow](#development-workflow)
10. [Extending the Platform](#extending-the-platform)
11. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Porta a Porta** is a mobile platform that enables residents of a condominium to buy and sell homemade products, crafts, food, and services — all within a secure, moderated environment managed by the building administrator (síndico).

### Key Features

| Feature | Description |
|---------|-------------|
| **Vitrine Comunitária** | Browse products by category with search and filters |
| **Carrinho & Checkout** | Persistent cart with delivery options (portaria, unidade, combinar) |
| **Pedidos** | Full order lifecycle with status timeline |
| **Painel do Vendedor** | Create/edit products, manage active listings (max 15) |
| **Moderação do Síndico** | Auto-quarantine at 3+ reports, audit log of all actions |
| **Avaliações** | 1-5 star reviews post-delivery, síndico can remove |
| **Perfil por Unidade** | Identity tied to apartment/block for accountability |

### Tech Stack

```
Backend:  Node.js + Express + TypeScript + Prisma ORM + PostgreSQL
Frontend: React Native + Expo Router + TypeScript + Zustand + Axios
Auth:     JWT with HttpOnly-refresh pattern (access + refresh tokens)
State:    Zustand with Expo SecureStore persistence
Icons:    @expo/vector-icons (Ionicons)
```

---

## Architecture

```
porta-a-porta/
├── backend/                 # Node.js/Express API
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── services/        # Business logic
│   │   └── index.ts         # Entry point
│   └── package.json
│
├── frontend/                # Expo React Native App
│   ├── app/                 # Expo Router file-based routing
│   │   ├── (auth)/          # Unauthenticated screens
│   │   ├── (tabs)/          # Authenticated tab navigator
│   │   ├── product/         # Product detail & create
│   │   ├── order/           # Order detail
│   │   └── settings/        # Settings screens
│   ├── components/
│   │   └── ui/              # Design system components
│   ├── hooks/               # Custom React hooks
│   ├── store/               # Zustand stores
│   ├── utils/               # Axios client, helpers
│   ├── constants/           # Design tokens, labels, config
│   └── types/               # TypeScript interfaces
│
└── CLAUDE.md                # Project documentation for AI assistants
```

### Multitenancy Model

Every entity belongs to a `condominio_id`. The JWT token carries this ID, and all queries are automatically scoped. Users from different condominiums never see each other's data.

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator / Android Emulator / Physical device with Expo Go

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT secrets

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed database
npm run prisma:seed

# Start development server
npm run dev
```

Server runs on `http://localhost:3333`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure API URL (if backend not on localhost:3333)
# Edit constants/index.ts → API_BASE_URL

# Start Expo dev server
npm run dev
```

Scan QR code with Expo Go (mobile) or press `i` for iOS Simulator / `a` for Android Emulator.

---

## Backend Deep Dive

### Database Schema (Prisma)

```prisma
// Core entities
Condominio   { id, nome, endereco, criado_em }
Usuario      { id, condominio_id, nome, cpf, email, senha_hash, unidade, tipo, push_token }
Produto      { id, condominio_id, vendedor_id, nome, descricao, preco, categoria, status }
Pedido       { id, condominio_id, comprador_id, unidade_entrega, tipo_entrega, janela_horario, status, valor_total }
ItemPedido   { id, pedido_id, produto_id, quantidade, preco_unitario }
Denuncia     { id, produto_id, denunciante_id, motivo } @@unique([produto_id, denunciante_id])
Avaliacao    { id, pedido_id, comprador_id, nota, comentario, removida_por } @@unique([pedido_id])
LogAuditoria { id, sindico_id, acao, entidade_id, justificativa }
```

### Enums

```typescript
TipoUsuario:      COMPRADOR | VENDEDOR | SINDICO
StatusProduto:    ATIVO | PAUSADO | QUARENTENA | EXCLUIDO
StatusPedido:     PENDENTE | CONFIRMADO | EM_PREPARO | PRONTO_ENTREGA | ENTREGUE | CANCELADO
TipoEntrega:      PORTARIA | UNIDADE | COMBINAR
```

### Authentication Flow

```
1. POST /api/auth/register  → Creates user + returns JWT
2. POST /api/auth/login     → Validates credentials → returns JWT
3. GET  /api/auth/me        → Returns current user (requires Authorization header)
```

JWT payload: `{ sub: userId, tipo: TipoUsuario, condominioId }`

### API Route Structure

```
src/routes/
├── auth.ts           # Register, Login, Me
├── produtos.ts       # CRUD + list + status toggle
├── pedidos.ts        # Create, list, detail, status transition
├── denuncias.ts      # Create, list, view, quarantine actions
├── avaliacoes.ts     # Create, list, product average, update, delete (síndico)
└── auditoria.ts      # Log actions, list logs
```

### Key Middleware

- `authMiddleware` — Validates JWT, attaches `req.usuario`
- `requireRole(...roles)` — Guards routes by user type
- `validate(schema)` — Zod validation for request bodies

---

## Frontend Deep Dive

### Routing (Expo Router)

```
app/
├── _layout.tsx                    # Root: Providers, auth check
├── (auth)/
│   ├── _layout.tsx                # Stack: no tabs, no auth
│   ├── welcome.tsx                # Onboarding
│   ├── login.tsx
│   ├── register.tsx
│   ├── role-selection.tsx         # COMPRADOR / VENDEDOR
│   └── community-selection.tsx    # Pick condominium
├── (tabs)/
│   ├── _layout.tsx                # Tab navigator + role-based tabs
│   ├── home.tsx                   # Product feed (horizontal cards)
│   ├── search.tsx                 # Advanced search + filters
│   ├── cart.tsx                   # Cart + checkout (inline)
│   ├── orders.tsx                 # Order list + status filters
│   ├── profile.tsx                # Profile, stats, settings links
│   ├── seller.tsx                 # Seller dashboard (VENDEDOR/SINDICO)
│   └── moderator.tsx              # Moderation panel (SINDICO)
├── product/
│   ├── [id].tsx                   # Product detail + add to cart / report
│   └── new.tsx                    # Create product form
├── order/
│   └── [id].tsx                   # Order detail + timeline + actions
└── settings/
    ├── notifications.tsx
    ├── privacy.tsx
    ├── help.tsx
    └── about.tsx
```

### State Management (Zustand)

```typescript
// store/authStore.ts
- usuario: Usuario | null
- token: string | null
- login(credentials)
- register(data)
- logout()
- hydrate()  // from SecureStore

// store/cartStore.ts
- items: CartItem[]
- addItem(produto, quantidade)
- removeItem(produtoId)
- updateQuantity(produtoId, quantidade)
- clear()
- total: number
- itemCount: number
```

Both persist to **Expo SecureStore** automatically.

### API Client (Axios)

```typescript
// utils/api.ts
- Base URL from constants
- Request interceptor: attaches Authorization header
- Response interceptor: 401 → attempts refresh token → retries once
- Helper: api.get/post/put/patch/delete
```

### Custom Hooks

```typescript
// hooks/useAuth.ts
- usuario, isVendedor, isSindico, loading
- login, register, logout, refreshUser

// hooks/useApi.ts
- getProdutos, getProduto, createProduto, updateProduto, deleteProduto
- getPedidos, getPedido, createPedido, updatePedidoStatus
- getDenuncias, createDenuncia, updateDenunciaQuarentena
- getAvaliacoes, createAvaliacao, updateAvaliacao, deleteAvaliacao
- getLogsAuditoria
```

---

## Design System

Located at `frontend/constants/design.ts` — **single source of truth** for all visual decisions.

### Color Palette (6 Core Colors)

| Token | Hex | Usage |
|-------|-----|-------|
| `portaNavy` | `#1B2A3A` | Primary brand, headers, primary CTAs |
| `morningFog` | `#E8EBEF` | Surfaces, dividers, inactive states |
| `warmTerracotta` | `#C65D3B` | **Accent** — active chips, Door Tag, CTAs |
| `creamPaper` | `#FDFBF7` | Page background, card backgrounds |
| `charcoalInk` | `#2D2D2D` | Body text, high-contrast readable |
| `mutedSlate` | `#6B7A8A` | Secondary text, placeholders, disabled |

### Typography

| Role | Font | Weights |
|------|------|---------|
| **Display** | Fraunces | SemiBold (600), Medium (500) |
| **Body / UI** | DM Sans | Regular (400), Medium (500), SemiBold (600) |
| **Data / Prices** | JetBrains Mono | Regular (400), Medium (500) |

### Signature Components

#### DoorTag
```tsx
<DoorTag unit="Apto 101" variant="seller" size="md" />
// Variants: default (terracotta), seller (navy), buyer (green)
// Sizes: sm (14px), md (16px)
```
The **memorable element** — appears on every product card showing the seller's unit.

#### CategoryChip
```tsx
<CategoryChip label="Alimentos" selected={true} onPress={() => {}} />
// Selected: warmTerracotta background + white text
// Unselected: morningFog border + mutedSlate text
```

#### ProductCard (Horizontal)
```tsx
<ProductCard
  product={produto}
  onPress={() => router.push(`/product/${produto.id}`)}
  sellerUnit={produto.vendedor?.unidade}
/>
// 280px wide, image left (88x88), info right with category badge + Door Tag
```

### Using Design Tokens

```typescript
import { colors, spacing, typography, shadows, borderRadius, layout } from '@/constants/design';

// Colors
backgroundColor: colors.background
borderColor: colors.border

// Spacing
padding: spacing.md  // 16

// Typography
fontFamily: typography.bodyMedium.fontFamily
fontSize: typography.bodyMedium.fontSize
fontWeight: typography.bodyMedium.fontWeight

// Shadows
...shadows.md

// Border Radius
borderRadius: borderRadius.lg  // 16

// Layout
paddingHorizontal: layout.screenPadding  // 16
```

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, returns tokens |
| GET | `/api/auth/me` | ✅ | Current user profile |

### Products

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/produtos` | ✅ | VENDEDOR | Create product (RN01: max 15 active) |
| GET | `/api/produtos` | ✅ | All | List active/paused (filters: categoria, busca, pagina) |
| GET | `/api/produtos/meus` | ✅ | VENDEDOR | My products (all statuses) |
| GET | `/api/produtos/:id` | ✅ | All | Product detail |
| PUT | `/api/produtos/:id` | ✅ | Owner/SINDICO | Update product |
| PATCH | `/api/produtos/:id/status` | ✅ | Owner/SINDICO | Toggle status (validates RN01 on activate) |
| DELETE | `/api/produtos/:id` | ✅ | Owner/SINDICO | Soft delete (status=EXCLUIDO) |

### Orders

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/pedidos` | ✅ | COMPRADOR | Create order (backend calculates total) |
| GET | `/api/pedidos` | ✅ | All | List (filtered by role) |
| GET | `/api/pedidos/:id` | ✅ | All | Order detail + items |
| PATCH | `/api/pedidos/:id/status` | ✅ | Per role | Status transition (state machine) |

**Status Transitions:**
```
COMPRADOR:  PENDENTE → CANCELADO
VENDEDOR:   PENDENTE → CONFIRMADO → EM_PREPARO → PRONTO_ENTREGA → ENTREGUE
            PENDENTE → CANCELADO
SINDICO:    Any → CANCELADO
```

### Reports (Denúncias)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/denuncias` | ✅ | COMPRADOR/VENDEDOR | Report product (auto-quarantine ≥3) |
| GET | `/api/denuncias` | ✅ | SINDICO | List all reports |
| GET | `/api/denuncias/produto/:id` | ✅ | SINDICO | View reports + identities (logs audit) |
| PATCH | `/api/denuncias/:id/quarentena` | ✅ | SINDICO | Apply/restore quarantine (logs audit) |

### Reviews (Avaliações)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/avaliacoes` | ✅ | COMPRADOR | Create review (only on ENTREGUE orders) |
| GET | `/api/avaliacoes` | ✅ | VENDEDOR/SINDICO | List reviews |
| GET | `/api/avaliacoes/produto/:id` | ✅ | All | Average rating per product |
| PUT | `/api/avaliacoes/:pedidoId` | ✅ | COMPRADOR | Update own review |
| DELETE | `/api/avaliacoes/:pedidoId` | ✅ | SINDICO | Remove review |

### Audit Log

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auditoria` | ✅ | SINDICO | Log action |
| GET | `/api/auditoria` | ✅ | SINDICO | List logs |

---

## Business Rules

| Code | Rule | Enforcement |
|------|------|-------------|
| **RN01** | Max 15 ACTIVE products per seller | Backend: validated on create & status change to ATIVO |
| **RN02** | Order total calculated in backend | Backend: sums current prices at order creation |
| **RN03** | Price frozen in ItemPedido | Backend: copies `produto.preco` → `ItemPedido.precoUnitario` |
| **RN04** | Valid status transitions only | Backend: state machine in `pedidos.ts` |
| **RN05** | Auto-quarantine at 3+ distinct reports | Backend: trigger in `POST /denuncias` + `PATCH /quarentena` |

### Multitenancy

Every query includes `WHERE condominio_id = req.usuario.condominioId`. No cross-condominium data leakage possible.

---

## Development Workflow

### Running Locally

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

### Database Commands

```bash
cd backend

npm run prisma:generate    # Regenerate client after schema changes
npm run prisma:migrate     # Create & apply migration
npm run prisma:migrate dev # Dev: create migration interactively
npm run prisma:studio      # Open Prisma Studio (visual DB)
npm run prisma:seed        # Run seed script
```

### TypeScript Check

```bash
cd frontend && npx tsc --noEmit
cd backend && npx tsc --noEmit
```

### Linting

```bash
cd frontend && npm run lint
cd backend && npm run lint
```

### Adding a New Screen

1. Create file in `app/(tabs)/` or `app/product/` etc.
2. Add to tab layout if needed (`app/(tabs)/_layout.tsx`)
3. Use design tokens from `constants/design.ts`
4. Import UI components from `components/ui`
5. Use `useApi` hook for data fetching

### Adding a New API Endpoint

1. Create route file in `backend/src/routes/`
2. Add validation schemas (Zod)
3. Register in `backend/src/index.ts`
4. Add types to `frontend/types/index.ts` if needed
5. Add hook method in `frontend/hooks/useApi.ts`

---

## Extending the Platform

### Adding a New Product Category

1. Backend: Update `CategoriaProduto` enum in `schema.prisma` → migrate
2. Frontend: Add to `CATEGORIAS` array in `frontend/constants/index.ts`
3. Frontend: Add label mapping in `ProductCard.tsx` and `ProductDetail`

### Adding a New User Role

1. Backend: Add to `TipoUsuario` enum in `schema.prisma` → migrate
2. Backend: Update `requireRole` middleware
3. Frontend: Update `TipoUsuario` type, `isX` getters in `useAuth`
4. Frontend: Conditional tabs in `app/(tabs)/_layout.tsx`

### Adding Push Notifications (Task 9)

1. Backend: Add `pushToken` to `Usuario`, create notification service
2. Frontend: `expo-notifications` setup, request permissions on login
3. Backend: Trigger on order status changes, new reports, new reviews

### Adding Tests (Task 10)

```bash
# Backend: Jest + Supertest
cd backend && npm install -D jest @types/jest ts-jest supertest
# Frontend: Jest + React Native Testing Library + Detox
cd frontend && npm install -D jest @testing-library/react-native detox
```

---

## Troubleshooting

### "Cannot find module '@/constants/design'"

- Restart Metro bundler: `npx expo start -c`
- Check `tsconfig.json` has `baseUrl: "."` and `paths: { "@/*": ["*"] }`

### "JWT expired" / 401 loops

- Check `JWT_SECRET` and `JWT_REFRESH_SECRET` in backend `.env`
- Ensure frontend `utils/api.ts` refresh logic matches backend token expiry

### "Prisma Client validation error"

```bash
cd backend && npm run prisma:generate
```

### "Port 3333 already in use"

```bash
lsof -i :3333
kill -9 <PID>
```

### Expo "No bundle URL present"

```bash
cd frontend && npx expo start -c
```

### TypeScript errors after adding types

- Ensure both `frontend/types/index.ts` and backend Prisma types are in sync
- Run `npx tsc --noEmit` in both directories

### iOS Simulator won't open

```bash
xcrun simctl boot "iPhone 15"
open -a Simulator
```

### Android Emulator won't open

```bash
cd ~/Android/Sdk/emulator && ./emulator -avd <avd_name>
```

---

## Quick Reference: File Locations

| Need | File |
|------|------|
| Change colors | `frontend/constants/design.ts` |
| Add API endpoint | `backend/src/routes/*.ts` |
| Add screen | `frontend/app/**/*.tsx` |
| New UI component | `frontend/components/ui/*.tsx` |
| Database schema | `backend/prisma/schema.prisma` |
| Auth logic | `backend/src/middleware/auth.ts` |
| Cart logic | `frontend/store/cartStore.ts` |
| API types | `frontend/types/index.ts` |
| Constants/labels | `frontend/constants/index.ts` |

---

## Next Steps (Roadmap)

- [ ] **Task 9**: Push Notifications (Expo Notifications)
- [ ] **Task 10**: E2E Tests (Detox) + Unit Tests (Jest)
- [ ] **Task 11**: Backend Deploy (Docker + Railway/Render)
- [ ] **Task 12**: Frontend Deploy (EAS Build + App Store/Play Store)
- [ ] **Task 13**: CI/CD Pipeline (GitHub Actions)

---

*Last updated: 2026-09-21*  
*Version: 1.0.0*