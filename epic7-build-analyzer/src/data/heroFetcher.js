const axios = require('axios');

class HeroFetcher {
    constructor() {
        this.heroCache = null;
        this.artifactCache = null;
        
        // Primary and fallback endpoints from Fribbels optimizer
        this.heroEndpoints = [
            "https://e7-optimizer-game-data.s3-accelerate.amazonaws.com/herodata.json",
            "https://fribbels-epic-7-optimizer-cn.azurewebsites.net/data/cache/herodata.json"
        ];
        
        this.artifactEndpoints = [
            "https://e7-optimizer-game-data.s3-accelerate.amazonaws.com/artifactdata.json", 
            "https://fribbels-epic-7-optimizer-cn.azurewebsites.net/data/cache/artifactdata.json"
        ];
    }

    async fetchFromEndpoints(endpoints, dataType) {
        for (const endpoint of endpoints) {
            try {
                console.log(`Fetching ${dataType} from: ${endpoint}`);
                const response = await axios.get(endpoint, {
                    headers: {
                        'pragma': 'no-cache',
                        'cache-control': 'no-cache'
                    }
                });
                console.log(`✓ Successfully fetched ${dataType}`);
                return response.data;
            } catch (error) {
                console.warn(`Failed to fetch from ${endpoint}:`, error.message);
                continue;
            }
        }
        throw new Error(`Failed to fetch ${dataType} from all endpoints`);
    }

    async getHeroData() {
        if (!this.heroCache) {
            this.heroCache = await this.fetchFromEndpoints(this.heroEndpoints, 'hero data');
        }
        return this.heroCache;
    }

    async getArtifactData() {
        if (!this.artifactCache) {
            this.artifactCache = await this.fetchFromEndpoints(this.artifactEndpoints, 'artifact data');
        }
        return this.artifactCache;
    }

    async getAllHeroNames() {
        const heroData = await this.getHeroData();
        return Object.keys(heroData).sort();
    }

    async findHeroByName(searchTerm) {
        const heroNames = await this.getAllHeroNames();
        const lowerSearch = searchTerm.toLowerCase();
        
        // Exact match first
        const exactMatch = heroNames.find(name => name.toLowerCase() === lowerSearch);
        if (exactMatch) return exactMatch;
        
        // Partial match
        const partialMatches = heroNames.filter(name => 
            name.toLowerCase().includes(lowerSearch)
        );
        
        return partialMatches;
    }

    async getHeroInfo(heroName) {
        const heroData = await this.getHeroData();
        return heroData[heroName] || null;
    }

    async getArtifactInfo(artifactName) {
        const artifactData = await this.getArtifactData();
        return artifactData[artifactName] || null;
    }

    // Helper to create hero lookup maps (name -> code, code -> name)
    async getHeroMappings() {
        const heroData = await this.getHeroData();
        const nameToCode = {};
        const codeToName = {};
        
        for (const [name, data] of Object.entries(heroData)) {
            if (data.code) {
                nameToCode[name] = data.code;
                codeToName[data.code] = name;
            }
        }
        
        return { nameToCode, codeToName };
    }

    // Helper to create artifact lookup maps
    async getArtifactMappings() {
        const artifactData = await this.getArtifactData();
        const nameToCode = {};
        const codeToName = {};
        
        for (const [name, data] of Object.entries(artifactData)) {
            if (data.code) {
                nameToCode[name] = data.code;
                codeToName[data.code] = name;
            }
        }
        
        return { nameToCode, codeToName };
    }
}

module.exports = HeroFetcher;