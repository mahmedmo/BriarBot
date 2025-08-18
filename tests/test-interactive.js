#!/usr/bin/env node

const { findBestCharacterMatch, getCharacterSuggestions } = require('../src/character-search');
const readline = require('readline');

// ANSI color codes
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m'
};

function pass(text) {
    return `${colors.green}${colors.bold}MATCH${colors.reset} ${text}`;
}

function fail(text) {
    return `${colors.red}${colors.bold}NO MATCH${colors.reset} ${text}`;
}

function suggestion(text) {
    return `${colors.yellow}${colors.bold}SUGGESTION${colors.reset} ${text}`;
}

function info(text) {
    return `${colors.blue}INFO${colors.reset} ${text}`;
}

function highlight(text) {
    return `${colors.cyan}${colors.bold}${text}${colors.reset}`;
}

function dim(text) {
    return `${colors.dim}${text}${colors.reset}`;
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function formatMatchType(matchType) {
    const types = {
        'exact': `${colors.green}exact${colors.reset}`,
        'abbreviation': `${colors.cyan}abbreviation${colors.reset}`,
        'substring': `${colors.yellow}substring${colors.reset}`,
        'fuzzy': `${colors.magenta}fuzzy${colors.reset}`
    };
    return types[matchType] || matchType;
}

function testCharacterName(input) {
    console.log(dim(`\nTesting: "${input}"`));
    console.log('─'.repeat(50));
    
    const result = findBestCharacterMatch(input);
    
    if (result) {
        console.log(pass(`Found: ${highlight(result.character)}`));
        console.log(info(`Type: ${formatMatchType(result.matchType)}`));
        console.log(info(`Confidence: ${(result.confidence * 100).toFixed(1)}%`));
        
        // Show what would happen in Discord
        if (result.matchType === 'exact' || result.matchType === 'abbreviation') {
            console.log(dim(`Discord: "🔍 Analyzing **${result.character}**..."`));
        } else {
            console.log(dim(`Discord: "🔍 Found **${result.character}** (${(result.confidence * 100).toFixed(1)}% match) - Analyzing..."`));
        }
    } else {
        console.log(fail(`No match found for "${input}"`));
        
        const suggestions = getCharacterSuggestions(input, 5);
        if (suggestions.length > 0) {
            console.log(suggestion(`Did you mean:`));
            suggestions.forEach((s, i) => {
                console.log(`  ${i + 1}. ${highlight(s)}`);
            });
            console.log(dim(`Discord: "❌ No exact match found for **${input}**.\\n\\n**Did you mean?**\\n${suggestions.slice(0, 3).map(s => `• ${s}`).join('\\n')}"`));
        } else {
            console.log(dim(`Discord: "❌ No character found for **${input}**. Try checking the spelling or use a different name."`));
        }
    }
}

function showHelp() {
    console.log(`
${colors.bold}BriarBot Interactive Character Search Test${colors.reset}

${colors.bold}Commands:${colors.reset}
  • Type any character name to test the search
  • Type ${highlight('help')} to show this help
  • Type ${highlight('examples')} to see example searches
  • Type ${highlight('quit')} or ${highlight('exit')} to exit

${colors.bold}Search Features:${colors.reset}
  • ${colors.green}Exact matches${colors.reset} - Full character names
  • ${colors.cyan}Abbreviations${colors.reset} - Community shortcuts (arby, ssb, ml ken)
  • ${colors.yellow}Substring matches${colors.reset} - Partial names
  • ${colors.magenta}Fuzzy matches${colors.reset} - Typo tolerance

${colors.bold}Discord Format:${colors.reset}
  • Use + signs for spaces: ${highlight('arbiter+vildred')}
  • Or regular spaces: ${highlight('arbiter vildred')}
`);
}

function showExamples() {
    console.log(`
${colors.bold}Example Searches:${colors.reset}

${colors.bold}Exact Matches:${colors.reset}
  • ${highlight('arbiter vildred')} → Arbiter Vildred
  • ${highlight('seaside bellona')} → Seaside Bellona
  • ${highlight('kise')} → Kise

${colors.bold}Community Abbreviations:${colors.reset}
  • ${highlight('arby')} → Arbiter Vildred
  • ${highlight('ssb')} → Seaside Bellona
  • ${highlight('ml ken')} → Martial Artist Ken
  • ${highlight('a ravi')} → Apocalypse Ravi
  • ${highlight('lqc')} → Little Queen Charlotte

${colors.bold}Discord Format:${colors.reset}
  • ${highlight('arbiter+vildred')} → Arbiter Vildred
  • ${highlight('fallen+cecilia')} → Fallen Cecilia
  • ${highlight('new+moon+luna')} → New Moon Luna

${colors.bold}Fuzzy Matching:${colors.reset}
  • ${highlight('arbiiter')} → Arbiter Vildred (typo)
  • ${highlight('belona')} → Bellona (missing letter)
`);
}

function main() {
    console.log(`${colors.bold}${colors.blue}BriarBot Interactive Character Search Test${colors.reset}\n`);
    console.log(`Type a character name to test the search system.`);
    console.log(`Type ${highlight('help')} for commands or ${highlight('quit')} to exit.\n`);
    
    function askForInput() {
        rl.question(`${colors.bold}Search for:${colors.reset} `, (input) => {
            const trimmedInput = input.trim().toLowerCase();
            
            if (trimmedInput === 'quit' || trimmedInput === 'exit') {
                console.log('\nExiting interactive test. Thanks for testing BriarBot!');
                rl.close();
                return;
            }
            
            if (trimmedInput === 'help') {
                showHelp();
                askForInput();
                return;
            }
            
            if (trimmedInput === 'examples') {
                showExamples();
                askForInput();
                return;
            }
            
            if (trimmedInput === '') {
                console.log(dim('Please enter a character name to search for.'));
                askForInput();
                return;
            }
            
            testCharacterName(input.trim());
            console.log('');
            askForInput();
        });
    }
    
    askForInput();
}

// Handle Ctrl+C gracefully
rl.on('SIGINT', () => {
    console.log('\n\nExiting interactive test. Thanks for testing BriarBot!');
    process.exit(0);
});

main();