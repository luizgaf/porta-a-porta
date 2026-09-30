# Tutorial: Running Porta a Porta & Test Accounts

> Quick-start guide for running the application locally and using the seeded test accounts.

---

## Prerequisites

- Node.js 18+
- Docker (for PostgreSQL)
- npm

---

## 1. Start PostgreSQL

The project uses PostgreSQL via Docker. The database configuration:

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Port | `5432` |
| Database | `porta_a_porta` |
| User | `porta_a_porta` |
| Password | `porta_a_porta_dev` |

### Start the database

```bash
docker run -d \
  --name porta-postgres \
  -e POSTGRES_USER=porta_a_porta \
  -e POSTGRES_PASSWORD=porta_a_porta_dev \
  -e POSTGRES_DB=porta_a_porta \
  -p 5432:5432 \
  postgres:16-alpine
```

### Wait for PostgreSQL to be ready

```bash
until docker exec porta-postgres pg_isready -U porta_a_porta; do sleep 1; done
```

### Stop/remove when done

```bash
docker stop porta-postgres && docker rm porta-postgres
```

---

## 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Apply migrations
npm run prisma:migrate

# Seed the database with test data
npm run prisma:seed

# Start the development server
npm run dev
```

Backend runs on `http://localhost:3000`.

### Database Schema

| Model | Table | Description |
|-------|-------|-------------|
| `Condominio` | `condominios` | Condominium (id, nome, endereco, criado_em) |
| `Usuario` | `usuarios` | User (id, condominio_id, nome, cpf, email, senha_hash, unidade, tipo) |
| `Produto` | `produtos` | Product (id, condominio_id, vendedor_id, nome, descricao, preco, categoria, status) |
| `Pedido` | `pedidos` | Order (id, condominio_id, comprador_id, unidade_entrega, tipo_entrega, janela_horario, status, valor_total) |
| `ItemPedido` | `itens_pedido` | Order item (id, pedido_id, produto_id, quantidade, preco_unitario) |
| `Denuncia` | `denuncias` | Report (id, produto_id, denunciante_id, motivo) |
| `Avaliacao` | `avaliacoes` | Review (id, pedido_id, comprador_id, nota, comentario, removida_por) |
| `LogAuditoria` | `logs_auditoria` | Audit log (id, sindico_id, acao, entidade_id, justificativa) |

### Enums

- **`TipoUsuario`**: `COMPRADOR`, `VENDEDOR`, `SINDICO`
- **`StatusProduto`**: `ATIVO`, `PAUSADO`, `QUARENTENA`, `EXCLUIDO`
- **`StatusPedido`**: `PENDENTE`, `CONFIRMADO`, `EM_PREPARO`, `PRONTO_ENTREGA`, `ENTREGUE`, `CANCELADO`
- **`TipoEntrega`**: `PORTARIA`, `UNIDADE`, `COMBINAR`

### Business Rules

| Rule | Description | Enforcement |
|------|-------------|-------------|
| **RN01** | Max 15 ATIVO products per seller | Validated on create & status change to ATIVO |
| **RN02** | Order total calculated in backend | Sum of current prices at order creation |
| **RN03** | Price frozen in ItemPedido | Copied from produto.preco at order time |
| **RN04** | Valid status transitions only | State machine on `/api/pedidos/:id/status` |
| **RN05** | Auto-quarantine at 3+ distinct reports | Trigger on `POST /api/denuncias` |

---

## 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Expo dev server
npm run dev
```

### Configure API URL

The frontend expects the backend at `http://localhost:3000`. Check `frontend/constants/index.ts` for `API_BASE_URL` and update if needed.

### Run TypeScript check

```bash
npx tsc --noEmit
```

---

## 4. Test Accounts

Run the seed to populate the database:

```bash
cd backend && npm run prisma:seed
```

### Seeded Data

The seed script creates **10 condomínios** with the following accounts per condomínio:

| Role | Email | Password | Condomínio | Unidade |
|------|-------|----------|------------|---------|
| Síndico | `sindico1@pap.com` – `sindico10@pap.com` | `sindico123` | Condomínio 1 – 10 | Sala {n} |
| Comprador | `comprador1@pap.com` | `comprador123` | Condomínio 1 | Apto 101 |
| Vendedor | `vendedor1@pap.com` | `vendedor123` | Condomínio 1 | Apto 202 |

### Quick Login Reference

```
Síndico 1:   sindico1@pap.com   / sindico123
Comprador:   comprador1@pap.com / comprador123
Vendedor:    vendedor1@pap.com  / vendedor123
Síndico 2-10: sindico2@pap.com … sindico10@pap.com / sindico123
```

### Síndico Capabilities

- View all reports (`/api/denuncias`)
- Apply/restore product quarantine
- View audit logs (`/api/auditoria`)
- Remove reviews (any product in condominium)
- Cancel any order

### Comprador Capabilities

- Browse products from their condominium
- Add to cart and checkout
- Place orders with delivery options
- Review delivered orders

### Vendedor Capabilities

- Create/edit products (max 15 active)
- Manage product status (ATIVO / PAUSADO / QUARENTENA / EXCLUIDO)
- Update order status
- View reviews on their products

---

## 5. API Endpoints Summary

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login → JWT |
| GET | `/api/auth/me` | Yes | Current user profile |

### Produtos
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/produtos` | Yes | VENDEDOR | Create product (RN01) |
| GET | `/api/produtos` | Yes | All | List active/paused |
| GET | `/api/produtos/meus` | Yes | VENDEDOR | My products |
| GET | `/api/produtos/:id` | Yes | All | Product detail |
| PUT | `/api/produtos/:id` | Yes | Owner/SÍNDICO | Update |
| PATCH | `/api/produtos/:id/status` | Yes | Owner/SÍNDICO | Toggle status |
| DELETE | `/api/produtos/:id` | Yes | Owner/SÍNDICO | Soft delete |

### Pedidos
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/pedidos` | Yes | COMPRADOR | Create order |
| GET | `/api/pedidos` | Yes | All | List (role-filtered) |
| GET | `/api/pedidos/:id` | Yes | All | Order detail |
| PATCH | `/api/pedidos/:id/status` | Yes | Per role | Status transition |

### Denúncias
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/denuncias` | Yes | COMPRADOR/VENDEDOR | Report product |
| GET | `/api/denuncias` | Yes | SÍNDICO | List all |
| GET | `/api/denuncias/produto/:id` | Yes | SÍNDICO | View product reports |
| PATCH | `/api/denuncias/:id/quarentena` | Yes | SÍNDICO | Apply/restore quarantine |

### Avaliações
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/avaliacoes` | Yes | COMPRADOR | Review (only ENTREGUE) |
| GET | `/api/avaliacoes` | Yes | VENDEDOR/SÍNDICO | List reviews |
| GET | `/api/avaliacoes/produto/:id` | Yes | All | Average rating |
| PUT | `/api/avaliacoes/:pedidoId` | Yes | COMPRADOR | Update review |
| DELETE | `/api/avaliacoes/:pedidoId` | Yes | SÍNDICO | Remove review |

### Auditoria
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auditoria` | Yes | SÍNDICO | Log action |
| GET | `/api/auditoria` | Yes | SÍNDICO | List logs |

---

## Troubleshooting

### Port 5432 already in use
```bash
lsof -i :5432
kill -9 <PID>
```

### "database_porta_a_porta already exists" seed error
Seed uses `upsert` so re-running is safe — it won't duplicate data.

### Prisma client out of sync
```bash
cd backend && npm run prisma:generate
```

### Frontend can't connect to backend
- Check `frontend/constants/index.ts` for `API_BASE_URL`
- Ensure backend is running on the expected port

---