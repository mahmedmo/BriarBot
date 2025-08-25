#!/bin/bash

# BriarBot Quick Install Script for Ubuntu Home Servers
# This script sets up everything needed to run BriarBot

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo -e "${CYAN}▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓${NC}"
    echo -e "${CYAN}▓${NC}           ${YELLOW}BriarBot Setup${NC}            ${CYAN}▓${NC}"
    echo -e "${CYAN}▓${NC}     Epic Seven Discord Bot        ${CYAN}▓${NC}"
    echo -e "${CYAN}▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓${NC}"
    echo
}

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

# Check OS
check_os() {
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        print_error "This script is designed for Ubuntu/Debian Linux"
        print_warning "You may need to install dependencies manually"
        read -p "Continue anyway? [y/N]: " -n 1 -r
        echo
        [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
    fi
}

# Install Docker
install_docker() {
    if command -v docker &> /dev/null; then
        print_success "Docker is already installed"
        return
    fi
    
    print_status "Installing Docker..."
    
    # Update package index
    sudo apt-get update
    
    # Install dependencies
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Add Docker repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package index again
    sudo apt-get update
    
    # Install Docker
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    # Start Docker service
    sudo systemctl start docker
    sudo systemctl enable docker
    
    print_success "Docker installed successfully"
    print_warning "You may need to log out and log back in for group changes to take effect"
}

# Setup environment
setup_env() {
    print_status "Setting up environment..."
    
    # Create .env from template
    if [ ! -f ".env" ]; then
        if [ -f ".env.template" ]; then
            cp .env.template .env
        else
            cat > .env << EOF
# BriarBot Configuration
BOT_TOKEN=your_discord_bot_token_here
NODE_ENV=production
TIMEZONE=UTC
EOF
        fi
        
        print_warning "Created .env file - you need to add your Discord bot token!"
    fi
    
    # Create directories
    mkdir -p cache/heroes logs
    
    # Set permissions (try both sudo and regular)
    chown -R 1001:1001 cache/ logs/ 2>/dev/null || sudo chown -R 1001:1001 cache/ logs/ 2>/dev/null || true
    
    print_success "Environment setup complete"
}

# Get Discord bot token
setup_discord_token() {
    print_header "Discord Bot Setup"
    
    echo "To use BriarBot, you need a Discord bot token."
    echo
    echo "Steps to get your token:"
    echo "1. Go to https://discord.com/developers/applications"
    echo "2. Click 'New Application' and give it a name"
    echo "3. Go to the 'Bot' section"
    echo "4. Click 'Add Bot'"
    echo "5. Under 'Token', click 'Copy'"
    echo "6. Enable 'MESSAGE CONTENT INTENT' in Bot settings"
    echo
    
    read -p "Do you have your Discord bot token ready? [y/N]: " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -n "Enter your Discord bot token: "
        read -s BOT_TOKEN
        echo
        
        # Update .env file
        if [[ -n "$BOT_TOKEN" ]]; then
            if grep -q "BOT_TOKEN=" .env; then
                sed -i "s/BOT_TOKEN=.*/BOT_TOKEN=$BOT_TOKEN/" .env
            else
                echo "BOT_TOKEN=$BOT_TOKEN" >> .env
            fi
            print_success "Discord bot token saved"
        else
            print_warning "No token provided - you'll need to edit .env manually"
        fi
    else
        print_warning "Please get your Discord bot token and edit the .env file"
        print_status "Edit .env and set: BOT_TOKEN=your_token_here"
    fi
}

# Test installation
test_install() {
    print_status "Testing installation..."
    
    # Check if Docker is working
    if docker --version &> /dev/null; then
        print_success "Docker is working"
    else
        print_error "Docker test failed"
        return 1
    fi
    
    # Check if bot token is set
    if grep -q "your_discord_bot_token_here" .env 2>/dev/null; then
        print_warning "Discord bot token not set in .env file"
    elif grep -q "BOT_TOKEN=" .env 2>/dev/null; then
        print_success "Bot token appears to be configured"
    else
        print_warning "Could not verify bot token configuration"
    fi
    
    return 0
}

# Main installation
main() {
    print_header
    
    print_status "Starting BriarBot installation..."
    echo
    
    # Checks
    check_os
    
    # Install Docker
    install_docker
    
    # Setup environment
    setup_env
    
    # Setup Discord token
    setup_discord_token
    
    # Test installation
    if test_install; then
        echo
        print_success "Installation completed successfully!"
        echo
        print_status "Next steps:"
        echo "1. Make sure your Discord bot token is set in .env"
        echo "2. Run: ./scripts/deploy.sh deploy"
        echo "3. Or use the deployment manager: ./scripts/deploy.sh"
        echo
        print_status "Useful commands:"
        echo "  ./scripts/deploy.sh deploy     - Deploy the bot"
        echo "  ./scripts/deploy.sh logs       - View logs"
        echo "  ./scripts/deploy.sh status     - Check status"
        echo "  npm run cache:status           - Check cache status"
        echo "  npm run test:interactive       - Run tests"
        echo
    else
        print_error "Installation completed with warnings"
        echo "Please check the issues above and run ./scripts/deploy.sh when ready"
    fi
}

# Check if running as script
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi