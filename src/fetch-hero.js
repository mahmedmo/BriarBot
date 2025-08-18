const fetch = require('node-fetch');

function getHeroImageUrl(heroName, heroData) {
	const heroKey = Object.keys(heroData).find(key =>
		key.toLowerCase() === heroName.toLowerCase() ||
		heroData[key].name?.toLowerCase() === heroName.toLowerCase()
	);

	return heroKey ?
		heroData[heroKey].assets?.icon ||
		`https://raw.githubusercontent.com/fribbels/Fribbels-Epic-7-Optimizer/main/data/cachedimages/${heroData[heroKey].code}_s.png` :
		'';
}

module.exports = getHeroImageUrl;