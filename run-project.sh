#!/bin/bash

# Porta a Porta - Project Startup Script
# This script starts the entire project stack in order and verifies each step

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="/home/luizgaf/Desktop/porta-a-porta"
CONTAINER_DIR="$PROJECT_ROOT/container"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Function to print colored output
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to ask for confirmation
ask_confirmation() {
    local message=$1
    echo -e "${YELLOW}[CONFIRM]${NC} $message (y/N): "
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_warning "User declined. Exiting."
        exit 0
    fi
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1

    print_step "Waiting for $name to be ready at $url..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" >/dev/null 2>&1; then
            print_success "$name is ready!"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    print_error "$name failed to start after $max_attempts attempts"
    return 1
}

# Function to wait for PostgreSQL to be healthy
wait_for_postgres() {
    local max_attempts=30
    local attempt=1

    print_step "Waiting for PostgreSQL to be healthy..."
    while [ $attempt -le $max_attempts ]; do
        if docker exec porta-a-porta-postgres pg_isready -U porta_a_porta -d porta_a_porta >/dev/null 2>&1; then
            print_success "PostgreSQL is healthy!"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    print_error "PostgreSQL failed to become healthy after $max_attempts attempts"
    return 1
}

echo "=========================================="
echo "  Porta a Porta - Project Startup Script"
echo "=========================================="
echo ""

# Step 1: Check Docker is running
print_step "Checking Docker..."
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi
print_success "Docker is running"

# Step 2: Start PostgreSQL container
print_step "Starting PostgreSQL container..."
cd "$CONTAINER_DIR"
if docker-compose ps -q postgres | grep -q .; then
    print_warning "PostgreSQL container already exists. Restarting..."
    docker-compose restart postgres
else
    docker-compose up -d postgres
fi

ask_confirmation "PostgreSQL container started. Continue to wait for it to be healthy?"

# Step 3: Wait for PostgreSQL to be healthy
wait_for_postgres || exit 1

# Step 4: Run Prisma migrations
print_step "Running Prisma migrations..."
cd "$BACKEND_DIR"
if [ ! -d "node_modules" ]; then
    print_warning "Backend dependencies not installed. Installing..."
    npm install
fi

npx prisma migrate deploy
print_success "Prisma migrations applied"

ask_confirmation "Database migrated. Continue to start backend server?"

# Step 5: Start Backend
print_step "Starting Backend server (port 3333)..."
if check_port 3333; then
    print_warning "Port 3333 is already in use. Checking if it's our backend..."
    if curl -s -f "http://localhost:3333/health" >/dev/null 2>&1; then
        print_success "Backend already running on port 3333"
    else
        print_error "Port 3333 is occupied by another process"
        exit 1
    fi
else
    # Start backend in background
    npm run dev > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > /tmp/backend.pid
    print_step "Backend started with PID $BACKEND_PID. Waiting for it to be ready..."

    wait_for_service "http://localhost:3333/health" "Backend API" || {
        print_error "Backend failed to start. Check /tmp/backend.log"
        cat /tmp/backend.log
        exit 1
    }
fi

ask_confirmation "Backend is running. Continue to start frontend?"

# Step 6: Start Frontend
print_step "Starting Frontend (Expo)..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    print_warning "Frontend dependencies not installed. Installing..."
    npm install
fi

# Check if Expo is already running
if check_port 8081; then
    print_warning "Port 8081 (Expo) is already in use."
    if curl -s -f "http://localhost:8081" >/dev/null 2>&1; then
        print_success "Expo already running on port 8081"
    else
        print_error "Port 8081 is occupied by another process"
        exit 1
    fi
else
    print_step "Starting Expo development server..."
    print_warning "Expo will open in a new terminal window. Please scan the QR code with Expo Go app."
    print_warning "Press Ctrl+C in the Expo terminal to stop the frontend."

    # Start Expo in a new terminal (if possible) or background
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "cd $FRONTEND_DIR && npm run dev; exec bash"
    elif command -v xterm &> /dev/null; then
        xterm -e "cd $FRONTEND_DIR && npm run dev" &
    elif command -v konsole &> /dev/null; then
        konsole -e "cd $FRONTEND_DIR && npm run dev" &
    else
        print_warning "Could not open new terminal. Starting Expo in background..."
        npm run dev > /tmp/frontend.log 2>&1 &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > /tmp/frontend.pid
        sleep 5
    fi
fi

print_success "Frontend started!"

ask_confirmation "Frontend is running. Continue to verify full stack?"

# Step 7: Verify full stack
print_step "Verifying full stack connectivity..."

# Test backend health
if curl -s -f "http://localhost:3333/health" >/dev/null 2>&1; then
    print_success "Backend health check passed"
else
    print_error "Backend health check failed"
    exit 1
fi

# Test API endpoint
if curl -s -f "http://localhost:3333/api/produtos" >/dev/null 2>&1; then
    print_success "Products API endpoint accessible"
else
    print_warning "Products API returned non-200 (may be empty or require auth)"
fi

# Test frontend
if curl -s -f "http://localhost:8081" >/dev/null 2>&1; then
    print_success "Frontend accessible"
else
    print_warning "Frontend may still be starting..."
fi

echo ""
echo "=========================================="
echo -e "${GREEN}  Project Started Successfully!${NC}"
echo "=========================================="
echo ""
echo "Services running:"
echo "  • PostgreSQL: localhost:5432"
echo "  • Backend API: http://localhost:3333"
echo "  • Frontend (Expo): http://localhost:8081"
echo ""
echo "To stop the project:"
echo "  • Backend: kill \$(cat /tmp/backend.pid) 2>/dev/null || true"
echo "  • Frontend: kill \$(cat /tmp/frontend.pid) 2>/dev/null || true"
echo "  • PostgreSQL: cd $CONTAINER_DIR && docker-compose down"
echo ""
echo "Logs:"
echo "  • Backend: /tmp/backend.log"
echo "  • Frontend: /tmp/frontend.log"
echo ""
echo "Next steps:"
echo "  1. Open Expo Go on your phone and scan the QR code"
echo "  2. Or press 'i' in the Expo terminal for iOS Simulator"
echo "  3. Or press 'a' in the Expo terminal for Android Emulator"
echo ""

print_step "Project startup complete!"