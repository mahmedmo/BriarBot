const http = require('http');
const fs = require('fs');
const path = require('path');

class HealthMonitor {
    constructor(options = {}) {
        this.port = options.port || process.env.HEALTH_PORT || 3000;
        this.cacheManager = options.cacheManager;
        this.rateLimiter = options.rateLimiter;
        this.startTime = Date.now();
        this.server = null;
        
        // Health metrics
        this.metrics = {
            requests: 0,
            errors: 0,
            cacheHits: 0,
            cacheMisses: 0,
            lastError: null,
            lastRequest: null,
            uptime: 0
        };
        
        this.healthStatus = {
            status: 'starting',
            discord: 'unknown',
            cache: 'unknown',
            memory: 'unknown',
            rateLimiter: 'unknown'
        };
    }

    /**
     * Start the health check server
     * @param {Client} discordClient - Discord.js client
     */
    start(discordClient = null) {
        this.discordClient = discordClient;
        
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });
        
        this.server.listen(this.port, () => {
            console.log(`🏥 Health monitor listening on port ${this.port}`);
            this.healthStatus.status = 'running';
        });
        
        // Update health status periodically
        setInterval(() => {
            this.updateHealthStatus();
        }, 30000); // Every 30 seconds
        
        // Initial health check
        setTimeout(() => {
            this.updateHealthStatus();
        }, 5000);
    }

    /**
     * Handle HTTP requests
     */
    handleRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        this.metrics.requests++;
        this.metrics.lastRequest = new Date().toISOString();
        
        try {
            switch (url.pathname) {
                case '/health':
                case '/':
                    this.handleHealthCheck(res);
                    break;
                    
                case '/metrics':
                    this.handleMetrics(res);
                    break;
                    
                case '/status':
                    this.handleDetailedStatus(res);
                    break;
                    
                case '/cache':
                    this.handleCacheStatus(res);
                    break;
                    
                case '/ready':
                    this.handleReadinessCheck(res);
                    break;
                    
                case '/live':
                    this.handleLivenessCheck(res);
                    break;
                    
                default:
                    this.handle404(res);
            }
        } catch (error) {
            console.error('Health monitor error:', error);
            this.metrics.errors++;
            this.metrics.lastError = error.message;
            
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            }));
        }
    }

    /**
     * Basic health check endpoint
     */
    handleHealthCheck(res) {
        const isHealthy = this.isHealthy();
        const statusCode = isHealthy ? 200 : 503;
        
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: isHealthy ? 'healthy' : 'unhealthy',
            uptime: Date.now() - this.startTime,
            timestamp: new Date().toISOString(),
            version: '2.0',
            checks: this.healthStatus
        }));
    }

    /**
     * Prometheus-style metrics endpoint
     */
    handleMetrics(res) {
        const uptime = Date.now() - this.startTime;
        const cacheStats = this.cacheManager ? this.cacheManager.getCacheStats() : {};
        const rateLimiterStats = this.rateLimiter ? this.rateLimiter.getHealthStats() : {};
        const memoryUsage = process.memoryUsage();
        
        const metrics = [
            `# HELP briarbot_uptime_seconds Bot uptime in seconds`,
            `# TYPE briarbot_uptime_seconds counter`,
            `briarbot_uptime_seconds ${Math.floor(uptime / 1000)}`,
            
            `# HELP briarbot_requests_total Total number of health check requests`,
            `# TYPE briarbot_requests_total counter`,
            `briarbot_requests_total ${this.metrics.requests}`,
            
            `# HELP briarbot_errors_total Total number of errors`,
            `# TYPE briarbot_errors_total counter`,
            `briarbot_errors_total ${this.metrics.errors}`,
            
            `# HELP briarbot_memory_usage_bytes Memory usage in bytes`,
            `# TYPE briarbot_memory_usage_bytes gauge`,
            `briarbot_memory_usage_bytes{type="rss"} ${memoryUsage.rss}`,
            `briarbot_memory_usage_bytes{type="heapTotal"} ${memoryUsage.heapTotal}`,
            `briarbot_memory_usage_bytes{type="heapUsed"} ${memoryUsage.heapUsed}`,
            `briarbot_memory_usage_bytes{type="external"} ${memoryUsage.external}`,
            
            `# HELP briarbot_discord_status Discord connection status (1=connected, 0=disconnected)`,
            `# TYPE briarbot_discord_status gauge`,
            `briarbot_discord_status ${this.discordClient && this.discordClient.isReady() ? 1 : 0}`,
        ];
        
        // Cache metrics
        if (cacheStats.totalImages !== undefined) {
            metrics.push(
                `# HELP briarbot_cache_images_total Total cached images`,
                `# TYPE briarbot_cache_images_total gauge`,
                `briarbot_cache_images_total ${cacheStats.totalImages}`,
                
                `# HELP briarbot_cache_size_bytes Cache size in bytes`,
                `# TYPE briarbot_cache_size_bytes gauge`,
                `briarbot_cache_size_bytes ${parseFloat(cacheStats.totalSizeMB) * 1024 * 1024}`,
                
                `# HELP briarbot_cache_hits_total Cache hits since startup`,
                `# TYPE briarbot_cache_hits_total counter`,
                `briarbot_cache_hits_total ${cacheStats.cacheHitsSinceStart || 0}`
            );
        }
        
        // Rate limiter metrics
        if (rateLimiterStats.totalRequests !== undefined) {
            metrics.push(
                `# HELP briarbot_api_requests_total Total API requests`,
                `# TYPE briarbot_api_requests_total counter`,
                `briarbot_api_requests_total ${rateLimiterStats.totalRequests}`,
                
                `# HELP briarbot_api_success_requests_total Successful API requests`,
                `# TYPE briarbot_api_success_requests_total counter`,
                `briarbot_api_success_requests_total ${rateLimiterStats.successfulRequests}`
            );
        }
        
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(metrics.join('\n') + '\n');
    }

    /**
     * Detailed status endpoint
     */
    handleDetailedStatus(res) {
        const uptime = Date.now() - this.startTime;
        const cacheStats = this.cacheManager ? this.cacheManager.getCacheStats() : null;
        const rateLimiterStats = this.rateLimiter ? this.rateLimiter.getHealthStats() : null;
        const memoryUsage = process.memoryUsage();
        
        const status = {
            service: 'BriarBot',
            version: '2.0',
            uptime: {
                milliseconds: uptime,
                seconds: Math.floor(uptime / 1000),
                human: this.formatUptime(uptime)
            },
            discord: {
                connected: this.discordClient ? this.discordClient.isReady() : false,
                ping: this.discordClient ? this.discordClient.ws.ping : null
            },
            memory: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
                external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
            },
            cache: cacheStats,
            rateLimiter: rateLimiterStats,
            health: {
                status: this.isHealthy() ? 'healthy' : 'unhealthy',
                checks: this.healthStatus,
                lastError: this.metrics.lastError,
                totalRequests: this.metrics.requests,
                totalErrors: this.metrics.errors
            },
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status, null, 2));
    }

    /**
     * Cache status endpoint
     */
    handleCacheStatus(res) {
        if (!this.cacheManager) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Cache manager not available' }));
            return;
        }
        
        const cacheStats = this.cacheManager.getCacheStats();
        const metadata = this.cacheManager.getMetadata();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            stats: cacheStats,
            metadata: {
                version: metadata.version,
                lastGlobalUpdate: metadata.lastGlobalUpdate,
                totalHeroes: metadata.totalHeroes,
                successfulHeroes: metadata.successfulHeroes,
                failedHeroes: metadata.failedHeroes.length
            },
            timestamp: new Date().toISOString()
        }, null, 2));
    }

    /**
     * Kubernetes-style readiness check
     */
    handleReadinessCheck(res) {
        const isReady = this.isReady();
        const statusCode = isReady ? 200 : 503;
        
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            ready: isReady,
            timestamp: new Date().toISOString()
        }));
    }

    /**
     * Kubernetes-style liveness check
     */
    handleLivenessCheck(res) {
        const isAlive = this.isAlive();
        const statusCode = isAlive ? 200 : 503;
        
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            alive: isAlive,
            timestamp: new Date().toISOString()
        }));
    }

    /**
     * 404 handler
     */
    handle404(res) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Not found',
            availableEndpoints: [
                '/health', '/metrics', '/status', 
                '/cache', '/ready', '/live'
            ]
        }));
    }

    /**
     * Update health status
     */
    updateHealthStatus() {
        // Discord status
        this.healthStatus.discord = this.discordClient && this.discordClient.isReady() ? 'connected' : 'disconnected';
        
        // Cache status
        if (this.cacheManager) {
            try {
                const stats = this.cacheManager.getCacheStats();
                this.healthStatus.cache = stats.totalImages >= 0 ? 'available' : 'unavailable';
            } catch (error) {
                this.healthStatus.cache = 'error';
            }
        }
        
        // Memory status
        const memoryUsage = process.memoryUsage();
        const memoryUsedMB = memoryUsage.heapUsed / 1024 / 1024;
        this.healthStatus.memory = memoryUsedMB > 800 ? 'high' : memoryUsedMB > 400 ? 'medium' : 'normal';
        
        // Rate limiter status
        if (this.rateLimiter) {
            try {
                const stats = this.rateLimiter.getHealthStats();
                this.healthStatus.rateLimiter = stats.circuitBreakerOpen ? 'circuit_open' : 'normal';
            } catch (error) {
                this.healthStatus.rateLimiter = 'error';
            }
        }
        
        this.metrics.uptime = Date.now() - this.startTime;
    }

    /**
     * Check if service is healthy
     */
    isHealthy() {
        const criticalChecks = [
            this.healthStatus.discord !== 'disconnected',
            this.healthStatus.memory !== 'critical'
        ];
        
        return criticalChecks.every(check => check);
    }

    /**
     * Check if service is ready (Kubernetes readiness)
     */
    isReady() {
        return this.healthStatus.discord === 'connected' && 
               this.healthStatus.cache !== 'error';
    }

    /**
     * Check if service is alive (Kubernetes liveness)
     */
    isAlive() {
        const uptime = Date.now() - this.startTime;
        return uptime > 0 && this.healthStatus.memory !== 'critical';
    }

    /**
     * Format uptime in human readable format
     */
    formatUptime(uptime) {
        const seconds = Math.floor(uptime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Record a cache hit
     */
    recordCacheHit() {
        this.metrics.cacheHits++;
    }

    /**
     * Record a cache miss
     */
    recordCacheMiss() {
        this.metrics.cacheMisses++;
    }

    /**
     * Stop the health monitor
     */
    stop() {
        if (this.server) {
            this.server.close(() => {
                console.log('🏥 Health monitor stopped');
            });
        }
    }
}

module.exports = HealthMonitor;