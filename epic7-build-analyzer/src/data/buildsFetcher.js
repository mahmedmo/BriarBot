const axios = require('axios');

class BuildsFetcher {
    constructor() {
        // The Hero Library Lambda endpoint from the JavaScript code
        this.buildsEndpoint = "https://krivpfvxi0.execute-api.us-west-2.amazonaws.com/dev/getBuilds";
    }

    async getPopularBuilds(heroName) {
        try {
            console.log(`Fetching popular builds for: ${heroName}`);
            
            const response = await axios.post(this.buildsEndpoint, heroName, {
                headers: {
                    'Content-Type': 'text/plain',
                    'Access-Control-Allow-Origin': '*'
                }
            });

            const data = typeof response.data === 'string' ? 
                JSON.parse(response.data) : 
                response.data;

            console.log(`✓ Found ${data.data?.length || 0} builds for ${heroName}`);
            return data;

        } catch (error) {
            if (error.response?.status === 404) {
                console.warn(`No build data available for hero: ${heroName}`);
                return { data: [] };
            }
            
            console.error(`Error fetching builds for ${heroName}:`, error.message);
            throw error;
        }
    }

    // Process raw builds data and add calculated stats (from Hero Library JS logic)
    processBuildData(rawBuilds, heroData, artifactData) {
        if (!rawBuilds.data || rawBuilds.data.length === 0) {
            return { builds: [], stats: null };
        }

        // Create artifact code to name mapping
        const artifactCodeToName = {};
        for (const [name, data] of Object.entries(artifactData)) {
            if (data.code) {
                artifactCodeToName[data.code] = name;
            }
        }

        console.log(`✓ Loaded ${Object.keys(artifactCodeToName).length} artifact mappings`);

        // Sample some artifact codes for debugging
        const sampleCodes = rawBuilds.data.slice(0, 3).map(b => b.artifactCode).filter(Boolean);
        if (sampleCodes.length > 0) {
            console.log(`Sample artifact codes: ${sampleCodes.join(', ')}`);
        }

        const builds = rawBuilds.data.map((build, index) => {
            // Convert string stats to numbers
            const stats = {
                rank: index + 1,
                atk: parseInt(build.atk),
                def: parseInt(build.def), 
                hp: parseInt(build.hp),
                spd: parseInt(build.spd),
                chc: parseInt(build.chc), // crit chance
                chd: parseInt(build.chd), // crit damage
                eff: parseInt(build.eff),
                efr: parseInt(build.efr), // effect resistance
                gs: parseInt(build.gs),   // gear score
                sets: build.sets,
                artifactCode: build.artifactCode,
                artifactName: artifactCodeToName[build.artifactCode] || build.artifactName || 'Unknown',
                createDate: build.createDate,
                unitName: build.unitName
            };

            // Calculate derived stats (EHP, damage ratings, etc.)
            const spdDiv1000 = stats.spd / 1000;
            
            // Effective HP
            stats.ehp = Math.floor(stats.hp * (stats.def / 300 + 1));
            
            // Health per speed and EHP per speed
            stats.hps = Math.floor(stats.hp * spdDiv1000);
            stats.ehps = Math.floor(stats.ehp * spdDiv1000);
            
            // Crit rate capped at 100%, crit damage processing
            const critRate = Math.min(stats.chc, 100) / 100;
            const critDamage = Math.min(stats.chd, 350) / 100;
            
            // Damage calculations (simplified - would need full set bonus logic for accuracy)
            stats.dmg = Math.floor(((critRate * stats.atk * critDamage) + (1 - critRate) * stats.atk));
            stats.dmgs = Math.floor(stats.dmg * spdDiv1000); // damage per speed
            
            // Max crit damage (assumes 100% crit)
            stats.mcd = Math.floor(stats.atk * critDamage);
            stats.mcds = Math.floor(stats.mcd * spdDiv1000);
            
            // HP and DEF scaling damage approximations
            stats.dmgh = Math.floor((critDamage * stats.hp) / 10);
            stats.dmgd = Math.floor(critDamage * stats.def);

            return stats;
        });

        // Sort by gear score descending
        builds.sort((a, b) => b.gs - a.gs);
        
        // Update ranks after sorting
        builds.forEach((build, index) => {
            build.rank = index + 1;
        });

        // Calculate aggregate statistics
        const stats = this.calculateAggregateStats(builds);

        return { builds, stats };
    }

    calculateAggregateStats(builds) {
        if (builds.length === 0) return null;

        const statKeys = ['atk', 'def', 'hp', 'spd', 'chc', 'chd', 'eff', 'efr', 'gs', 'ehp', 'hps', 'ehps', 'dmg', 'dmgs', 'mcd', 'mcds', 'dmgh', 'dmgd'];
        
        const stats = {};
        
        for (const key of statKeys) {
            const values = builds.map(build => build[key]).filter(val => !isNaN(val));
            if (values.length > 0) {
                stats[key] = {
                    min: Math.min(...values),
                    max: Math.max(...values),
                    avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
                    median: this.calculateMedian(values)
                };
            }
        }

        // Set popularity analysis
        stats.setPopularity = this.analyzeSetPopularity(builds);
        stats.artifactPopularity = this.analyzeArtifactPopularity(builds);
        stats.gearScoreDistribution = this.analyzeGearScoreDistribution(builds);

        return stats;
    }

    calculateMedian(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? 
            Math.round((sorted[mid - 1] + sorted[mid]) / 2) : 
            sorted[mid];
    }

    analyzeSetPopularity(builds) {
        const setCombos = {};
        const total = builds.length;

        for (const build of builds) {
            const setsStr = JSON.stringify(this.convertToFullSets(build.sets));
            setCombos[setsStr] = (setCombos[setsStr] || 0) + 1;
        }

        return Object.entries(setCombos)
            .map(([sets, count]) => ({
                sets: JSON.parse(sets),
                count,
                percentage: Math.round((count / total) * 100 * 10) / 10
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }

    analyzeArtifactPopularity(builds) {
        const artifactCounts = {};
        
        // Filter out builds with Unknown artifacts for accurate statistics
        const validBuilds = builds.filter(build => build.artifactName && build.artifactName !== 'Unknown');
        const total = validBuilds.length;

        if (total === 0) {
            return [];
        }

        for (const build of validBuilds) {
            const artifact = build.artifactName;
            artifactCounts[artifact] = (artifactCounts[artifact] || 0) + 1;
        }

        return Object.entries(artifactCounts)
            .map(([artifact, count]) => ({
                artifact,
                count,
                percentage: Math.round((count / total) * 100 * 10) / 10
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }

    analyzeGearScoreDistribution(builds) {
        const gearScores = builds.map(b => b.gs).sort((a, b) => b - a);
        const percentiles = [1, 5, 10, 20, 30, 50, 75, 90, 95, 99];
        
        return percentiles.map(percentile => ({
            percentile,
            gearScore: gearScores[Math.floor(gearScores.length * percentile / 100)] || 0
        }));
    }

    // Convert set data to full sets (from Hero Library logic)
    convertToFullSets(sets) {
        const fourPieceSetsIngame = [
            "set_att", "set_counter", "set_cri_dmg", "set_rage", 
            "set_revenge", "set_scar", "set_speed", "set_vampire", "set_shield"
        ];

        const result = {};
        
        for (const [setType, count] of Object.entries(sets)) {
            if (fourPieceSetsIngame.includes(setType)) {
                if (count >= 4) {
                    result[setType] = 4;
                }
            } else if (count === 6) {
                result[setType] = 6;
            } else if (count >= 4) {
                result[setType] = 4;
            } else if (count >= 2) {
                result[setType] = 2;
            }
        }
        
        return result;
    }
}

module.exports = BuildsFetcher;