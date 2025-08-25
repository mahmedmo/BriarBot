#!/usr/bin/env node

const path = require('path');
const CacheManager = require('../src/cache-manager');
const { findBestCharacterMatch } = require('../src/character-search');
const fs = require('fs');

// Initialize cache manager
const cacheManager = new CacheManager({
    cacheDir: path.join(__dirname, '..', 'cache'),
    ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxCacheSize: 500
});

// ANSI color codes for better console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(title) {
    console.log('\n' + colorize('='.repeat(50), 'cyan'));
    console.log(colorize(`  ${title}`, 'bold'));
    console.log(colorize('='.repeat(50), 'cyan') + '\n');
}

function printStatus() {
    printHeader('BRIARBOT CACHE STATUS');
    
    const stats = cacheManager.getCacheStats();
    const metadata = cacheManager.getMetadata();
    
    console.log(colorize('Cache Statistics:', 'bold'));
    console.log(`  📊 Total Images: ${colorize(stats.totalImages, 'green')}`);
    console.log(`  ✅ Valid Images: ${colorize(stats.validImages, 'green')}`);
    console.log(`  💾 Total Size: ${colorize(stats.totalSizeMB + ' MB', 'yellow')}`);
    console.log(`  📈 Success Rate: ${colorize(stats.successRate + '%', 'cyan')}`);
    console.log(`  🎯 Cache Hits: ${colorize(stats.cacheHitsSinceStart, 'magenta')}`);
    
    if (stats.oldestEntry) {
        const oldestDate = new Date(stats.oldestEntry);
        const newestDate = new Date(stats.newestEntry);
        console.log(`  📅 Oldest Entry: ${colorize(oldestDate.toLocaleDateString(), 'dim')}`);
        console.log(`  🆕 Newest Entry: ${colorize(newestDate.toLocaleDateString(), 'dim')}`);
    }
    
    console.log(`\n${colorize('Recent Activity:', 'bold')}`);
    console.log(`  🔄 Last Global Update: ${colorize(new Date(metadata.lastGlobalUpdate).toLocaleString(), 'white')}`);
    
    if (metadata.failedHeroes && metadata.failedHeroes.length > 0) {
        console.log(`\n${colorize('Failed Heroes:', 'red')}`);
        metadata.failedHeroes.slice(-5).forEach(fail => {
            console.log(`  ❌ ${fail.hero}: ${fail.error} (${new Date(fail.timestamp).toLocaleString()})`);
        });
    }
    
    // Top 10 most accessed heroes
    const heroEntries = Object.entries(metadata.heroes)
        .filter(([_, data]) => data.accessCount > 0)
        .sort(([,a], [,b]) => (b.accessCount || 0) - (a.accessCount || 0))
        .slice(0, 10);
    
    if (heroEntries.length > 0) {
        console.log(`\n${colorize('Most Popular Heroes:', 'bold')}`);
        heroEntries.forEach(([hero, data], index) => {
            const rank = colorize(`#${index + 1}`, 'cyan');
            const name = colorize(hero, 'white');
            const count = colorize(`${data.accessCount} hits`, 'green');
            console.log(`  ${rank} ${name} - ${count}`);
        });
    }
}

function cleanupCache() {
    printHeader('CACHE CLEANUP');
    
    console.log(colorize('🧹 Starting cache cleanup...', 'yellow'));
    
    // Validate cache integrity
    console.log('  Validating cache integrity...');
    cacheManager.validateCacheIntegrity();
    
    // Clean expired entries
    console.log('  Cleaning expired entries...');
    const expiredCount = cacheManager.cleanupExpiredEntries();
    
    console.log(colorize(`✅ Cleanup completed!`, 'green'));
    console.log(`  Removed ${colorize(expiredCount, 'yellow')} expired entries`);
    
    // Show updated stats
    const stats = cacheManager.getCacheStats();
    console.log(`  Cache now has ${colorize(stats.totalImages, 'cyan')} images (${colorize(stats.totalSizeMB + ' MB', 'yellow')})`);
}

async function addHeroToCache(heroName) {
    printHeader(`ADDING HERO TO CACHE: ${heroName.toUpperCase()}`);
    
    // Search for the hero first
    const searchResult = findBestCharacterMatch(heroName);
    
    if (!searchResult) {
        console.log(colorize(`❌ Hero "${heroName}" not found`, 'red'));
        return false;
    }
    
    const actualHeroName = searchResult.character;
    console.log(`🔍 Found hero: ${colorize(actualHeroName, 'green')} (${(searchResult.confidence * 100).toFixed(1)}% match)`);
    
    // Check if already cached
    if (cacheManager.isCached(actualHeroName)) {
        console.log(colorize(`⚡ ${actualHeroName} is already cached`, 'yellow'));
        return true;
    }
    
    try {
        console.log(`📊 Fetching build data for ${actualHeroName}...`);
        
        // We need to import the bot functions to generate the image
        const { analyzeHeroData, generateReportImage } = require('../src/briar-bot');
        
        const heroAnalysis = await analyzeHeroData(actualHeroName);
        if (!heroAnalysis) {
            console.log(colorize(`❌ Failed to fetch data for ${actualHeroName}`, 'red'));
            return false;
        }
        
        console.log(`🖼️  Generating image for ${actualHeroName}...`);
        const screenshot = await generateReportImage(heroAnalysis);
        
        console.log(`💾 Caching image for ${actualHeroName}...`);
        const cached = await cacheManager.cacheHeroImage(actualHeroName, screenshot, heroAnalysis);
        
        if (cached) {
            console.log(colorize(`✅ Successfully cached ${actualHeroName}`, 'green'));
            console.log(`  📊 ${heroAnalysis.totalBuilds} builds analyzed`);
            console.log(`  📁 Image size: ${(screenshot.length / 1024).toFixed(1)} KB`);
            return true;
        } else {
            console.log(colorize(`❌ Failed to cache ${actualHeroName}`, 'red'));
            return false;
        }
        
    } catch (error) {
        console.log(colorize(`❌ Error caching ${actualHeroName}: ${error.message}`, 'red'));
        return false;
    }
}

function removeHeroFromCache(heroName) {
    printHeader(`REMOVING HERO FROM CACHE: ${heroName.toUpperCase()}`);
    
    const searchResult = findBestCharacterMatch(heroName);
    if (!searchResult) {
        console.log(colorize(`❌ Hero "${heroName}" not found`, 'red'));
        return false;
    }
    
    const actualHeroName = searchResult.character;
    console.log(`🔍 Found hero: ${colorize(actualHeroName, 'green')}`);
    
    if (!cacheManager.isCached(actualHeroName)) {
        console.log(colorize(`⚠️  ${actualHeroName} is not cached`, 'yellow'));
        return false;
    }
    
    const removed = cacheManager.removeCachedHero(actualHeroName);
    if (removed) {
        console.log(colorize(`✅ Successfully removed ${actualHeroName} from cache`, 'green'));
        return true;
    } else {
        console.log(colorize(`❌ Failed to remove ${actualHeroName} from cache`, 'red'));
        return false;
    }
}

function resetCache() {
    printHeader('RESETTING ENTIRE CACHE');
    
    console.log(colorize('⚠️  WARNING: This will delete ALL cached images!', 'red'));
    console.log('Are you sure? This action cannot be undone.');
    console.log('To confirm, run: npm run cache:reset -- --confirm');
    
    const args = process.argv.slice(2);
    if (!args.includes('--confirm')) {
        console.log(colorize('❌ Cache reset cancelled (missing --confirm flag)', 'yellow'));
        return false;
    }
    
    console.log(colorize('🔄 Resetting cache...', 'yellow'));
    const reset = cacheManager.resetCache();
    
    if (reset) {
        console.log(colorize('✅ Cache has been completely reset', 'green'));
        return true;
    } else {
        console.log(colorize('❌ Failed to reset cache', 'red'));
        return false;
    }
}

function listCachedHeroes() {
    printHeader('CACHED HEROES LIST');
    
    const metadata = cacheManager.getMetadata();
    const heroEntries = Object.entries(metadata.heroes)
        .sort(([,a], [,b]) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    
    if (heroEntries.length === 0) {
        console.log(colorize('📭 No heroes cached yet', 'yellow'));
        return;
    }
    
    console.log(`${colorize('Total cached heroes:', 'bold')} ${colorize(heroEntries.length, 'green')}\n`);
    
    heroEntries.forEach(([hero, data], index) => {
        const lastUpdated = new Date(data.lastUpdated);
        const daysSince = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
        const sizeKB = data.fileSizeBytes ? (data.fileSizeBytes / 1024).toFixed(1) : 'Unknown';
        const accessCount = data.accessCount || 0;
        
        const status = data.validData ? colorize('✅', 'green') : colorize('❌', 'red');
        const heroName = colorize(hero, 'white');
        const builds = colorize(`${data.totalBuilds || 0} builds`, 'cyan');
        const size = colorize(`${sizeKB} KB`, 'yellow');
        const age = daysSince === 0 ? colorize('Today', 'green') : colorize(`${daysSince}d ago`, 'dim');
        const hits = accessCount > 0 ? colorize(`${accessCount} hits`, 'magenta') : colorize('Never accessed', 'dim');
        
        console.log(`${status} ${heroName} - ${builds}, ${size}, ${age}, ${hits}`);
    });
}

// Main CLI interface
function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'status':
            printStatus();
            break;
            
        case 'cleanup':
            cleanupCache();
            break;
            
        case 'add':
            if (!args[1]) {
                console.log(colorize('❌ Please specify a hero name: npm run cache:add -- "Hero Name"', 'red'));
                return;
            }
            addHeroToCache(args[1]).catch(error => {
                console.error(colorize(`❌ Error: ${error.message}`, 'red'));
            });
            break;
            
        case 'remove':
            if (!args[1]) {
                console.log(colorize('❌ Please specify a hero name: npm run cache:remove -- "Hero Name"', 'red'));
                return;
            }
            removeHeroFromCache(args[1]);
            break;
            
        case 'reset':
            resetCache();
            break;
            
        case 'list':
            listCachedHeroes();
            break;
            
        default:
            printHeader('BRIARBOT CACHE MANAGER');
            console.log(colorize('Available commands:', 'bold'));
            console.log('  📊 npm run cache:status    - Show cache statistics');
            console.log('  🧹 npm run cache:cleanup   - Clean expired entries');
            console.log('  ➕ npm run cache:add       - Add hero to cache');
            console.log('  ➖ npm run cache:remove    - Remove hero from cache');
            console.log('  📋 npm run cache:list      - List all cached heroes');
            console.log('  🔄 npm run cache:reset     - Reset entire cache');
            console.log('\nExamples:');
            console.log('  npm run cache:add -- "Arbiter Vildred"');
            console.log('  npm run cache:remove -- "Violet"');
            console.log('  npm run cache:reset -- --confirm');
            break;
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error(colorize(`💥 Fatal Error: ${error.message}`, 'red'));
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(colorize(`💥 Unhandled Rejection: ${reason}`, 'red'));
    process.exit(1);
});

main();