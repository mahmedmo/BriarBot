#!/usr/bin/env node

const assert = require('assert');

const {
	findBestCharacterMatch,
	characterNames,
	communityAbbreviations
} = require('../src/character-search.js');

function expectExactMatch(input, expectedCharacter) {
	const result = findBestCharacterMatch(input);
	assert(result, `Expected a match for "${input}"`);
	assert.strictEqual(result.character, expectedCharacter, `Expected "${input}" to resolve to "${expectedCharacter}"`);
}

function run() {
	assert(Array.isArray(characterNames), 'characterNames should load as an array');
	assert(characterNames.length > 0, 'characterNames should not be empty');
	assert(communityAbbreviations && typeof communityAbbreviations === 'object', 'communityAbbreviations should load as an object');

	expectExactMatch('Arbiter Vildred', 'Arbiter Vildred');
	expectExactMatch('arby', 'Arbiter Vildred');
	expectExactMatch('ssb', 'Seaside Bellona');
	expectExactMatch('summer charlotte', 'Summer Break Charlotte');

	const ambiguousMlTenebria = new Set();
	for (let index = 0; index < 25; index += 1) {
		const result = findBestCharacterMatch('mltenebria');
		assert(result, 'Expected mltenebria to resolve to a character');
		ambiguousMlTenebria.add(result.character);
	}

	assert(ambiguousMlTenebria.has('Specter Tenebria'), 'mltenebria should still be able to resolve to Specter Tenebria');
	assert(ambiguousMlTenebria.has('Witch of the Mere Tenebria'), 'mltenebria should still be able to resolve to Witch of the Mere Tenebria');

	console.log('Character data test suite passed.');
}

run();
