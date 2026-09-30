#!/usr/bin/env bash
set -euo pipefail

# Run the Porta a Porta PostgreSQL container via Docker Compose.
# Usage:
#   ./docker/run.sh            # start the container
#   ./docker/run.sh stop       # stop and remove the container
#   ./docker/run.sh restart    # restart the container
#   ./docker/run.sh logs       # tail container logs
#   ./docker/run.sh status     # show container status

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

# The docker-compose.yml and init.sql should already live alongside this script.
# If missing, abort with instructions.
if [ ! -f "$COMPOSE_FILE" ]; then
  echo "ERROR: docker-compose.yml not found in $SCRIPT_DIR"
  echo "       Expected: $SCRIPT_DIR/docker-compose.yml"
  exit 1
fi

cd "$SCRIPT_DIR"

case "${1:-start}" in
  start)
    echo "Starting PostgreSQL container..."
    docker compose up -d
    echo "Container started. Use '$0 logs' to follow the logs."
    ;;
  migrate)
    echo "Running Prisma migrations..."
    if ! command -v npx &> /dev/null; then
      echo "ERROR: npx not found. Run this from the backend directory."
      exit 1
    fi
    npx prisma migrate deploy --schema="$PROJECT_ROOT/backend/prisma/schema.prisma"
    echo "Migrations complete."
    ;;
  stop)
    echo "Stopping PostgreSQL container..."
    docker compose down
    ;;
  restart)
    echo "Restarting PostgreSQL container..."
    docker compose down
    docker compose up -d
    ;;
  logs)
    docker compose logs -f --tail=100
    ;;
  status)
    docker compose ps
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|logs|status|migrate}"
    exit 1
    ;;
esac
