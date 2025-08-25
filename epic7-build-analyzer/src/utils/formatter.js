const chalk = require('chalk');
const Table = require('cli-table3');

class Formatter {
    constructor() {
        this.setNames = {
            "set_acc": "Hit",
            "set_att": "Attack", 
            "set_coop": "Unity",
            "set_counter": "Counter",
            "set_cri_dmg": "Destruction",
            "set_cri": "Critical",
            "set_def": "Defense",
            "set_immune": "Immunity",
            "set_max_hp": "Health", 
            "set_penetrate": "Penetration",
            "set_rage": "Rage",
            "set_res": "Resist",
            "set_revenge": "Revenge", 
            "set_scar": "Injury",
            "set_speed": "Speed",
            "set_vampire": "Lifesteal",
            "set_shield": "Protection",
            "set_torrent": "Torrent"
        };
    }

    formatHeroSummary(heroName, buildData) {
        const { builds, stats } = buildData;
        
        console.log('\n' + chalk.cyan('═'.repeat(60)));
        console.log(chalk.cyan.bold(`  ${heroName.toUpperCase()} - POPULAR BUILDS ANALYSIS`));
        console.log(chalk.cyan('═'.repeat(60)));
        
        if (!builds || builds.length === 0) {
            console.log(chalk.yellow('\n  No build data available for this hero.\n'));
            return;
        }

        console.log(chalk.white(`\n  📊 Total builds analyzed: ${chalk.bold(builds.length)}`));
        console.log(chalk.white(`  🏆 Top gear score: ${chalk.green(stats.gs.max)}`));
        console.log(chalk.white(`  📈 Average gear score: ${chalk.blue(stats.gs.avg)}\n`));
    }

    formatTopBuilds(builds, limit = 5) {
        if (!builds || builds.length === 0) return;

        console.log(chalk.yellow.bold('🔥 TOP BUILDS'));
        console.log(chalk.yellow('─'.repeat(40)));

        const table = new Table({
            head: [
                chalk.bold('#'),
                chalk.bold('GS'),
                chalk.bold('ATK'),
                chalk.bold('DEF'), 
                chalk.bold('HP'),
                chalk.bold('SPD'),
                chalk.bold('CC'),
                chalk.bold('CD'),
                chalk.bold('Sets')
            ],
            colWidths: [4, 6, 7, 7, 8, 6, 5, 5, 20]
        });

        builds.slice(0, limit).forEach(build => {
            table.push([
                build.rank,
                build.gs,
                build.atk.toLocaleString(),
                build.def.toLocaleString(),
                build.hp.toLocaleString(), 
                build.spd,
                build.chc + '%',
                build.chd + '%',
                this.formatSets(build.sets)
            ]);
        });

        console.log(table.toString());
    }

    formatStatistics(stats) {
        if (!stats) return;

        console.log(chalk.blue.bold('\n📈 STATISTICS'));
        console.log(chalk.blue('─'.repeat(30)));

        const statTable = new Table({
            head: [chalk.bold('Stat'), chalk.bold('Min'), chalk.bold('Avg'), chalk.bold('Max')],
            colWidths: [10, 8, 8, 8]
        });

        const displayStats = [
            { key: 'atk', label: 'Attack' },
            { key: 'def', label: 'Defense' },
            { key: 'hp', label: 'HP' },
            { key: 'spd', label: 'Speed' },
            { key: 'chc', label: 'Crit Rate' },
            { key: 'chd', label: 'Crit Dmg' },
            { key: 'gs', label: 'Gear Score' }
        ];

        displayStats.forEach(({ key, label }) => {
            if (stats[key]) {
                const stat = stats[key];
                let minVal = key === 'chc' || key === 'chd' ? stat.min + '%' : stat.min.toLocaleString();
                let avgVal = key === 'chc' || key === 'chd' ? stat.avg + '%' : stat.avg.toLocaleString();  
                let maxVal = key === 'chc' || key === 'chd' ? stat.max + '%' : stat.max.toLocaleString();
                
                statTable.push([label, minVal, avgVal, maxVal]);
            }
        });

        console.log(statTable.toString());
    }

    formatSetPopularity(setPopularity) {
        if (!setPopularity || setPopularity.length === 0) return;

        console.log(chalk.green.bold('\n⚡ POPULAR SET COMBINATIONS'));
        console.log(chalk.green('─'.repeat(40)));

        setPopularity.slice(0, 8).forEach((combo, index) => {
            const setsText = this.formatSets(combo.sets, true);
            const percentage = chalk.bold(`${combo.percentage}%`);
            const bar = '█'.repeat(Math.max(1, Math.floor(combo.percentage / 2)));
            
            console.log(`${index + 1}. ${percentage.padStart(6)} ${chalk.cyan(bar)} ${setsText}`);
        });
    }

    formatArtifactPopularity(artifactPopularity) {
        if (!artifactPopularity || artifactPopularity.length === 0) return;

        console.log(chalk.magenta.bold('\n🗡️  POPULAR ARTIFACTS'));
        console.log(chalk.magenta('─'.repeat(35)));

        artifactPopularity.slice(0, 8).forEach((artifact, index) => {
            const percentage = chalk.bold(`${artifact.percentage}%`);
            const bar = '█'.repeat(Math.max(1, Math.floor(artifact.percentage / 2)));
            
            console.log(`${index + 1}. ${percentage.padStart(6)} ${chalk.cyan(bar)} ${artifact.artifact}`);
        });
    }

    formatGearScoreDistribution(distribution) {
        if (!distribution || distribution.length === 0) return;

        console.log(chalk.red.bold('\n📊 GEAR SCORE PERCENTILES'));
        console.log(chalk.red('─'.repeat(35)));

        const table = new Table({
            head: [chalk.bold('Percentile'), chalk.bold('Gear Score')],
            colWidths: [12, 12]
        });

        distribution.forEach(({ percentile, gearScore }) => {
            table.push([`${percentile}%`, gearScore]);
        });

        console.log(table.toString());
    }

    formatSets(sets, detailed = false) {
        if (!sets || Object.keys(sets).length === 0) {
            return detailed ? 'No sets' : 'None';
        }

        const setList = [];
        
        for (const [setCode, count] of Object.entries(sets)) {
            const setName = this.setNames[setCode] || setCode;
            if (detailed) {
                setList.push(`${setName} (${count})`);
            } else {
                setList.push(setName);
            }
        }
        
        return setList.join(detailed ? ', ' : ' + ');
    }

    formatSearchResults(results) {
        if (!results || results.length === 0) {
            console.log(chalk.red('No heroes found matching your search.'));
            return;
        }

        if (results.length === 1) {
            return results[0];
        }

        console.log(chalk.yellow('Multiple heroes found:'));
        results.forEach((name, index) => {
            console.log(`  ${index + 1}. ${name}`);
        });
        console.log(chalk.gray('\nPlease be more specific with your search term.'));
        return null;
    }

    formatError(error) {
        console.log(chalk.red.bold('\n❌ ERROR'));
        console.log(chalk.red('─'.repeat(20)));
        console.log(chalk.red(error.message || error));
    }

    formatSuccess(message) {
        console.log(chalk.green.bold(`\n✓ ${message}`));
    }

    formatInfo(message) {
        console.log(chalk.blue(`ℹ️  ${message}`));
    }

    formatWarning(message) {
        console.log(chalk.yellow(`⚠️  ${message}`));
    }
}

module.exports = Formatter;