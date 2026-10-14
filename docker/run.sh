#!/usr/bin/env bash
set -euo pipefail

# Banco de dados do Porta a Porta (PostgreSQL via Docker Compose).
#
# Uso:
#   ./docker/run.sh                # sobe o container (os dados do volume são mantidos)
#   ./docker/run.sh setup          # sobe o container, aplica as migrações e roda o seed
#   ./docker/run.sh reset          # APAGA o banco, recria do zero, aplica as migrações e roda o seed
#   ./docker/run.sh migrate        # aplica as migrações pendentes (prisma migrate deploy)
#   ./docker/run.sh seed           # cria/atualiza os dados de teste
#   ./docker/run.sh stop           # para e remove o container (os dados do volume são mantidos)
#   ./docker/run.sh restart        # reinicia o container
#   ./docker/run.sh logs           # acompanha os logs do PostgreSQL
#   ./docker/run.sh status         # mostra o estado do container
#
# Quando usar cada um:
#   - Reiniciou o container ou o computador: nada a fazer, os dados continuam no volume.
#   - Primeira vez na máquina, ou puxou código com migração nova: ./docker/run.sh setup
#   - Quer começar do zero (apaga tudo): ./docker/run.sh reset
#
# As migrações e o seed rodam na pasta backend e usam o DATABASE_URL de backend/.env.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

DB_USER="porta_a_porta"
DB_NAME="porta_a_porta"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "ERRO: docker-compose.yml não encontrado em $SCRIPT_DIR"
  exit 1
fi

compose() {
  docker compose -f "$COMPOSE_FILE" "$@"
}

subir() {
  echo "Subindo o PostgreSQL..."
  compose up -d
}

# Espera o PostgreSQL aceitar conexões (até ~60 s)
aguardar_banco() {
  echo -n "Aguardando o banco ficar pronto"
  for _ in $(seq 1 60); do
    if compose exec -T postgres pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
      echo " pronto."
      return 0
    fi
    echo -n "."
    sleep 1
  done
  echo
  echo "ERRO: o banco não respondeu em 60 segundos. Veja os logs com: $0 logs"
  exit 1
}

verificar_backend() {
  if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "ERRO: backend/.env não encontrado."
    echo "      Copie backend/.env.example para backend/.env e ajuste o DATABASE_URL:"
    echo "      postgresql://$DB_USER:porta_a_porta_dev@localhost:5432/$DB_NAME?schema=public"
    exit 1
  fi
  if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo "ERRO: dependências do backend não instaladas. Rode: cd backend && npm install"
    exit 1
  fi
}

migrar() {
  verificar_backend
  echo "Gerando o cliente do Prisma..."
  (cd "$BACKEND_DIR" && npx prisma generate)
  echo "Aplicando as migrações..."
  (cd "$BACKEND_DIR" && npx prisma migrate deploy)
}

popular() {
  verificar_backend
  echo "Rodando o seed (dados de teste)..."
  (cd "$BACKEND_DIR" && npm run prisma:seed)
}

case "${1:-start}" in
  start)
    subir
    echo "Container no ar. Para acompanhar os logs: $0 logs"
    ;;
  setup)
    subir
    aguardar_banco
    migrar
    popular
    echo "Banco pronto para uso."
    ;;
  reset)
    if [ "${2:-}" != "-y" ]; then
      echo "ATENÇÃO: isto apaga TODOS os dados do banco (usuários, produtos, pedidos...)."
      read -r -p "Digite 'apagar' para confirmar: " resposta
      if [ "$resposta" != "apagar" ]; then
        echo "Cancelado."
        exit 0
      fi
    fi
    echo "Removendo o container e o volume de dados..."
    compose down -v
    subir
    aguardar_banco
    migrar
    popular
    echo "Banco recriado do zero."
    ;;
  migrate)
    aguardar_banco
    migrar
    ;;
  seed)
    aguardar_banco
    popular
    ;;
  stop)
    echo "Parando o PostgreSQL (os dados continuam no volume)..."
    compose down
    ;;
  restart)
    echo "Reiniciando o PostgreSQL..."
    compose restart
    ;;
  logs)
    compose logs -f --tail=100
    ;;
  status)
    compose ps
    ;;
  *)
    echo "Uso: $0 {start|setup|reset [-y]|migrate|seed|stop|restart|logs|status}"
    exit 1
    ;;
esac
