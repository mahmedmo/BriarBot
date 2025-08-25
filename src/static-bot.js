const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { findBestCharacterMatch, getCharacterSuggestions } = require('./character-search');
const { 
    loadGameData,
    analyzeHeroData, 
    generateReportImage,
    checkRateLimit,
    heroData 
} = require('./briar-bot');
require('dotenv').config();

// Configuration
const STATIC_OUTPUT_DIR = path.join(__dirname, '..', 'static-output');
const HEROES_DIR = path.join(STATIC_OUTPUT_DIR, 'heroes');
const METADATA_FILE = path.join(STATIC_OUTPUT_DIR, 'metadata.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const BOT_TOKEN = process.env.BOT_TOKEN;

// Load metadata
function loadMetadata() {
    if (fs.existsSync(METADATA_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
        } catch (error) {
            console.error('Error loading metadata:', error);
            return null;
        }
    }
    return null;
}

// Convert hero name to safe filename (same as cache script)
function heroToFilename(heroName) {
    return heroName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ') // Replace special characters with spaces
        .replace(/\s+/g, '_')         // Replace spaces with underscores
        .replace(/_+/g, '_')          // Collapse multiple underscores
        .replace(/^_|_$/g, '');       // Remove leading/trailing underscores
}

// Get hero PNG path
function getHeroPngPath(heroName) {
    const filename = heroToFilename(heroName);
    return path.join(HEROES_DIR, `${filename}.png`);
}

// Check if cached PNG exists for hero
function hasCachedHero(heroName) {
    const pngPath = getHeroPngPath(heroName);
    return fs.existsSync(pngPath);
}

// Get cached PNG for hero
function getCachedHeroPng(heroName) {
    const pngPath = getHeroPngPath(heroName);
    if (fs.existsSync(pngPath)) {
        return fs.readFileSync(pngPath);
    }
    return null;
}

// Input validation (reuse from main bot)
function validateAndSanitizeInput(input) {
    if (input.length > 100) {
        throw new Error('Input too long. Maximum 100 characters allowed.');
    }
    
    const allowedPattern = /^[a-zA-Z0-9\s\-'.\+]+$/;
    if (!allowedPattern.test(input)) {
        throw new Error('Invalid characters in input. Only letters, numbers, spaces, hyphens, apostrophes, dots, and plus signs are allowed.');
    }
    
    return input.trim().replace(/\s+/g, ' ');
}

// Rate limiting (reuse from main bot)
const userRateLimit = new Map();
const RATE_LIMIT_REQUESTS = 5; // Higher limit since static is faster
const RATE_LIMIT_WINDOW = 30000; // 30 seconds

function checkStaticRateLimit(userId) {
    const now = Date.now();
    const userLimit = userRateLimit.get(userId);
    
    if (!userLimit) {
        userRateLimit.set(userId, { count: 1, lastReset: now });
        return { allowed: true, remainingRequests: RATE_LIMIT_REQUESTS - 1 };
    }
    
    if (now - userLimit.lastReset > RATE_LIMIT_WINDOW) {
        userRateLimit.set(userId, { count: 1, lastReset: now });
        return { allowed: true, remainingRequests: RATE_LIMIT_REQUESTS - 1 };
    }
    
    if (userLimit.count < RATE_LIMIT_REQUESTS) {
        userLimit.count++;
        return { allowed: true, remainingRequests: RATE_LIMIT_REQUESTS - userLimit.count };
    }
    
    const resetTime = Math.ceil((userLimit.lastReset + RATE_LIMIT_WINDOW - now) / 1000);
    return { allowed: false, resetTime };
}

// Get cache statistics
function getCacheStats() {
    const metadata = loadMetadata();
    if (!metadata) {
        return { 
            cached: 0, 
            total: 0, 
            percentage: 0,
            lastUpdate: 'Unknown'
        };
    }
    
    return {
        cached: metadata.successfulHeroes || 0,
        total: metadata.totalHeroes || 0,
        percentage: metadata.successfulHeroes ? 
            ((metadata.successfulHeroes / metadata.totalHeroes) * 100).toFixed(1) : 0,
        lastUpdate: metadata.lastGlobalUpdate || 'Unknown'
    };
}

// Fallback to dynamic generation
async function fallbackToDynamic(message, characterName, searchResult, confidence) {
    try {
        console.log(`🔄 Falling back to dynamic generation for ${characterName}`);
        
        const loadingMessage = await message.reply(
            `🌒 No cached data found for **${characterName}**... generating fresh data (this may take longer)...`
        );
        
        // Use the original bot's analyze and generate functions
        const heroAnalysis = await analyzeHeroData(characterName);
        
        if (heroAnalysis) {
            const screenshot = await generateReportImage(heroAnalysis);
            
            const attachment = new AttachmentBuilder(screenshot, {
                name: `${characterName.replace(/\s+/g, '_')}.png`
            });
            
            await loadingMessage.edit({
                content: `☾ ${characterName} *(generated fresh)*`,
                files: [attachment]
            });
            
            return true;
        } else {
            await loadingMessage.edit(`❌ I called for **${characterName}**... no one answered.`);
            return false;
        }
    } catch (error) {
        console.error('Error in fallback generation:', error);
        await message.reply(`❌ The witch stirs... the search for **${characterName}** is lost.`);
        return false;
    }
}

// Create HTTP server for health checks
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('BriarBot Static is running!\n');
});

// Memory cleanup
function performMemoryCleanup() {
    const now = Date.now();
    for (const [userId, data] of userRateLimit.entries()) {
        if (now - data.lastReset > RATE_LIMIT_WINDOW * 2) {
            userRateLimit.delete(userId);
        }
    }
    
    if (global.gc) {
        global.gc();
        console.log('Memory cleanup performed');
    }
}

// Only run Discord bot if this file is executed directly
if (require.main === module) {
    // Start HTTP server
    const port = process.env.PORT || 3001;
    server.listen(port, '0.0.0.0', () => {
        console.log(`Static bot HTTP server running on port ${port}`);
    });

    // Memory cleanup interval
    setInterval(performMemoryCleanup, 300000); // Every 5 minutes

    client.once('ready', async () => {
        console.log(`🤖 BriarBot Static logged in as ${client.user.tag}!`);
        
        // Load game data for fallback functionality
        console.log('📡 Loading game data for fallback...');
        await loadGameData();
        
        // Show cache statistics
        const stats = getCacheStats();
        console.log(`📊 Cache Status: ${stats.cached} heroes cached (${stats.percentage}%)`);
        console.log(`📅 Last Update: ${stats.lastUpdate}`);
        
        console.log('✅ Static bot ready!');
    });

    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        if (message.content.startsWith('!') && message.content.length > 1) {
            // Rate limiting check
            const rateLimitResult = checkStaticRateLimit(message.author.id);
            if (!rateLimitResult.allowed) {
                await message.reply(
                    `⏳ You pester me too often... begone for now, and return in ${rateLimitResult.resetTime} seconds.`
                );
                return;
            }

            const rawInput = message.content.slice(1);

            // Handle special commands
            if (rawInput.toLowerCase() === 'cache' || rawInput.toLowerCase() === 'status') {
                const stats = getCacheStats();
                await message.reply(
                    `📊 **Cache Status**\n` +
                    `Cached Heroes: ${stats.cached}\n` +
                    `Cache Coverage: ${stats.percentage}%\n` +
                    `Last Update: ${stats.lastUpdate === 'Unknown' ? 'Never' : new Date(stats.lastUpdate).toLocaleString()}\n` +
                    `*Using static cache for instant responses!*`
                );
                return;
            }

            // Input validation
            let userInput;
            try {
                userInput = validateAndSanitizeInput(rawInput);
            } catch (error) {
                await message.reply(`？ Your words make no sense... speak clearly, or be silent. **${error.message}**`);
                return;
            }

            // Find character match
            const searchResult = findBestCharacterMatch(userInput);

            if (!searchResult) {
                const suggestions = getCharacterSuggestions(userInput, 3);
                if (suggestions.length > 0) {
                    await message.reply(
                        `❌ **${userInput}** does not exist.\n*Perhaps you meant:*\n${suggestions.map(s => `• ${s}`).join('\n')}`
                    );
                } else {
                    await message.reply(`❌ **${userInput}**... nothing but silence. Don't waste my time.`);
                }
                return;
            }

            const characterName = searchResult.character;
            const confidence = (searchResult.confidence * 100).toFixed(1);

            try {
                // Check if we have cached data
                if (hasCachedHero(characterName)) {
                    // Serve from cache - super fast!
                    console.log(`⚡ Serving cached data for ${characterName}`);
                    
                    let loadingContent = `🌑 Revealing **${characterName}**...`;
                    if (searchResult.matchType !== 'exact' || confidence < 100) {
                        loadingContent = `🌒 A pale echo at a ${confidence}% match... Revealing **${characterName}**...`;
                    }
                    
                    const loadingMessage = await message.reply(loadingContent);
                    
                    const cachedPng = getCachedHeroPng(characterName);
                    if (cachedPng) {
                        const attachment = new AttachmentBuilder(cachedPng, {
                            name: `${characterName.replace(/\s+/g, '_')}.png`
                        });
                        
                        await loadingMessage.edit({
                            content: `☾ ${characterName}`,
                            files: [attachment]
                        });
                    } else {
                        throw new Error('Failed to read cached file');
                    }
                } else {
                    // No cached data - fallback to dynamic generation
                    console.log(`🔄 No cache for ${characterName}, falling back to dynamic`);
                    await fallbackToDynamic(message, characterName, searchResult, confidence);
                }

            } catch (error) {
                console.error('Error processing static request:', error);
                
                // Try fallback if static failed
                try {
                    await fallbackToDynamic(message, characterName, searchResult, confidence);
                } catch (fallbackError) {
                    console.error('Fallback also failed:', fallbackError);
                    await message.reply(`❌ The witch stirs... the search for **${characterName}** is lost.`);
                }
            }
        }
    });

    client.login(BOT_TOKEN);

    process.on('SIGINT', () => {
        console.log('Shutting down static bot...');
        client.destroy();
        process.exit(0);
    });
}

// Export functions for testing
module.exports = {
    loadMetadata,
    heroToFilename,
    getHeroPngPath,
    hasCachedHero,
    getCachedHeroPng,
    getCacheStats,
    checkStaticRateLimit
};