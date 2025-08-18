const fetch = require('node-fetch');

const getArtifactImage = async (artifactName) => {
	try {
		// Format artifact name by replacing spaces with hyphens
		const formattedName = artifactName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase();

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
		return `<div>Error: ${err.message}</div>`;
	}
};

module.exports = getArtifactImage;