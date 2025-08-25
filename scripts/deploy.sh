#!/bin/bash

# BriarBot Deployment Script for Ubuntu Home Server
# This script helps deploy BriarBot using Docker Compose

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}================================${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        echo "Please install Docker first:"
        echo "curl -fsSL https://get.docker.com -o get-docker.sh"
        echo "sudo sh get-docker.sh"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available!"
        echo "Please install Docker Compose or update Docker to a version with built-in compose"
        exit 1
    fi
}

# Check if user is in docker group
check_docker_permissions() {
    if ! docker info &> /dev/null; then
        print_warning "Cannot access Docker daemon. You may need to:"
        echo "1. Add your user to the docker group: sudo usermod -aG docker \$USER"
        echo "2. Log out and log back in"
        echo "3. Or run this script with sudo"
        read -p "Continue anyway? [y/N]: " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p cache/heroes
    mkdir -p logs
    mkdir -p monitoring
    
    # Set proper permissions
    sudo chown -R 1001:1001 cache/ 2>/dev/null || chown -R 1001:1001 cache/ 2>/dev/null || true
    sudo chown -R 1001:1001 logs/ 2>/dev/null || chown -R 1001:1001 logs/ 2>/dev/null || true
    
    print_success "Directories created"
}

# Setup environment file
setup_environment() {
    if [ ! -f ".env" ]; then
        print_status "Setting up environment configuration..."
        
        if [ -f ".env.template" ]; then
            cp .env.template .env
            print_warning "Created .env from template. Please edit .env and add your Discord bot token!"
            echo "You need to set BOT_TOKEN in the .env file"
            
            read -p "Open .env file for editing now? [y/N]: " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                ${EDITOR:-nano} .env
            fi
        else
            print_error ".env.template not found. Please create .env manually with your BOT_TOKEN"
            exit 1
        fi
    else
        print_success "Environment file already exists"
        
        # Check if BOT_TOKEN is set
        if grep -q "your_discord_bot_token_here" .env; then
            print_warning "Please update your Discord bot token in .env file!"
        fi
    fi
}

# Build and deploy
deploy_bot() {
    print_status "Building and deploying BriarBot..."
    
    # Determine which compose command to use
    COMPOSE_CMD="docker-compose"
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    fi
    
    # Use production compose file if available
    COMPOSE_FILE="docker-compose.yml"
    if [ "$1" = "prod" ] && [ -f "docker-compose.prod.yml" ]; then
        COMPOSE_FILE="docker-compose.prod.yml"
        print_status "Using production configuration"
    fi
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    $COMPOSE_CMD -f $COMPOSE_FILE down --remove-orphans || true
    
    # Build and start
    print_status "Building Docker image..."
    $COMPOSE_CMD -f $COMPOSE_FILE build --no-cache
    
    print_status "Starting BriarBot..."
    $COMPOSE_CMD -f $COMPOSE_FILE up -d
    
    # Wait a moment for startup
    sleep 5
    
    # Check if container is running
    if $COMPOSE_CMD -f $COMPOSE_FILE ps | grep -q "Up"; then
        print_success "BriarBot deployed successfully!"
        print_status "Container status:"
        $COMPOSE_CMD -f $COMPOSE_FILE ps
    else
        print_error "Deployment may have failed. Check logs:"
        $COMPOSE_CMD -f $COMPOSE_FILE logs --tail=20
        exit 1
    fi
}

# Show logs
show_logs() {
    print_status "Showing BriarBot logs (Ctrl+C to exit)..."
    
    COMPOSE_CMD="docker-compose"
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    fi
    
    $COMPOSE_CMD logs -f briar-bot
}

# Show status
show_status() {
    print_status "BriarBot Status:"
    
    COMPOSE_CMD="docker-compose"
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    fi
    
    $COMPOSE_CMD ps
    echo
    
    print_status "Recent logs:"
    $COMPOSE_CMD logs --tail=10 briar-bot
}

# Stop the bot
stop_bot() {
    print_status "Stopping BriarBot..."
    
    COMPOSE_CMD="docker-compose"
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    fi
    
    $COMPOSE_CMD down
    print_success "BriarBot stopped"
}

# Update the bot
update_bot() {
    print_status "Updating BriarBot..."
    
    # Pull latest code (if git repo)
    if [ -d ".git" ]; then
        print_status "Pulling latest code..."
        git pull
    fi
    
    deploy_bot $1
    print_success "BriarBot updated!"
}

# Main menu
show_menu() {
    print_header "BriarBot Deployment Manager"
    echo "1. Deploy BriarBot"
    echo "2. Deploy BriarBot (Production mode)"
    echo "3. Show status"
    echo "4. Show logs"
    echo "5. Stop BriarBot"
    echo "6. Update BriarBot"
    echo "7. Run cache status"
    echo "8. Run tests"
    echo "9. Exit"
    echo
    read -p "Choose an option [1-9]: " choice
    
    case $choice in
        1) deploy_bot ;;
        2) deploy_bot prod ;;
        3) show_status ;;
        4) show_logs ;;
        5) stop_bot ;;
        6) update_bot ;;
        7) docker exec -it briar-bot-prod npm run cache:status 2>/dev/null || docker exec -it briar-bot npm run cache:status ;;
        8) docker exec -it briar-bot-prod npm test 2>/dev/null || docker exec -it briar-bot npm test ;;
        9) exit 0 ;;
        *) print_error "Invalid option" ;;
    esac
}

# Parse command line arguments
case "$1" in
    "deploy")
        print_header "BriarBot Deployment"
        check_docker
        check_docker_permissions
        create_directories
        setup_environment
        deploy_bot
        ;;
    "deploy-prod")
        print_header "BriarBot Production Deployment"
        check_docker
        check_docker_permissions
        create_directories
        setup_environment
        deploy_bot prod
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "stop")
        stop_bot
        ;;
    "update")
        update_bot
        ;;
    *)
        show_menu
        ;;
esac