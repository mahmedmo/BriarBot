const EventEmitter = require('events');

class RateLimiter extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Configuration
        this.config = {
            maxRetries: options.maxRetries || 10,
            baseDelay: options.baseDelay || 1000, // 1 second
            maxDelay: options.maxDelay || 300000, // 5 minutes
            jitterFactor: options.jitterFactor || 0.1,
            backoffMultiplier: options.backoffMultiplier || 2,
            circuitBreakerThreshold: options.circuitBreakerThreshold || 10,
            circuitBreakerResetTime: options.circuitBreakerResetTime || 600000, // 10 minutes
            successRateThreshold: options.successRateThreshold || 0.1 // 10% success rate to maintain aggressive mode
        };
        
        // State tracking
        this.apiHealth = {
            consecutive403s: 0,
            consecutive429s: 0,
            totalRequests: 0,
            successfulRequests: 0,
            lastSuccessTime: Date.now(),
            windowStart: Date.now(),
            requestsThisWindow: 0,
            windowSize: 60000 // 1 minute windows for health tracking
        };
        
        // Circuit breaker state
        this.circuitBreaker = {
            isOpen: false,
            openedAt: null,
            failureCount: 0
        };
        
        // Adaptive strategies based on response patterns
        this.strategies = {
            GENTLE: 'gentle',
            MODERATE: 'moderate', 
            AGGRESSIVE: 'aggressive',
            STEALTH: 'stealth',
            CIRCUIT_BREAKER: 'circuit_breaker'
        };
        
        this.currentStrategy = this.strategies.MODERATE;
    }

    /**
     * Calculate delay based on retry count and current strategy
     * @param {number} retryCount 
     * @param {number} statusCode 
     * @returns {number} Delay in milliseconds
     */
    calculateDelay(retryCount, statusCode = null) {
        const strategy = this.getCurrentStrategy();
        let baseDelay = this.config.baseDelay;
        let multiplier = this.config.backoffMultiplier;
        let jitter = 0;
        
        // Update API health metrics
        this.updateApiHealth(statusCode);
        
        switch (strategy) {
            case this.strategies.GENTLE:
                // Conservative approach - longer waits, more predictable
                baseDelay = this.config.baseDelay * 2;
                multiplier = 1.5;
                jitter = this.addJitter(baseDelay * Math.pow(multiplier, retryCount), 0.05);
                break;
                
            case this.strategies.MODERATE:
                // Balanced approach - standard exponential backoff
                jitter = this.addJitter(baseDelay * Math.pow(multiplier, retryCount), this.config.jitterFactor);
                break;
                
            case this.strategies.AGGRESSIVE:
                // Fast retries but with intelligent backing off
                if (retryCount < 3) {
                    baseDelay = this.config.baseDelay * 0.5; // Faster initial retries
                } else {
                    baseDelay = this.config.baseDelay * Math.pow(1.8, retryCount - 3);
                }
                jitter = this.addJitter(baseDelay, 0.15);
                break;
                
            case this.strategies.STEALTH:
                // Long delays to avoid detection patterns
                baseDelay = this.config.baseDelay * 5;
                multiplier = 3;
                jitter = this.addJitter(baseDelay * Math.pow(multiplier, Math.min(retryCount, 3)), 0.2);
                break;
                
            case this.strategies.CIRCUIT_BREAKER:
                // Circuit breaker is open - very long delays
                return Math.min(300000 + Math.random() * 300000, this.config.maxDelay); // 5-10 minutes
                
            default:
                jitter = this.addJitter(baseDelay * Math.pow(multiplier, retryCount), this.config.jitterFactor);
        }
        
        // Status-specific adjustments
        if (statusCode === 429) {
            jitter *= 2; // Rate limit - double the delay
        } else if (statusCode === 403) {
            jitter *= 1.5; // Forbidden - increase delay moderately
        }
        
        // Ensure delay doesn't exceed maximum
        return Math.min(jitter, this.config.maxDelay);
    }
    
    /**
     * Add jitter to prevent thundering herd
     * @param {number} baseValue 
     * @param {number} jitterFactor 
     * @returns {number}
     */
    addJitter(baseValue, jitterFactor) {
        const jitterRange = baseValue * jitterFactor;
        return baseValue + (Math.random() - 0.5) * 2 * jitterRange;
    }
    
    /**
     * Update API health metrics and adjust strategy
     * @param {number} statusCode 
     */
    updateApiHealth(statusCode) {
        const now = Date.now();
        this.apiHealth.totalRequests++;
        
        // Reset window if needed
        if (now - this.apiHealth.windowStart > this.apiHealth.windowSize) {
            this.apiHealth.windowStart = now;
            this.apiHealth.requestsThisWindow = 0;
        }
        this.apiHealth.requestsThisWindow++;
        
        if (statusCode === 200 || statusCode === null) {
            this.apiHealth.successfulRequests++;
            this.apiHealth.lastSuccessTime = now;
            this.apiHealth.consecutive403s = 0;
            this.apiHealth.consecutive429s = 0;
            this.circuitBreaker.failureCount = 0;
        } else if (statusCode === 403) {
            this.apiHealth.consecutive403s++;
            this.circuitBreaker.failureCount++;
        } else if (statusCode === 429) {
            this.apiHealth.consecutive429s++;
            this.circuitBreaker.failureCount++;
        }
        
        // Check circuit breaker
        this.checkCircuitBreaker();
        
        // Adapt strategy based on health
        this.adaptStrategy();
    }
    
    /**
     * Check if circuit breaker should be opened/closed
     */
    checkCircuitBreaker() {
        const now = Date.now();
        
        // Check if we should open the circuit breaker
        if (!this.circuitBreaker.isOpen && 
            this.circuitBreaker.failureCount >= this.config.circuitBreakerThreshold) {
            this.circuitBreaker.isOpen = true;
            this.circuitBreaker.openedAt = now;
            this.currentStrategy = this.strategies.CIRCUIT_BREAKER;
            
            this.emit('circuitBreakerOpen', {
                failures: this.circuitBreaker.failureCount,
                timestamp: now
            });
            
            console.log(`🔴 CIRCUIT BREAKER OPEN: ${this.circuitBreaker.failureCount} consecutive failures`);
        }
        
        // Check if we should close the circuit breaker
        if (this.circuitBreaker.isOpen && 
            now - this.circuitBreaker.openedAt > this.config.circuitBreakerResetTime) {
            this.circuitBreaker.isOpen = false;
            this.circuitBreaker.openedAt = null;
            this.circuitBreaker.failureCount = 0;
            
            this.emit('circuitBreakerClose', {
                timestamp: now
            });
            
            console.log(`🟢 CIRCUIT BREAKER CLOSED: Attempting to resume normal operations`);
        }
    }
    
    /**
     * Adapt strategy based on current API health
     */
    adaptStrategy() {
        if (this.circuitBreaker.isOpen) {
            this.currentStrategy = this.strategies.CIRCUIT_BREAKER;
            return;
        }
        
        const now = Date.now();
        const timeSinceLastSuccess = now - this.apiHealth.lastSuccessTime;
        const successRate = this.apiHealth.totalRequests > 0 ? 
            this.apiHealth.successfulRequests / this.apiHealth.totalRequests : 0;
        
        // Determine strategy based on health metrics
        if (this.apiHealth.consecutive403s >= 5) {
            this.currentStrategy = this.strategies.STEALTH;
        } else if (this.apiHealth.consecutive429s >= 3) {
            this.currentStrategy = this.strategies.GENTLE;
        } else if (successRate < this.config.successRateThreshold) {
            this.currentStrategy = this.strategies.MODERATE;
        } else if (timeSinceLastSuccess < 30000 && successRate > 0.8) { // Last success within 30s and high success rate
            this.currentStrategy = this.strategies.AGGRESSIVE;
        } else {
            this.currentStrategy = this.strategies.MODERATE;
        }
    }
    
    /**
     * Get current strategy
     * @returns {string}
     */
    getCurrentStrategy() {
        return this.currentStrategy;
    }
    
    /**
     * Get API health statistics
     * @returns {Object}
     */
    getHealthStats() {
        const successRate = this.apiHealth.totalRequests > 0 ? 
            (this.apiHealth.successfulRequests / this.apiHealth.totalRequests * 100).toFixed(1) : '0';
        
        return {
            strategy: this.currentStrategy,
            successRate: `${successRate}%`,
            totalRequests: this.apiHealth.totalRequests,
            successfulRequests: this.apiHealth.successfulRequests,
            consecutive403s: this.apiHealth.consecutive403s,
            consecutive429s: this.apiHealth.consecutive429s,
            lastSuccessTime: new Date(this.apiHealth.lastSuccessTime).toISOString(),
            timeSinceLastSuccess: Date.now() - this.apiHealth.lastSuccessTime,
            circuitBreakerOpen: this.circuitBreaker.isOpen,
            requestsThisWindow: this.apiHealth.requestsThisWindow,
            windowStart: new Date(this.apiHealth.windowStart).toISOString()
        };
    }
    
    /**
     * Should we attempt a request given current state?
     * @returns {boolean}
     */
    shouldAttemptRequest() {
        if (this.circuitBreaker.isOpen) {
            // Allow occasional probe requests when circuit breaker is open
            return Math.random() < 0.1; // 10% chance
        }
        return true;
    }
    
    /**
     * Get strategy explanation for logging
     * @param {number} retryCount 
     * @param {number} delay 
     * @returns {string}
     */
    getStrategyExplanation(retryCount, delay) {
        const delaySeconds = Math.round(delay / 1000);
        const health = this.getHealthStats();
        
        switch (this.currentStrategy) {
            case this.strategies.GENTLE:
                return `GENTLE (${delaySeconds}s) - High failure rate, being conservative`;
            case this.strategies.MODERATE:
                return `MODERATE (${delaySeconds}s) - Balanced approach, ${health.successRate} success rate`;
            case this.strategies.AGGRESSIVE:
                return `AGGRESSIVE (${delaySeconds}s) - Recent success, pushing harder`;
            case this.strategies.STEALTH:
                return `STEALTH (${delaySeconds}s) - Multiple 403s, avoiding detection`;
            case this.strategies.CIRCUIT_BREAKER:
                return `CIRCUIT_BREAKER (${delaySeconds}s) - API unhealthy, minimal requests`;
            default:
                return `UNKNOWN (${delaySeconds}s)`;
        }
    }
    
    /**
     * Reset all metrics (useful for testing or manual reset)
     */
    reset() {
        this.apiHealth = {
            consecutive403s: 0,
            consecutive429s: 0,
            totalRequests: 0,
            successfulRequests: 0,
            lastSuccessTime: Date.now(),
            windowStart: Date.now(),
            requestsThisWindow: 0,
            windowSize: 60000
        };
        
        this.circuitBreaker = {
            isOpen: false,
            openedAt: null,
            failureCount: 0
        };
        
        this.currentStrategy = this.strategies.MODERATE;
        
        this.emit('reset', { timestamp: Date.now() });
        console.log('📊 Rate limiter metrics reset');
    }
}

module.exports = RateLimiter;