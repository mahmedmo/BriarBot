# 🌙 BriarBot v2.0

*"The witch stirs... speak your desires, mortal."*

**High-Performance Epic Seven Discord Bot with Persistent Caching**

BriarBot is an advanced Discord bot that provides optimal build recommendations for Epic Seven heroes. This version features robust persistent caching, intelligent rate limiting, request deduplication, and is optimized for deployment on home servers.

## ✨ Features

### 🚀 Performance & Reliability
- **Persistent File-Based Caching** - 30-day TTL with automatic cleanup
- **Intelligent Rate Limiting** - Adaptive backoff strategies with circuit breaker
- **Request Deduplication** - Prevents duplicate simultaneous requests
- **Optimized Image Generation** - Puppeteer-based with memory management

### 🔍 Search & Analysis  
- **Advanced Hero Search** - Exact matches, abbreviations, fuzzy search
- **Community Abbreviations** - Supports popular hero nicknames (arby, ssb, lqc)
- **Build Analysis** - Comprehensive statistics from 3000+ builds per hero
- **Artifact Correction** - Fixes known typos (e.g., "Elegiac Candles" → "Elegiac Candle")

### 🐳 Production Ready
- **Docker Containerization** - Multi-stage Alpine-based builds
- **Health Monitoring** - HTTP endpoints for status and metrics
- **Comprehensive Testing** - Interactive and automated test suites
- **Easy Deployment** - One-command setup for Ubuntu home servers

## 📋 Requirements

- **Ubuntu 20.04+** (or compatible Linux distribution)
- **Docker & Docker Compose**
- **2GB RAM minimum** (4GB recommended)
- **5GB disk space** for cache and images
- **Discord Bot Token** (see setup instructions)

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone <your-repo-url> BriarBot
cd BriarBot
chmod +x install.sh scripts/deploy.sh
./install.sh
```

### 2. Configure Environment
```bash
# Edit .env file with your Discord bot token
cp .env.template .env
nano .env  # Add your BOT_TOKEN
```

### 3. Deploy
```bash
# Quick deployment
./scripts/deploy.sh deploy

# Or use the interactive menu
./scripts/deploy.sh
```

### 4. Verify Installation
```bash
# Check status
./scripts/deploy.sh status

# View logs
./scripts/deploy.sh logs

# Test the bot
npm run test:interactive
```

## 🔧 Configuration

### Environment Variables
```bash
# Required
BOT_TOKEN=your_discord_bot_token_here

# Optional Performance Tuning
CACHE_TTL_DAYS=30              # Cache expiry (default: 30 days)
CACHE_MAX_SIZE=500             # Max cached images (default: 500)
RATE_LIMIT_MAX_RETRIES=12      # API retry attempts (default: 12)
HEALTH_PORT=3000               # Health check port (default: 3000)
```

### Cache Management
```bash
# View cache status
npm run cache:status

# Clean expired entries
npm run cache:cleanup

# List cached heroes
npm run cache:list

# Add specific hero to cache
npm run cache:add -- "Arbiter Vildred"
```

## 📊 Monitoring & Health Checks

BriarBot includes comprehensive health monitoring accessible via HTTP endpoints:

### Available Endpoints
- `GET /health` - Basic health status
- `GET /metrics` - Prometheus-style metrics
- `GET /status` - Detailed system status
- `GET /cache` - Cache statistics
- `GET /ready` - Kubernetes readiness probe
- `GET /live` - Kubernetes liveness probe

### Accessing Monitoring
```bash
# Local health check
curl http://localhost:3000/health

# View detailed status
curl http://localhost:3000/status
```

## 🧪 Testing

### Interactive Testing
```bash
# Launch interactive test runner
npm run test:interactive
# or
npm test
```

### Automated Testing
```bash
# Run full automated test suite
npm run test:auto
```

## 🐳 Docker Deployment

### Production Deployment
```bash
# Build and deploy with production config
docker-compose -f docker-compose.prod.yml up -d

# Or use the deployment script
./scripts/deploy.sh deploy-prod
```

### Development with Monitoring
```bash
# Deploy with optional monitoring stack
docker-compose --profile monitoring up -d
```

## 🔍 Usage

### Discord Commands
```bash
# Basic hero lookup
!arbiter vildred
!violet
!ssb                    # Seaside Bellona

# Community abbreviations
!arby                   # Arbiter Vildred
!lqc                    # Little Queen Charlotte
!spoli                  # Sea Phantom Politis

# Moonlight prefix
!ml ken                 # Martial Artist Ken
!ml violet              # Remnant Violet

# Discord format (+ signs)
!arbiter+vildred
!little+queen+charlotte

# Fuzzy matching
!arbter vildred         # Still finds Arbiter Vildred
```

### Bot Response Indicators
- ⚡ = Cached result (fast response)
- ☾ = Generated new image
- 🌒 = Fuzzy match with confidence %

## 🚨 Troubleshooting

### Common Issues

#### Bot Not Responding
```bash
# Check container status
docker-compose ps

# View recent logs
docker-compose logs --tail=50 briar-bot

# Check Discord connection
curl http://localhost:3000/health
```

#### Cache Problems
```bash
# Validate cache integrity
npm run cache:status

# Clean up expired entries
npm run cache:cleanup
```

## 📈 Performance Optimization

### Key Metrics to Monitor
- **Cache Hit Rate** - Target: >85%
- **Response Time** - Target: <2s for cached, <10s for new
- **Memory Usage** - Keep under 1.5GB
- **API Success Rate** - Target: >90%

### Cache Optimization
```bash
# Pre-populate cache with popular heroes
npm run cache:add -- "Arbiter Vildred"
npm run cache:add -- "Seaside Bellona"
```

## 📄 Project Structure

```
BriarBot/
├── src/
│   ├── briar-bot.js              # Main bot logic
│   ├── cache-manager.js          # Persistent caching system
│   ├── rate-limiter.js           # Intelligent rate limiting
│   ├── health-monitor.js         # HTTP health endpoints
│   └── character-search.js       # Hero search & fuzzy matching
├── tests/
│   ├── interactive-test-runner.js    # Interactive testing
│   └── automated-test-suite.js       # CI/CD testing
├── scripts/
│   ├── deploy.sh                     # Deployment manager
│   └── cache-manager.js              # Cache utilities
├── docker-compose.yml               # Docker setup
├── Dockerfile                       # Multi-stage build
└── install.sh                      # One-click installer
```

## 📝 Recent Updates (v2.0)

- ✨ **Persistent file-based caching system** (30-day TTL)
- 🚀 **Intelligent rate limiting** with circuit breaker
- 🔍 **Request deduplication system**
- 🏥 **Comprehensive health monitoring** with HTTP endpoints
- 🐳 **Production-ready Docker deployment**
- 🧪 **Interactive and automated testing suites**
- 📊 **Prometheus metrics export**
- 🛠️ **One-click installer** for Ubuntu home servers
- 🔧 **Cache management utilities**
- 🎯 **Artifact name correction** (Elegiac Candles fix)

## 🤝 Contributing

### Development Setup
```bash
git clone <repo-url>
cd BriarBot
npm install
cp .env.template .env
npm run test:interactive
```

## Built With

- **Discord.js** - Discord API wrapper
- **Puppeteer** - Headless Chrome for image generation
- **PM2** - Process management
- **Docker** - Containerization
- **Epic Seven Optimizer Data** - Build statistics API

---

*☾ The witch awaits your command... now with enterprise-grade performance! 🏠*