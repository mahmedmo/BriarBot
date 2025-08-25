const fs = require('fs');
const path = require('path');

// Load character names
const characterDataPath = path.join(__dirname, '..', 'assets', 'data', 'character-names.json');
let characterNames = [];

try {
    const characterData = JSON.parse(fs.readFileSync(characterDataPath, 'utf8'));
    characterNames = characterData.characters;
} catch (error) {
    console.error('Error loading character names:', error);
}

// Calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    // Initialize matrix
    for (let i = 0; i <= len2; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len1; j++) {
        matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len2; i++) {
        for (let j = 1; j <= len1; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[len2][len1];
}

// Common community abbreviations and nicknames
const COMMUNITY_ABBREVIATIONS = {
    // Moonlight (ML) abbreviations
    'arby': 'Arbiter Vildred',
    'arb': 'Arbiter Vildred',
    'aravi': 'Apocalypse Ravi',
    'czerato': 'Champion Zerato',
    'sbara': 'Silver Blade Aramintha',
	'pflan': 'Pirate Captain Flan',
	'aflan': 'Afternoon Soak Flan',
	'asflan': 'Afternoon Soak Flan',
	'yenya': 'Young Senya',
	'spoli': 'Sea Phantom Politis',
	'atywin': 'Ambitious Tywin',
    'mlkise': 'Judge Kise',
	'jkise': 'Judge Kise',
    'rviolet': 'Remnant Violet',
	'riolet': 'Remnant Violet',
    'lrk': 'Last Rider Krau',
	'aras': 'Adventurer Ras',
    'bbkarin': 'Blood Blade Karin',
	'bbk': 'Blood Blade Karin',
    'cmrin': 'Crescent Moon Rin',
	'seline': 'Spirit Eye Celine',
	'bhwa': 'Bystander Hwayoung',
	'ahwa': 'Argent Waves Hwayoung',
	'awhwa': 'Argent Waves Hwayoung',
	'hwa': 'Hwayoung',
	'dks': 'Dragon King Sharun',
	'briseria': 'Briar Witch Iseria',
	'mliseria': 'Briar Witch Iseria',
	'seaseria': 'Summertime Iseria',
    'ssb': 'Seaside Bellona',
    'sb': 'Seaside Bellona',
	'lcb': 'Lone Crescent Bellona',
	'lcbellona': 'Lone Crescent Bellona',
    'summerbellona': 'Seaside Bellona',
    'holidayyufine': 'Holiday Yufine',
    'hyufine': 'Holiday Yufine',
	'summer yufine': 'Holiday Yufine',
    'summer charlotte': 'Summer Break Charlotte',
    'sharklotte': 'Summer Break Charlotte',
    'lqc': 'Little Queen Charlotte',
	'lhc': 'Lionheart Cermia',
	'lermia': 'Lionheart Cermia',
	'cavel': 'Commander Pavel',
	'barunka': 'Boss Arunka',
	'moona': 'New Moon Luna',
	'clilias': 'Conqueror Lilias',
	'fluri': 'Falconer Kluri',
	'flidica': 'Faithless Lidica',
	'mllidica': 'Faithless Lidica',
	'blidica': 'Blooming Lidica',
	'wtene': 'Witch of the Mere Tenebria',
	'stene': 'Specter Tenebria',
	'mltenebria': Math.random() < 0.5 ? 'Specter Tenebria' : 'Witch of the Mere Tenebria',
	'mltene': Math.random() < 0.5 ? 'Specter Tenebria' : 'Witch of the Mere Tenebria',
};

// Normalize text for better matching
function normalizeText(text) {
    return text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' ')        // Normalize spaces
        .trim();
}

// Format Discord input (handle + signs and normalize)
function formatDiscordInput(input) {
    return input
        .replace(/\+/g, ' ')         // Replace + with spaces
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' ')        // Normalize spaces
        .trim();
}

function getRandomizedConfidence(baseConfidence) {
	const randomPercentage = Math.random() * (0.075 - 0.05) + 0.05; // Random value between 5% and 7.5%
	return baseConfidence + baseConfidence * randomPercentage;
}

// Find the best character match
function findBestCharacterMatch(input) {
    if (!input || input.trim().length === 0) {
        return null;
    }

    // Format the input from Discord
    const formattedInput = formatDiscordInput(input);
    const normalizedInput = normalizeText(formattedInput);

    // First pass: Look for exact matches
    for (const character of characterNames) {
        const normalizedCharacter = normalizeText(character);
        if (normalizedInput === normalizedCharacter) {
            return { 
                character,
                confidence: 1.0, 
                matchType: 'exact' 
            };
        }
    }
    
	// Second pass: Check community abbreviations second
	if (COMMUNITY_ABBREVIATIONS[normalizedInput]) {
		return {
			character: COMMUNITY_ABBREVIATIONS[normalizedInput],
			confidence: getRandomizedConfidence(0.65),
			matchType: 'abbreviation'
		};
	}

	// Third pass: Handle moonlight prefix
	if (normalizedInput.startsWith("ml") || normalizedInput.startsWith("moonlight")) {
		const strippedInput = normalizedInput.replace(/^(ml|moonlight)[-\s]?/, "");
		let bestMatch = null;
		let bestSimilarity = 0;

		for (const character of characterNames) {
			const normalizedCharacter = normalizeText(character);

			// Skip exact matches with the base name (e.g., "Ken")
			if (normalizedCharacter === strippedInput) {
				bestMatch = character; // Hold onto the base name as a fallback
				continue;
			}

			// Prioritize matches that contain the base name but include additional text
			// Ensure the stripped input is isolated (not part of a larger word)
			const regex = new RegExp(`\\b${strippedInput}\\b`, 'i');
			if (regex.test(normalizedCharacter) && normalizedCharacter.length > strippedInput.length) {
				return {
					character,
					confidence: 1.0,
					matchType: 'ml-alt-name'
				};
			}

			// Fuzzy matching with Levenshtein distance
			const distance = levenshteinDistance(strippedInput, normalizedCharacter);
			const maxLength = Math.max(strippedInput.length, normalizedCharacter.length);
			const similarity = 1 - (distance / maxLength);

			if (similarity > bestSimilarity && similarity >= 0.6) {
				bestMatch = character;
				bestSimilarity = similarity;
			}
		}

		// Return the best match if found, or fallback to the base name
		if (bestMatch) {
			return {
				character: bestMatch,
				confidence: bestSimilarity >= 0.6 ? getRandomizedConfidence(bestSimilarity) : 0.75,
				matchType: bestSimilarity >= 0.6 ? 'ml-fuzzy' : 'ml-base'
			};
		}

		return null;
	}

    // Fourth pass: Look for substring matches
	let bestMatch = null;
	let bestRatio = 0;

	for (const character of characterNames) {
		const normalizedCharacter = normalizeText(character);
		if (normalizedCharacter.includes(normalizedInput)) {
			// Calculate the substring-to-total string ratio
			const ratio = normalizedInput.length / normalizedCharacter.length;

			// Update the best match if the current ratio is higher
			if (ratio > bestRatio) {
				bestMatch = character;
				bestRatio = ratio;
			}
		}
	}

	// Return the best match if found
	if (bestMatch) {
		return {
			character: bestMatch,
			confidence: getRandomizedConfidence(0.75),
			matchType: 'substring'
		};
	}
    
    // Fifth pass: Fuzzy matching with Levenshtein distance
    bestMatch = null;
    let bestSimilarity = 0;
    
    for (const character of characterNames) {
        const normalizedCharacter = normalizeText(character);
        const distance = levenshteinDistance(normalizedInput, normalizedCharacter);
        const maxLength = Math.max(normalizedInput.length, normalizedCharacter.length);
        const similarity = 1 - (distance / maxLength);
        
        // Consider it a good match if similarity is high enough
        if (similarity > bestSimilarity && similarity >= 0.6) {
            bestMatch = character;
            bestSimilarity = similarity;
        }
    }
    
    // Return best fuzzy match if found
    if (bestMatch && bestSimilarity >= 0.6) {
        return { 
            character: bestMatch, 
            confidence: bestSimilarity, 
            matchType: 'fuzzy' 
        };
    }
    
    return null;
}

// Get character suggestions for partial matches
function getCharacterSuggestions(input, limit = 5) {
    if (!input || input.trim().length < 2) {
        return [];
    }

    const formattedInput = formatDiscordInput(input);
    const normalizedInput = normalizeText(formattedInput);
    const suggestions = [];

    for (const character of characterNames) {
        const normalizedCharacter = normalizeText(character);
        
        // Partial matches
        if (normalizedCharacter.includes(normalizedInput)) {
            const distance = levenshteinDistance(normalizedInput, normalizedCharacter);
            const similarity = 1 - (distance / Math.max(normalizedInput.length, normalizedCharacter.length));
            
            suggestions.push({
                character,
                similarity,
                distance
            });
        }
    }
    
    // Sort by similarity (highest first)
    suggestions.sort((a, b) => b.similarity - a.similarity);
    
    return suggestions.slice(0, limit).map(s => s.character);
}

// Test the search system
function testSearch() {
    const testCases = [
        'arbiter vildred',
        'arbiter+vildred', 
        'seaside bellona',
        'ssb',
        'dizzy',
        'remnant violet',
        'violet',
        'judge kise',
        'avild',
        'arby'
    ];
    
    console.log('=== Character Search Test Results ===');
    testCases.forEach(testCase => {
        const result = findBestCharacterMatch(testCase);
        console.log(`Input: "${testCase}"`);
        if (result) {
            console.log(`  → Match: "${result.character}" (${result.matchType}, ${(result.confidence * 100).toFixed(1)}%)`);
        } else {
            console.log(`  → No match found`);
            const suggestions = getCharacterSuggestions(testCase);
            if (suggestions.length > 0) {
                console.log(`  → Suggestions: ${suggestions.slice(0, 3).join(', ')}`);
            }
        }
        console.log('');
    });
}

module.exports = {
    findBestCharacterMatch,
    getCharacterSuggestions,
    formatDiscordInput,
    testSearch,
    characterNames
};