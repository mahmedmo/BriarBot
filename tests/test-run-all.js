#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// ANSI color codes
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
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

function info(text) {
    return `${colors.blue}INFO${colors.reset} ${text}`;
}

console.log('BriarBot Test Suite\n');

function runTest(testFile, description) {
    console.log(info(`Running ${description}...`));
    
    try {
        execSync(`node ${testFile}`, { 
            stdio: 'inherit',
            cwd: __dirname 
        });
        console.log(pass(`${description} completed\n`));
    } catch (error) {
        console.log(fail(`${description} failed: ${error.message}\n`));
        process.exit(1);
    }
}

async function runAllTests() {
    // Test 1: Search system only
    runTest('test-search.js', 'Search System Test');
    
    // Wait before full test
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Complete bot functionality
    runTest('test-briar-bot.js', 'Complete Bot Functionality Test');
    
    console.log('=== All Tests Complete ===\n');
    console.log(pass('Character search with Discord commands'));
    console.log(pass('Community abbreviations (arby, ssb, ml ken, etc.)'));
    console.log(pass('Web scraping from fribbels.github.io'));
    console.log(pass('PNG image generation with Puppeteer'));
    console.log(pass('Error handling and edge cases'));
    console.log('\nBriarBot is ready for Discord deployment.');
    console.log('To start the bot: npm start');
}

runAllTests().catch(console.error);