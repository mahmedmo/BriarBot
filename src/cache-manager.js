const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CacheManager {
    constructor(options = {}) {
        this.cacheDir = options.cacheDir || path.join(process.cwd(), 'cache');
        this.heroImagesDir = path.join(this.cacheDir, 'heroes');
        this.metadataFile = path.join(this.cacheDir, 'metadata.json');
        this.defaultTTL = options.ttl || 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        this.maxCacheSize = options.maxCacheSize || 500; // Maximum number of cached images
        
        this.metadata = {
            version: '2.0',
            lastGlobalUpdate: new Date().toISOString(),
            heroes: {},
            totalHeroes: 0,
            successfulHeroes: 0,
            failedHeroes: [],
            cacheSize: 0,
            totalDiskUsage: 0
        };

        this.init();
    }

    /**
     * Initialize cache directories and load existing metadata
     */
    init() {
        try {
            // Create cache directories if they don't exist
            if (!fs.existsSync(this.cacheDir)) {
                fs.mkdirSync(this.cacheDir, { recursive: true });
            }
            if (!fs.existsSync(this.heroImagesDir)) {
                fs.mkdirSync(this.heroImagesDir, { recursive: true });
            }

            // Load existing metadata
            if (fs.existsSync(this.metadataFile)) {
                try {
                    const existingMetadata = JSON.parse(fs.readFileSync(this.metadataFile, 'utf8'));
                    this.metadata = { ...this.metadata, ...existingMetadata };
                } catch (error) {
                    console.warn('Failed to load existing metadata, starting fresh:', error.message);
                }
            }

            // Validate and clean up metadata on startup
            this.validateCacheIntegrity();
            
            console.log(`Cache Manager initialized: ${this.getCacheStats().totalImages} images cached`);
        } catch (error) {
            console.error('Failed to initialize cache manager:', error);
            throw error;
        }
    }

    /**
     * Generate a sanitized filename for hero
     * @param {string} heroName 
     * @returns {string}
     */
    generateFilename(heroName) {
        return heroName
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 50); // Prevent extremely long filenames
    }

    /**
     * Get cache key for hero
     * @param {string} heroName 
     * @returns {string}
     */
    getCacheKey(heroName) {
        return crypto.createHash('md5').update(heroName.toLowerCase()).digest('hex').substring(0, 8);
    }

    /**
     * Check if hero image is cached and not expired
     * @param {string} heroName 
     * @returns {boolean}
     */
    isCached(heroName) {
        const filename = this.generateFilename(heroName);
        const filePath = path.join(this.heroImagesDir, `${filename}.png`);
        const heroMetadata = this.metadata.heroes[heroName];

        if (!heroMetadata || !fs.existsSync(filePath)) {
            return false;
        }

        // Check if cache has expired
        const lastUpdated = new Date(heroMetadata.lastUpdated);
        const now = new Date();
        const isExpired = (now - lastUpdated) > this.defaultTTL;

        if (isExpired) {
            console.log(`Cache expired for ${heroName}, removing...`);
            this.removeCachedHero(heroName);
            return false;
        }

        return true;
    }

    /**
     * Cache hero image with metadata
     * @param {string} heroName 
     * @param {Buffer} imageBuffer 
     * @param {Object} analysisData 
     * @returns {Promise<boolean>}
     */
    async cacheHeroImage(heroName, imageBuffer, analysisData = {}) {
        try {
            const filename = this.generateFilename(heroName);
            const filePath = path.join(this.heroImagesDir, `${filename}.png`);
            const cacheKey = this.getCacheKey(heroName);
            const timestamp = new Date().toISOString();

            // Check cache size limits and perform LRU eviction if needed
            await this.enforceMaxCacheSize();

            // Write image file
            fs.writeFileSync(filePath, imageBuffer);

            // Update metadata
            this.metadata.heroes[heroName] = {
                filename: filename,
                cacheKey: cacheKey,
                lastUpdated: timestamp,
                fileExists: true,
                fileSizeBytes: imageBuffer.length,
                totalBuilds: analysisData.totalBuilds || 0,
                validData: true,
                accessCount: 0,
                lastAccessed: timestamp
            };

            // Update global metadata
            this.metadata.lastGlobalUpdate = timestamp;
            this.metadata.totalHeroes = Object.keys(this.metadata.heroes).length;
            this.metadata.successfulHeroes = Object.values(this.metadata.heroes)
                .filter(h => h.fileExists && h.validData).length;

            // Save metadata
            this.saveMetadata();

            console.log(`Cached ${heroName}: ${filename}.png (${(imageBuffer.length / 1024).toFixed(1)} KB)`);
            return true;

        } catch (error) {
            console.error(`Failed to cache ${heroName}:`, error);
            
            // Update failed heroes list
            this.metadata.failedHeroes = this.metadata.failedHeroes || [];
            this.metadata.failedHeroes.push({
                hero: heroName,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            this.saveMetadata();
            return false;
        }
    }

    /**
     * Retrieve cached hero image
     * @param {string} heroName 
     * @returns {Buffer|null}
     */
    getCachedHeroImage(heroName) {
        if (!this.isCached(heroName)) {
            return null;
        }

        try {
            const filename = this.generateFilename(heroName);
            const filePath = path.join(this.heroImagesDir, `${filename}.png`);
            const imageBuffer = fs.readFileSync(filePath);

            // Update access metadata
            if (this.metadata.heroes[heroName]) {
                this.metadata.heroes[heroName].accessCount++;
                this.metadata.heroes[heroName].lastAccessed = new Date().toISOString();
                this.saveMetadata();
            }

            return imageBuffer;
        } catch (error) {
            console.error(`Failed to read cached image for ${heroName}:`, error);
            return null;
        }
    }

    /**
     * Remove a hero from cache
     * @param {string} heroName 
     * @returns {boolean}
     */
    removeCachedHero(heroName) {
        try {
            const heroMetadata = this.metadata.heroes[heroName];
            if (heroMetadata) {
                const filePath = path.join(this.heroImagesDir, `${heroMetadata.filename}.png`);
                
                // Remove file if it exists
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }

                // Remove from metadata
                delete this.metadata.heroes[heroName];
                this.saveMetadata();
                
                console.log(`Removed ${heroName} from cache`);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Failed to remove ${heroName} from cache:`, error);
            return false;
        }
    }

    /**
     * Enforce maximum cache size using LRU eviction
     */
    async enforceMaxCacheSize() {
        const currentSize = Object.keys(this.metadata.heroes).length;
        
        if (currentSize >= this.maxCacheSize) {
            // Sort by last accessed time (oldest first)
            const heroEntries = Object.entries(this.metadata.heroes)
                .sort(([,a], [,b]) => new Date(a.lastAccessed) - new Date(b.lastAccessed));

            // Remove oldest 10% of entries
            const toRemove = Math.ceil(currentSize * 0.1);
            for (let i = 0; i < toRemove && i < heroEntries.length; i++) {
                const [heroName] = heroEntries[i];
                this.removeCachedHero(heroName);
            }

            console.log(`LRU eviction: Removed ${toRemove} old cached images`);
        }
    }

    /**
     * Clean up expired cache entries
     * @returns {number} Number of entries cleaned up
     */
    cleanupExpiredEntries() {
        let cleanedCount = 0;
        const now = new Date();

        Object.keys(this.metadata.heroes).forEach(heroName => {
            const heroMetadata = this.metadata.heroes[heroName];
            const lastUpdated = new Date(heroMetadata.lastUpdated);
            const isExpired = (now - lastUpdated) > this.defaultTTL;

            if (isExpired) {
                this.removeCachedHero(heroName);
                cleanedCount++;
            }
        });

        if (cleanedCount > 0) {
            console.log(`Cleaned up ${cleanedCount} expired cache entries`);
        }

        return cleanedCount;
    }

    /**
     * Validate cache integrity and remove invalid entries
     */
    validateCacheIntegrity() {
        let invalidCount = 0;
        
        Object.keys(this.metadata.heroes).forEach(heroName => {
            const heroMetadata = this.metadata.heroes[heroName];
            const filePath = path.join(this.heroImagesDir, `${heroMetadata.filename}.png`);
            
            if (!fs.existsSync(filePath)) {
                console.warn(`Missing file for ${heroName}, removing from metadata`);
                delete this.metadata.heroes[heroName];
                invalidCount++;
            }
        });

        if (invalidCount > 0) {
            console.log(`Removed ${invalidCount} invalid cache entries`);
            this.saveMetadata();
        }
    }

    /**
     * Get cache statistics
     * @returns {Object}
     */
    getCacheStats() {
        const heroes = Object.values(this.metadata.heroes);
        const totalSize = heroes.reduce((sum, h) => sum + (h.fileSizeBytes || 0), 0);
        const validImages = heroes.filter(h => h.fileExists && h.validData).length;
        
        return {
            totalImages: heroes.length,
            validImages: validImages,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
            successRate: heroes.length > 0 ? ((validImages / heroes.length) * 100).toFixed(1) : 0,
            oldestEntry: heroes.length > 0 ? 
                Math.min(...heroes.map(h => new Date(h.lastUpdated))) : null,
            newestEntry: heroes.length > 0 ? 
                Math.max(...heroes.map(h => new Date(h.lastUpdated))) : null,
            cacheHitsSinceStart: heroes.reduce((sum, h) => sum + (h.accessCount || 0), 0)
        };
    }

    /**
     * Save metadata to disk
     */
    saveMetadata() {
        try {
            const stats = this.getCacheStats();
            this.metadata.cacheSize = stats.totalImages;
            this.metadata.totalDiskUsage = parseFloat(stats.totalSizeMB);
            
            fs.writeFileSync(this.metadataFile, JSON.stringify(this.metadata, null, 2));
        } catch (error) {
            console.error('Failed to save metadata:', error);
        }
    }

    /**
     * Get cache metadata
     * @returns {Object}
     */
    getMetadata() {
        return { ...this.metadata };
    }

    /**
     * Reset entire cache
     * @returns {boolean}
     */
    resetCache() {
        try {
            // Remove all hero images
            if (fs.existsSync(this.heroImagesDir)) {
                const files = fs.readdirSync(this.heroImagesDir);
                files.forEach(file => {
                    fs.unlinkSync(path.join(this.heroImagesDir, file));
                });
            }

            // Reset metadata
            this.metadata = {
                version: '2.0',
                lastGlobalUpdate: new Date().toISOString(),
                heroes: {},
                totalHeroes: 0,
                successfulHeroes: 0,
                failedHeroes: [],
                cacheSize: 0,
                totalDiskUsage: 0
            };

            this.saveMetadata();
            console.log('Cache has been reset');
            return true;
        } catch (error) {
            console.error('Failed to reset cache:', error);
            return false;
        }
    }
}

module.exports = CacheManager;