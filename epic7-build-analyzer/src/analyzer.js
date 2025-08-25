const HeroFetcher = require('./data/heroFetcher');
const BuildsFetcher = require('./data/buildsFetcher');
const Formatter = require('./utils/formatter');

class E7BuildAnalyzer {
    constructor() {
        this.heroFetcher = new HeroFetcher();
        this.buildsFetcher = new BuildsFetcher();
        this.formatter = new Formatter();
    }

    async analyzeHero(heroName, options = {}) {
        try {
            // Find and validate hero name
            const matchedHero = await this.findHero(heroName);
            if (!matchedHero) {
                return null;
            }

            // Get hero and artifact data for processing
            const [heroData, artifactData] = await Promise.all([
                this.heroFetcher.getHeroData(),
                this.heroFetcher.getArtifactData()
            ]);

            // Fetch popular builds from Hero Library
            const rawBuilds = await this.buildsFetcher.getPopularBuilds(matchedHero);
            
            // Process and analyze build data
            const buildData = this.buildsFetcher.processBuildData(rawBuilds, heroData, artifactData);

            if (options.format !== false) {
                this.displayResults(matchedHero, buildData, options);
            }

            return {
                heroName: matchedHero,
                ...buildData
            };

        } catch (error) {
            this.formatter.formatError(error);
            throw error;
        }
    }

    async findHero(searchTerm) {
        const result = await this.heroFetcher.findHeroByName(searchTerm);
        
        if (typeof result === 'string') {
            return result; // Exact match
        }
        
        if (Array.isArray(result)) {
            return this.formatter.formatSearchResults(result);
        }
        
        return null;
    }

    displayResults(heroName, buildData, options = {}) {
        const { builds, stats } = buildData;
        
        // Hero summary
        this.formatter.formatHeroSummary(heroName, buildData);
        
        if (!builds || builds.length === 0) {
            return;
        }

        // Top builds
        if (options.showBuilds !== false) {
            this.formatter.formatTopBuilds(builds, options.topCount || 5);
        }

        // Statistics
        if (options.showStats !== false) {
            this.formatter.formatStatistics(stats);
        }

        // Set popularity
        if (options.showSets !== false && stats.setPopularity) {
            this.formatter.formatSetPopularity(stats.setPopularity);
        }

        // Artifact popularity  
        if (options.showArtifacts !== false && stats.artifactPopularity) {
            this.formatter.formatArtifactPopularity(stats.artifactPopularity);
        }

        // Gear score distribution
        if (options.showDistribution === true && stats.gearScoreDistribution) {
            this.formatter.formatGearScoreDistribution(stats.gearScoreDistribution);
        }
    }

    async listHeroes(searchTerm = '') {
        try {
            const allHeroes = await this.heroFetcher.getAllHeroNames();
            
            if (searchTerm) {
                const filtered = allHeroes.filter(name => 
                    name.toLowerCase().includes(searchTerm.toLowerCase())
                );
                
                console.log(chalk.cyan(`\n📋 Heroes matching "${searchTerm}":`));
                filtered.forEach(name => console.log(`  • ${name}`));
                console.log(chalk.gray(`\nFound ${filtered.length} heroes`));
                
                return filtered;
            } else {
                console.log(chalk.cyan(`\n📋 All Heroes (${allHeroes.length} total):`));
                
                // Group by first letter for better readability
                const grouped = {};
                allHeroes.forEach(name => {
                    const letter = name[0].toUpperCase();
                    if (!grouped[letter]) grouped[letter] = [];
                    grouped[letter].push(name);
                });

                Object.entries(grouped).forEach(([letter, names]) => {
                    console.log(chalk.bold(`\n${letter}:`));
                    names.forEach(name => console.log(`  • ${name}`));
                });
                
                return allHeroes;
            }
        } catch (error) {
            this.formatter.formatError(error);
            throw error;
        }
    }

    async getHeroInfo(heroName) {
        try {
            const matchedHero = await this.findHero(heroName);
            if (!matchedHero) return null;

            const heroInfo = await this.heroFetcher.getHeroInfo(matchedHero);
            
            if (heroInfo) {
                console.log(chalk.cyan.bold(`\n📊 ${matchedHero.toUpperCase()}`));
                console.log(chalk.cyan('─'.repeat(30)));
                console.log(`Role: ${heroInfo.role || 'Unknown'}`);
                console.log(`Attribute: ${heroInfo.attribute || 'Unknown'}`);
                console.log(`Rarity: ${heroInfo.rarity || 'Unknown'} ⭐`);
                console.log(`Zodiac: ${heroInfo.zodiac || 'Unknown'}`);
                
                if (heroInfo.calculatedStatus?.lv60SixStarFullyAwakened) {
                    const baseStats = heroInfo.calculatedStatus.lv60SixStarFullyAwakened;
                    console.log('\nBase Stats (Lv60 6⭐):');
                    console.log(`  ATK: ${baseStats.atk}`);
                    console.log(`  DEF: ${baseStats.def}`);
                    console.log(`  HP: ${baseStats.hp}`);
                    console.log(`  Speed: ${baseStats.spd}`);
                    console.log(`  Crit Rate: ${Math.round(baseStats.chc * 100)}%`);
                    console.log(`  Crit Damage: ${Math.round(baseStats.chd * 100)}%`);
                }
            }
            
            return heroInfo;
        } catch (error) {
            this.formatter.formatError(error);
            throw error;
        }
    }

    // Compare multiple heroes
    async compareHeroes(heroNames) {
        try {
            const results = await Promise.all(
                heroNames.map(name => this.analyzeHero(name, { format: false }))
            );

            const validResults = results.filter(r => r && r.builds.length > 0);
            
            if (validResults.length === 0) {
                console.log(chalk.red('No build data available for any of the specified heroes.'));
                return;
            }

            console.log(chalk.cyan.bold('\n🔀 HERO COMPARISON'));
            console.log(chalk.cyan('═'.repeat(50)));

            const table = new (require('cli-table3'))({
                head: [
                    chalk.bold('Hero'),
                    chalk.bold('Builds'),
                    chalk.bold('Top GS'),
                    chalk.bold('Avg ATK'),
                    chalk.bold('Avg HP'),
                    chalk.bold('Avg SPD')
                ]
            });

            validResults.forEach(result => {
                table.push([
                    result.heroName,
                    result.builds.length,
                    result.stats.gs.max,
                    result.stats.atk.avg.toLocaleString(),
                    result.stats.hp.avg.toLocaleString(),
                    result.stats.spd.avg
                ]);
            });

            console.log(table.toString());
            return validResults;

        } catch (error) {
            this.formatter.formatError(error);
            throw error;
        }
    }
}

module.exports = E7BuildAnalyzer;