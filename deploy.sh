#!/bin/bash

# BriarBot Deployment Script
# This script stops, rebuilds (no cache), and restarts the bot

set -e  # Exit on error

echo "🌙 BriarBot Deployment"
echo "======================"
echo ""

# Pull latest code
echo "Pulling latest code from git..."
git pull origin main
echo ""

# Stop containers
echo "Stopping containers..."
docker compose down
echo ""

# Build without cache
echo "Building Docker image (no cache)..."
docker compose build --no-cache
echo ""

# Start containers
echo "Starting containers..."
docker compose up -d
echo ""

echo "✅ Deployment complete!"
echo ""

# Show logs
echo "Container logs (Ctrl+C to exit):"
docker compose logs -f
