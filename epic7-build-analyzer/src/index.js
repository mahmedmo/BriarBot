#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const E7BuildAnalyzer = require('./analyzer');

const program = new Command();
const analyzer = new E7BuildAnalyzer();

// CLI configuration
program
    .name('e7builds')
    .description('Epic Seven Build Analyzer - Get popular builds and stats for any hero')
    .version('1.0.0');

// Main analyze command
program
    .command('analyze <hero>')
    .alias('a')
    .description('Analyze popular builds for a hero')
    .option('-t, --top <number>', 'Number of top builds to show', '5')
    .option('--no-stats', 'Hide statistics')
    .option('--no-sets', 'Hide set popularity')
    .option('--no-artifacts', 'Hide artifact popularity') 
    .option('--no-builds', 'Hide top builds table')
    .option('-d, --distribution', 'Show gear score distribution')
    .action(async (heroName, options) => {
        try {
            await analyzer.analyzeHero(heroName, {
                topCount: parseInt(options.top),
                showStats: options.stats,
                showSets: options.sets,
                showArtifacts: options.artifacts,
                showBuilds: options.builds,
                showDistribution: options.distribution
            });
        } catch (error) {
            console.error(chalk.red('Analysis failed:', error.message));
            process.exit(1);
        }
    });

// List heroes command
program
    .command('list [search]')
    .alias('ls')
    .description('List all heroes or search for heroes')
    .action(async (searchTerm) => {
        try {
            await analyzer.listHeroes(searchTerm);
        } catch (error) {
            console.error(chalk.red('Failed to list heroes:', error.message));
            process.exit(1);
        }
    });

// Hero info command
program
    .command('info <hero>')
    .alias('i')
    .description('Get detailed information about a hero')
    .action(async (heroName) => {
        try {
            await analyzer.getHeroInfo(heroName);
        } catch (error) {
            console.error(chalk.red('Failed to get hero info:', error.message));
            process.exit(1);
        }
    });

// Compare heroes command
program
    .command('compare <heroes...>')
    .alias('c')
    .description('Compare build stats between multiple heroes')
    .action(async (heroNames) => {
        try {
            await analyzer.compareHeroes(heroNames);
        } catch (error) {
            console.error(chalk.red('Comparison failed:', error.message));
            process.exit(1);
        }
    });

// Search command for partial hero names
program
    .command('search <term>')
    .alias('s')
    .description('Search for heroes by name')
    .action(async (searchTerm) => {
        try {
            const results = await analyzer.findHero(searchTerm);
            if (Array.isArray(results)) {
                console.log(chalk.cyan('Found heroes:'));
                results.forEach((name, index) => {
                    console.log(`  ${index + 1}. ${name}`);
                });
            } else if (results) {
                console.log(chalk.green(`Exact match: ${results}`));
                console.log(chalk.gray('Use "e7builds analyze" to get build data'));
            }
        } catch (error) {
            console.error(chalk.red('Search failed:', error.message));
            process.exit(1);
        }
    });

// Example usage command
program
    .command('examples')
    .description('Show usage examples')
    .action(() => {
        console.log(chalk.cyan.bold('\n📚 USAGE EXAMPLES'));
        console.log(chalk.cyan('─'.repeat(30)));
        console.log('');
        console.log(chalk.white('Basic hero analysis:'));
        console.log(chalk.gray('  e7builds analyze "Arbiter Vildred"'));
        console.log(chalk.gray('  e7builds a vildred'));
        console.log('');
        console.log(chalk.white('Show only top 10 builds without artifacts:'));
        console.log(chalk.gray('  e7builds analyze "Seaside Bellona" -t 10 --no-artifacts'));
        console.log('');
        console.log(chalk.white('List all heroes:'));
        console.log(chalk.gray('  e7builds list'));
        console.log('');
        console.log(chalk.white('Search for heroes:'));
        console.log(chalk.gray('  e7builds search bellona'));
        console.log('');
        console.log(chalk.white('Get hero information:'));
        console.log(chalk.gray('  e7builds info "Fallen Cecilia"'));
        console.log('');
        console.log(chalk.white('Compare multiple heroes:'));
        console.log(chalk.gray('  e7builds compare "Arbiter Vildred" "Remnant Violet" "Luna"'));
        console.log('');
    });

// Add welcome message for no arguments
if (process.argv.length === 2) {
    console.log(chalk.cyan.bold('\n🗡️  Epic Seven Build Analyzer'));
    console.log(chalk.cyan('─'.repeat(35)));
    console.log(chalk.white('Get popular builds and stats for any Epic Seven hero!\n'));
    console.log(chalk.gray('Usage: e7builds <command> [options]'));
    console.log(chalk.gray('Run "e7builds --help" for available commands'));
    console.log(chalk.gray('Run "e7builds examples" for usage examples\n'));
    process.exit(0);
}

// Parse command line arguments
program.parse();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n👋 Thanks for using Epic Seven Build Analyzer!'));
    process.exit(0);
});