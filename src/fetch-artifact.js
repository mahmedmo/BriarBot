const fetch = require('node-fetch');

// Artifact name corrections for known typos and variants
const ARTIFACT_NAME_CORRECTIONS = {
	'elegiac candles': 'elegiac candle',
	'elegiac-candles': 'elegiac-candle',
	'succubus-mirror': 'nostalgic-music-box',
	'succubus mirror': 'nostalgic music box'
};

const getArtifactImage = async (artifactName) => {
	try {
		// Apply artifact name corrections first
		let correctedName = artifactName.toLowerCase();
		
		// Check for known corrections
		const correctionKey = Object.keys(ARTIFACT_NAME_CORRECTIONS).find(key => 
			correctedName.includes(key.replace(/-/g, ' ')) || 
			correctedName.includes(key.replace(/-/g, '')) ||
			correctedName === key
		);
		
		if (correctionKey) {
			const correction = ARTIFACT_NAME_CORRECTIONS[correctionKey];
			correctedName = correction;
		} else {
			correctedName = artifactName;
		}
		
		// Format artifact name by replacing spaces with hyphens
		const formattedName = correctedName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase();

		// Fetch artifact data from the first API
		const response = await fetch(`https://cecilia-bot-api.vercel.app/api/v1/getItem?list=artifact&id=${formattedName}`);
		const data = await response.json();
		
		if (!data.id) {
			throw new Error('Artifact ID not found');
		}

		// Construct the URL for the second API using the retrieved ID
		const imageUrl = `https://raw.githubusercontent.com/CeciliaBot/E7Assets-Temp/main/assets/item_arti/icon_${data.id}.png`;

		// Return the image URL
		return `${imageUrl}`;
	} catch (err) {
		console.error('Artifact fetch error:', err.message);
		return `<div>Error: Unable to load artifact image</div>`;
	}
};

module.exports = getArtifactImage;