const { findBestCharacterMatch, getCharacterSuggestions } = require('../src/character-search');

// ANSI color codes
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function pass(text) {
    return `${colors.green}${colors.bold}PASS${colors.reset} ${text}`;
}

function fail(text) {
    return `${colors.red}${colors.bold}FAIL${colors.reset} ${text}`;
}

function warn(text) {
    return `${colors.yellow}${colors.bold}WARN${colors.reset} ${text}`;
}

console.log('BriarBot Search System Test\n');

console.log('=== Discord Command Testing ===\n');

const testCommands = [
    'arbiter+vildred',
    'seaside+bellona', 
    'fallen+cecilia',
    'judge+kise',
    'new+moon+luna',
    'remnant+violet',
    'martial+artist+ken',
    'ssb',              // Common abbreviation
    'arby',             // Common abbreviation  
    'avild',            // Typo
    'violet',           // Partial name
    'dizzy',            // Single name
    'kise',             // Ambiguous (multiple Kise characters)
    'charlotte'         // Ambiguous (multiple Charlotte characters)
];

testCommands.forEach(command => {
    const result = findBestCharacterMatch(command);
    
    if (result) {
        console.log(pass(`!${command} → "${result.character}" (${result.matchType}, ${(result.confidence * 100).toFixed(1)}%)`));
    } else {
        const suggestions = getCharacterSuggestions(command, 3);
        if (suggestions.length > 0) {
            console.log(fail(`!${command} → No match (suggestions: ${suggestions.slice(0, 2).join(', ')})`));
        } else {
            console.log(fail(`!${command} → No match found`));
        }
    }
});

console.log('\n=== Community Abbreviations Test ===\n');

// Test character variations
const variations = [
    { input: 'arby', expected: 'Arbiter Vildred' },
    { input: 'ssb', expected: 'Seaside Bellona' },
    { input: 'ml ken', expected: 'Martial Artist Ken' },
    { input: 'aravi', expected: 'Apocalypse Ravi' },
    { input: 'ruele', expected: 'Ruele of Light' },
    { input: 'tama', expected: 'Tamarinne' },
    { input: 'lqc', expected: 'Little Queen Charlotte' },
    { input: 'ml kise', expected: 'Judge Kise' },
    { input: 'bbkarin', expected: 'Blood Blade Karin' }
];

variations.forEach(({ input, expected }) => {
    const result = findBestCharacterMatch(input);
    if (result && result.character === expected) {
        console.log(pass(`${input} → ${result.character}`));
    } else if (result) {
        console.log(warn(`${input} → ${result.character} (expected: ${expected})`));
    } else {
        console.log(fail(`${input} → No match (expected: ${expected})`));
    }
});

console.log('\n=== Edge Cases Test ===\n');

const edgeCases = [
    { input: '', shouldFail: true },
    { input: 'nonexistent+hero', shouldFail: true },
    { input: 'kise', expected: 'Kise' }, // Should get exact match, not Judge Kise
    { input: 'violet', expected: 'Violet' }, // Should get exact match, not Remnant Violet
    { input: 'charlotte', expected: 'Charlotte' } // Should get exact match
];

edgeCases.forEach(({ input, expected, shouldFail }) => {
    const result = findBestCharacterMatch(input);
    
    if (shouldFail) {
        if (!result) {
            console.log(pass(`"${input}" → No match (expected failure)`));
        } else {
            console.log(fail(`"${input}" → ${result.character} (should have failed)`));
        }
    } else {
        if (result && result.character === expected) {
            console.log(pass(`"${input}" → ${result.character}`));
        } else if (result) {
            console.log(fail(`"${input}" → ${result.character} (expected: ${expected})`));
        } else {
            console.log(fail(`"${input}" → No match (expected: ${expected})`));
        }
    }
});

console.log('\nSearch system test complete.');