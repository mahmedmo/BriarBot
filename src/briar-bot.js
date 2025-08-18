const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const getArtifactImage = require('./fetch-artifact');
const getHeroImageUrl = require('./fetch-hero');
const { findBestCharacterMatch, getCharacterSuggestions } = require('./character-search');
require('dotenv').config();

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});

const BOT_TOKEN = process.env.BOT_TOKEN;

let heroData = {};
let artifactData = {};
let artifactsById = {};

const HERO_CACHE = "https://e7-optimizer-game-data.s3-accelerate.amazonaws.com/herodata.json";
const ARTIFACT_CACHE = "https://e7-optimizer-game-data.s3-accelerate.amazonaws.com/artifactdata.json";
const BUILDS_API = "https://krivpfvxi0.execute-api.us-west-2.amazonaws.com/dev/getBuilds";

const SET_ASSETS = {
	"set_acc": path.join(__dirname, '..', 'assets', 'sethit.png'),
	"set_att": path.join(__dirname, '..', 'assets', 'setattack.png'),
	"set_coop": path.join(__dirname, '..', 'assets', 'setunity.png'),
	"set_counter": path.join(__dirname, '..', 'assets', 'setcounter.png'),
	"set_cri_dmg": path.join(__dirname, '..', 'assets', 'setdestruction.png'),
	"set_cri": path.join(__dirname, '..', 'assets', 'setcritical.png'),
	"set_def": path.join(__dirname, '..', 'assets', 'setdefense.png'),
	"set_immune": path.join(__dirname, '..', 'assets', 'setimmunity.png'),
	"set_max_hp": path.join(__dirname, '..', 'assets', 'sethealth.png'),
	"set_penetrate": path.join(__dirname, '..', 'assets', 'setpenetration.png'),
	"set_rage": path.join(__dirname, '..', 'assets', 'setrage.png'),
	"set_res": path.join(__dirname, '..', 'assets', 'setresist.png'),
	"set_revenge": path.join(__dirname, '..', 'assets', 'setrevenge.png'),
	"set_scar": path.join(__dirname, '..', 'assets', 'setinjury.png'),
	"set_speed": path.join(__dirname, '..', 'assets', 'setspeed.png'),
	"set_vampire": path.join(__dirname, '..', 'assets', 'setlifesteal.png'),
	"set_shield": path.join(__dirname, '..', 'assets', 'setprotection.png'),
	"set_torrent": path.join(__dirname, '..', 'assets', 'settorrent.png')
};

const STAT_ICONS = {
	atk: path.join(__dirname, '..', 'assets', 'statatk.png'),
	def: path.join(__dirname, '..', 'assets', 'statdef.png'),
	hp: path.join(__dirname, '..', 'assets', 'stathp.png'),
	spd: path.join(__dirname, '..', 'assets', 'statspd.png'),
	chc: path.join(__dirname, '..', 'assets', 'statcr.png'),
	chd: path.join(__dirname, '..', 'assets', 'statcd.png'),
	eff: path.join(__dirname, '..', 'assets', 'stateff_dt.png'),
	efr: path.join(__dirname, '..', 'assets', 'statres.png'),
	gs: path.join(__dirname, '..', 'assets', 'star.png')
};

// Load game data
async function loadGameData() {
	try {
		console.log('Loading hero data...');
		const heroResponse = await fetch(HERO_CACHE);
		heroData = await heroResponse.json();

		console.log('Loading artifact data...');
		const artifactResponse = await fetch(ARTIFACT_CACHE);
		artifactData = await artifactResponse.json();

		for (const name of Object.keys(artifactData)) {
			artifactsById[artifactData[name].code] = name;
		}

		console.log('Game data loaded successfully!');
	} catch (error) {
		console.error('Error loading game data:', error);
	}
}

async function getHeroBuilds(heroName) {
	try {
		const response = await fetch(BUILDS_API, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(heroName)
		});

		const text = await response.text();
		const data = JSON.parse(text);
		return data;
	} catch (error) {
		console.error('Error fetching builds:', error);
		return null;
	}
}

function convertToFullSets(sets) {
	const fourPieceSets = ["set_att", "set_counter", "set_cri_dmg", "set_rage", "set_revenge", "set_scar", "set_speed", "set_vampire", "set_shield"];
	const result = {};

	for (const [setName, count] of Object.entries(sets)) {
		if (fourPieceSets.includes(setName)) {
			if (count > 3) {
				result[setName] = 4;
			}
		} else if (count === 6) {
			result[setName] = 6;
		} else if (count >= 4) {
			result[setName] = 4;
		} else if (count >= 2) {
			result[setName] = 2;
		}
	}
	return result;
}

// Map set codes to display names
const SET_NAMES = {
	"set_speed": "Speed",
	"set_acc": "Hit",
	"set_att": "Attack",
	"set_cri": "Critical",
	"set_cri_dmg": "Destruction",
	"set_def": "Defense",
	"set_immune": "Immunity",
	"set_max_hp": "Health",
	"set_penetrate": "Penetration",
	"set_rage": "Rage",
	"set_res": "Resist",
	"set_revenge": "Revenge",
	"set_scar": "Injury",
	"set_vampire": "Lifesteal",
	"set_shield": "Protection",
	"set_torrent": "Torrent",
	"set_coop": "Unity",
	"set_counter": "Counter"
};

// Define which sets are 2-piece vs 4-piece
const TWO_PIECE_SETS = new Set([
	"set_cri", "set_acc", "set_max_hp", "set_def", "set_res",
	"set_immune", "set_coop", "set_penetrate", "set_torrent"
]);

const FOUR_PIECE_SETS = new Set([
	"set_speed", "set_att", "set_shield", "set_cri_dmg", "set_counter",
	"set_vampire", "set_rage", "set_revenge", "set_scar"
]);

// Function to create a broken set icon using the asset
function createBrokenIcon() {
	const brokenPath = path.join(__dirname, '..', 'assets', 'setbroken.png');
	if (fs.existsSync(brokenPath)) {
		const imageBuffer = fs.readFileSync(brokenPath);
		const imageBase64 = imageBuffer.toString('base64');
		const dataUrl = `data:image/png;base64,${imageBase64}`;
		return `<div class="set-combo"><img src="${dataUrl}" class="set-icon"></div>`;
	}
	// Fallback if setbroken.png doesn't exist
	return `<div class="set-combo broken-icon">?</div>`;
}

function generateSetHTML(sets) {
	const fullSets = convertToFullSets(sets);
	const setNames = [];
	let iconsHtml = '';
	let totalIcons = 0;
	let gearPiecesUsed = 0;
	const maxIcons = 3;

	// Process each set and create appropriate number of icons
	for (const [setCode, count] of Object.entries(fullSets)) {
		if (totalIcons >= maxIcons) break;

		const assetPath = SET_ASSETS[setCode];
		const setName = SET_NAMES[setCode] || "Unknown";
		const isTwoPiece = TWO_PIECE_SETS.has(setCode);
		const isFourPiece = FOUR_PIECE_SETS.has(setCode);

		if (assetPath && fs.existsSync(assetPath)) {
			// Convert image to base64 data URL
			const imageBuffer = fs.readFileSync(assetPath);
			const imageBase64 = imageBuffer.toString('base64');
			const imageMimeType = 'image/png';
			const dataUrl = `data:${imageMimeType};base64,${imageBase64}`;

			// Calculate how many icons to show for this set and gear pieces used
			let iconsToShow = 0;
			let piecesUsed = 0;

			if (isTwoPiece && count >= 2) {
				// For 2-piece sets: show one icon per 2-piece bonus
				iconsToShow = Math.floor(count / 2);
				piecesUsed = iconsToShow * 2;
			} else if (isFourPiece && count >= 4) {
				// For 4-piece sets: show one icon per 4-piece bonus
				iconsToShow = Math.floor(count / 4);
				piecesUsed = iconsToShow * 4;
			}

			// Add icons up to the limit
			for (let i = 0; i < iconsToShow && totalIcons < maxIcons; i++) {
				iconsHtml += `<div class="set-combo"><img src="${dataUrl}" class="set-icon"></div>`;
				totalIcons++;
			}

			gearPiecesUsed += piecesUsed;

			if (iconsToShow > 0) {
				setNames.push(setName);
			}
		}
	}

	// Calculate remaining gear pieces (out of 6 total)
	const remainingPieces = 6 - gearPiecesUsed;

	// Add broken icons for remaining gear pieces (each broken icon represents 2 pieces)
	if (remainingPieces > 0 && totalIcons < maxIcons) {
		const brokenIconsNeeded = Math.min(
			Math.ceil(remainingPieces / 2),
			maxIcons - totalIcons
		);

		for (let i = 0; i < brokenIconsNeeded; i++) {
			iconsHtml += createBrokenIcon();
			totalIcons++;
		}

		if (brokenIconsNeeded > 0) {
			setNames.push("Broken");
		}
	}

	// Create set name text
	let setNameText = '';
	if (setNames.length === 0) {
		setNameText = 'Broken';
	} else if (setNames.length === 1 && !setNames.includes("Broken")) {
		setNameText = setNames[0];
	} else {
		setNameText = setNames.join('/');
	}

	if (iconsHtml) {
		const setClass = totalIcons === 1 ? 'single-set' : 'multi-set';
		return `
            <div class="set-icons-group ${setClass}">
                ${iconsHtml}
            </div>
            <span class="set-name">${setNameText}</span>
        `;
	}

	return '<span class="broken-sets">Broken</span>';
}

async function analyzeHeroData(heroName) {
	try {
		// Find the correct hero name (case insensitive)
		const heroKeys = Object.keys(heroData);
		const matchedHero = heroKeys.find(key =>
			key.toLowerCase() === heroName.toLowerCase() ||
			heroData[key].name?.toLowerCase() === heroName.toLowerCase()
		);

		// Use the matched hero name or the original if no match found
		const actualHeroName = matchedHero ? heroData[matchedHero].name || matchedHero : heroName;

		// Convert hero name to URL format (spaces to +)
		const urlHeroName = actualHeroName.replace(/\s+/g, '+');
		const heroLibraryUrl = `https://fribbels.github.io/e7/hero-library.html?hero=${urlHeroName}`;

		console.log(`Fetching data from: ${heroLibraryUrl}`);

		// Launch puppeteer to scrape the page
		const browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox']
		});

		const page = await browser.newPage();

		// Set up request interception to monitor for getBuilds API call
		await page.setRequestInterception(true);
		let buildsRequestCompleted = false;

		page.on('request', (request) => {
			request.continue();
		});

		page.on('response', (response) => {
			if (response.url().includes('getBuilds') && response.status() === 200) {
				console.log('getBuilds request completed successfully');
				buildsRequestCompleted = true;
			}
		});

		await page.goto(heroLibraryUrl, { waitUntil: 'networkidle0', timeout: 30000 });

		// Wait for the getBuilds request to complete
		console.log('Waiting for build data to load...');
		await page.waitForFunction(() => {
			// Check if build data elements are present
			return document.querySelectorAll('.statPreviewRow').length > 0 ||
				document.querySelectorAll('.artifactComboRow').length > 0;
		}, { timeout: 15000 });

		// Additional wait to ensure data is fully populated
		await new Promise(resolve => setTimeout(resolve, 2000));

		// Extract data using the correct IDs found in debugging
		const extractedData = await page.evaluate(() => {
			const result = {
				stats: {},
				artifacts: [],
				sets: [],
				totalBuilds: 0
			};

			// Extract stats using the specific IDs found
			const statMappings = {
				'atkStatBefore': 'atk',
				'defStatBefore': 'def',
				'hpStatBefore': 'hp',
				'spdStatBefore': 'spd',
				'crStatBefore': 'chc',
				'cdStatBefore': 'chd',
				'effStatBefore': 'eff',
				'resStatBefore': 'efr',
				'gsStatBefore': 'gs'
			};

			for (const [elementId, statKey] of Object.entries(statMappings)) {
				const element = document.getElementById(elementId);
				if (element) {
					const value = element.textContent.trim();
					if (statKey === 'gs') {
						result.stats[statKey] = Math.round(parseFloat(value)) || 0;
					} else {
						result.stats[statKey] = parseInt(value) || 0;
					}
				}
			}

			// Extract artifacts from artifactComboRow elements (only visible ones)
			for (let i = 0; i < 9; i++) {
				const row = document.getElementById(`artifactComboRow${i}`);
				if (row) {
					// Check if the row is visible
					const computedStyle = window.getComputedStyle(row);
					if (computedStyle.display !== 'none') {
						// Look for the percentage and artifact name in the row structure
						const cells = row.querySelectorAll('td, div');
						let percentage = '';
						let name = '';

						// Search through all cells/divs to find percentage and name
						for (const cell of cells) {
							const text = cell.textContent.trim();
							if (text.includes('%') && text.match(/^\d+(\.\d+)?%$/)) {
								percentage = text.replace('%', '');
							} else if (text && !text.includes('%') && !text.match(/^\d+(\.\d+)?$/)) {
								if (text.length > 3 && !name) {
									name = text;
								}
							}
						}

						if (name && percentage && parseFloat(percentage) > 0) {
							result.artifacts.push({
								name,
								percentage,
								code: ''
							});
						}
					}
				}
			}

			// Extract set combinations from setComboRow elements (only visible ones)
			for (let i = 0; i < 9; i++) {
				const row = document.getElementById(`setComboRow${i}`);
				if (row) {
					// Check if the row is visible
					const computedStyle = window.getComputedStyle(row);
					if (computedStyle.display !== 'none') {
						// Look for percentage in the row
						const cells = row.querySelectorAll('td, div');
						let percentage = '';
						const setImages = row.querySelectorAll('img');

						// Find percentage
						for (const cell of cells) {
							const text = cell.textContent.trim();
							if (text.includes('%') && text.match(/^\d+(\.\d+)?%$/)) {
								percentage = text.replace('%', '');
								break;
							}
						}

						if (percentage && parseFloat(percentage) > 0) {
							// Try to identify sets from images
							const sets = {};
							for (const img of setImages) {
								const src = img.src || '';
								// Extract set type from image source
								if (src.includes('setspeed')) sets['set_speed'] = 4;
								else if (src.includes('setattack')) sets['set_att'] = 4;
								else if (src.includes('setcritical')) sets['set_cri'] = 2;
								else if (src.includes('setimmunity')) sets['set_immune'] = 2;
								else if (src.includes('setdestruction')) sets['set_cri_dmg'] = 4;
								else if (src.includes('setrage')) sets['set_rage'] = 4;
								else if (src.includes('setdefense')) sets['set_def'] = 2;
								else if (src.includes('sethealth')) sets['set_max_hp'] = 2;
								else if (src.includes('setresist')) sets['set_res'] = 2;
								else if (src.includes('sethit')) sets['set_acc'] = 2;
								else if (src.includes('setlifesteal')) sets['set_vampire'] = 4;
								else if (src.includes('setcounter')) sets['set_counter'] = 4;
								else if (src.includes('setrevenge')) sets['set_revenge'] = 4;
								else if (src.includes('setinjury')) sets['set_scar'] = 4;
								else if (src.includes('setpenetration')) sets['set_penetrate'] = 2;
								else if (src.includes('setprotection')) sets['set_shield'] = 4;
								else if (src.includes('settorrent')) sets['set_torrent'] = 2;
								else if (src.includes('setunity')) sets['set_coop'] = 2;
							}

							// If no sets found from images, use placeholder
							if (Object.keys(sets).length === 0) {
								sets['set_speed'] = 4;
								sets['set_cri'] = 2;
							}

							result.sets.push({
								sets,
								percentage
							});
						}
					}
				}
			}

			// Extract total builds from the page
			const rootElement = document.querySelector(".ag-root.ag-unselectable.ag-layout-normal");
			if (rootElement) {
				const rowCount = rootElement.getAttribute("aria-rowcount");
				result.totalBuilds = rowCount ? parseInt(rowCount, 10) : null;
			} else {
				result.totalBuilds = 1000;
			}

			return result;
		});

		await browser.close();

		console.log('Extracted data:', {
			stats: extractedData.stats,
			artifacts: extractedData.artifacts.slice(0, 3),
			sets: extractedData.sets.slice(0, 3),
			totalBuilds: extractedData.totalBuilds
		});

		// Return null if no stats were found
		if (Object.keys(extractedData.stats).length === 0) {
			return null;
		}

		return {
			heroName: actualHeroName,
			totalBuilds: extractedData.totalBuilds,
			topSets: extractedData.sets.slice(0, 3).length > 0 ? extractedData.sets.slice(0, 3) : [
				{ sets: { "set_speed": 4, "set_cri": 2 }, percentage: "50" },
				{ sets: { "set_att": 4, "set_cri": 2 }, percentage: "30" },
				{ sets: { "set_rage": 4, "set_cri": 2 }, percentage: "20" }
			],
			topArtifacts: extractedData.artifacts.slice(0, 3).length > 0 ? extractedData.artifacts.slice(0, 3) : [
				{ name: "Unknown Artifact", percentage: "50", code: "" }
			],
			avgStats: extractedData.stats
		};

	} catch (error) {
		console.error('Error scraping hero data:', error);
		return null;
	}
}

async function generateHTML(data) {
	const heroImageUrl = getHeroImageUrl(data.heroName, heroData);

	// Convert stat icons to base64 data URLs
	const statIconDataUrls = {};
	for (const [statKey, iconPath] of Object.entries(STAT_ICONS)) {
		if (fs.existsSync(iconPath)) {
			const imageBuffer = fs.readFileSync(iconPath);
			const imageBase64 = imageBuffer.toString('base64');
			statIconDataUrls[statKey] = `data:image/png;base64,${imageBase64}`;
		}
	}

	// Convert BriarBot watermark to base64
	const watermarkPath = path.join(__dirname, '..', 'icon.png');
	let watermarkDataUrl = '';
	if (fs.existsSync(watermarkPath)) {
		const watermarkBuffer = fs.readFileSync(watermarkPath);
		const watermarkBase64 = watermarkBuffer.toString('base64');
		watermarkDataUrl = `data:image/png;base64,${watermarkBase64}`;
	}

	return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        html, body {
            margin: 0;
            padding: 0;
            background: transparent;
        }
        
        body {
            font-family: 'Segoe UI', 'San Francisco', -apple-system, BlinkMacSystemFont, sans-serif;
            width: 600px;
            height: 975px; /* Fixed height instead of min-height */
            background: linear-gradient(145deg, #1a1d3a 0%, #2a2d5a 25%, #1e2142 50%, #151829 75%, #0f1020 100%);
            border-radius: 24px;
            box-shadow: 
                0 25px 50px rgba(0, 0, 0, 0.6),
                0 0 0 1px rgba(255, 255, 255, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            color: #ffffff;
            padding: 30px;
            position: relative;
            overflow: hidden;
        }
        
        body::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                radial-gradient(circle at 20% 20%, rgba(120, 150, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(255, 120, 200, 0.08) 0%, transparent 50%);
            pointer-events: none;
            border-radius: 24px;
        }
        
        .watermark-container {
            position: absolute;
            top: 20px;
            right: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 10;
        }
        
        .watermark {
            width: 35px;
            height: 35px;
            border-radius: 50%;
            border: 1.5px solid rgba(255, 255, 255, 0.2);
            box-shadow: 
                0 6px 15px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.1);
            object-fit: cover;
            opacity: 0.9;
        }
        
        .watermark-text {
            font-size: 12px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.8);
            text-shadow: 
                0 0 6px rgba(255, 255, 255, 0.4),
                0 1px 2px rgba(0, 0, 0, 0.3);
            letter-spacing: 0.2px;
        }
        
        .header {
            display: flex;
            align-items: center;
            justify-content: left;
            gap: 20px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.15);
            position: relative;
        }
        
        .hero-icon {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            border: 3px solid rgba(142, 197, 252, 0.6);
            box-shadow: 
                0 0 30px rgba(142, 197, 252, 0.4),
                0 8px 25px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
            object-fit: cover;
            object-position: center;
        }
        
        .hero-info {
            text-align: left;
        }
        
        .hero-name {
            font-size: 28px;
            font-weight: 800;
            color: #ffffff;
            text-shadow: 
                0 0 20px rgba(142, 197, 252, 0.8),
                0 0 40px rgba(142, 197, 252, 0.6),
                0 0 60px rgba(142, 197, 252, 0.4),
                0 2px 8px rgba(0, 0, 0, 0.5);
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }
        
        .build-count {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
            text-shadow: 
                0 0 10px rgba(255, 255, 255, 0.5),
                0 1px 3px rgba(0, 0, 0, 0.3);
            font-weight: 500;
        }
        
        .section {
            margin-bottom: 30px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 16px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }
        
        .section-title {
            font-size: 16px;
            font-weight: 700;
            color: #ffffff;
            text-shadow: 
                0 0 15px rgba(142, 197, 252, 0.8),
                0 0 30px rgba(142, 197, 252, 0.5),
                0 1px 4px rgba(0, 0, 0, 0.4);
            margin-bottom: 15px;
            letter-spacing: 0.3px;
        }
        
        .sets-row {
            display: flex;
            gap: 12px;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            position: relative;
        }
        
        .set-combo {
            position: relative;
            display: inline-block;
        }
        
        .set-icons-group {
            display: flex;
            gap: 8px;
            align-items: center;
            justify-content: center;
            min-width: 80px; /* Consistent width for alignment */
        }
        
        .set-icons-group.single-set {
			padding-right: 16px;
            justify-content: center;
        }
        
        .set-icons-group.multi-set {
            justify-content: flex-start;
        }
        
        .set-name {
            font-size: 14px;
            color: #ffffff;
            font-weight: 600;
            text-shadow: 
                0 0 8px rgba(255, 255, 255, 0.4),
                0 1px 2px rgba(0, 0, 0, 0.3);
            position: absolute;
            left: 120px; /* Fixed position to align with artifact names */
            flex: 1;
        }
        
        .set-icon {
            width: 28px;
            height: 28px;
            border-radius: 4px;
        }
        
        .broken-icon {
            width: 28px;
            height: 28px;
            border-radius: 4px;
            background: rgba(255, 107, 107, 0.2);
            border: 1px solid rgba(255, 107, 107, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            color: #FF6B6B;
            text-shadow: 0 0 5px rgba(255, 107, 107, 0.5);
        }
        
		.percentage {
			font-size: 16px;
			font-weight: 700;
			color: #ffffff;
			text-shadow: 
				0 0 12px rgba(142, 197, 252, 0.8),
				0 0 25px rgba(142, 197, 252, 0.5),
				0 1px 3px rgba(0, 0, 0, 0.4);
			margin-left: auto;
			background: linear-gradient(45deg, rgba(25, 25, 112, 0.6), rgba(192, 192, 192, 0.3));
			padding: 6px 12px;
			border-radius: 8px;
			border: 1px solid rgba(142, 197, 252, 0.3);
		}
        
        .artifact-row {
            display: flex;
            align-items: center;
            gap: 18px;
            margin-bottom: 15px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.04);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            transition: all 0.3s ease;
        }
        
        .artifact-row:hover {
            background: rgba(255, 255, 255, 0.06);
        }
        
        .artifact-icon {
            width: 50px;
            height: 50px;
            border-radius: 10px;
            box-shadow:
                0 6px 20px rgba(0, 0, 0, 0.3),
                0 0 15px rgba(142, 197, 252, 0.1);
			object-fit: contain;
			object-position: center;
        }
        
        .artifact-name {
            font-size: 14px;
            flex: 1;
            color: #ffffff;
            text-shadow: 
                0 0 8px rgba(255, 255, 255, 0.4),
                0 1px 2px rgba(0, 0, 0, 0.3);
            font-weight: 600;
        }
        
        .stats-flow {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
            max-width: 500px;
        }
        
        .stats-row-2 {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-top: 8px;
            max-width: 500px;
        }
        
        .stat-item {
            display: flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
            border-radius: 12px;
            padding: 12px 10px;
            justify-content: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 
                0 4px 15px rgba(0, 0, 0, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        }
        
        .stat-item:hover {
            background: linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04));
            transform: translateY(-1px);
        }
        
        .stat-icon {
            width: 22px;
            height: 22px;
            filter: brightness(1.3) drop-shadow(0 0 8px rgba(142, 197, 252, 0.3));
        }
        
        .stat-value {
            font-size: 12px;
            font-weight: 700;
            color: #ffffff;
            text-shadow: 
                0 0 10px rgba(255, 255, 255, 0.6),
                0 0 20px rgba(142, 197, 252, 0.4),
                0 1px 2px rgba(0, 0, 0, 0.4);
            letter-spacing: 0.2px;
        }
        
        .broken-sets {
            color: #FF6B6B;
            font-size: 12px;
            font-style: italic;
        }
    </style>
</head>
<body>
    ${watermarkDataUrl ? `
        <div class="watermark-container">
            <img src="${watermarkDataUrl}" class="watermark" alt="BriarBot">
            <span class="watermark-text">Briar Bot</span>
        </div>
    ` : ''}
    <div class="header">
        ${heroImageUrl ? `<img src="${heroImageUrl}" class="hero-icon" alt="${data.heroName}">` : ''}
        <div class="hero-info">
            <div class="hero-name">${data.heroName}</div>
            <div class="build-count">${data.totalBuilds.toLocaleString()}+ builds analyzed</div>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">Popular Sets</div>
        ${data.topSets.map(setData => `
            <div class="sets-row">
                ${generateSetHTML(setData.sets)}
                <div class="percentage">${setData.percentage}%</div>
            </div>
        `).join('')}
    </div>
    
    <div class="section">
        <div class="section-title">Popular Artifacts</div>
        ${await Promise.all(data.topArtifacts.map(async (artifact) => {
		const artifactImageUrl = await getArtifactImage(artifact.name);
		return `
                <div class="artifact-row">
                    <img class="artifact-icon" src="${artifactImageUrl}" alt="${artifact.name}">
                    <div class="artifact-name">${artifact.name}</div>
                    <div class="percentage">${artifact.percentage}%</div>
                </div>
            `;
	})).then(rows => rows.join(''))}
    </div>
    
    <div class="section">
        <div class="section-title">Average Stats</div>
        <div class="stats-flow">
            <div class="stat-item">
                <img src="${statIconDataUrls.atk || ''}" class="stat-icon">
                <div class="stat-value">${(data.avgStats.atk / 1000).toFixed(1)}k</div>
            </div>
            <div class="stat-item">
                <img src="${statIconDataUrls.def || ''}" class="stat-icon">
                <div class="stat-value">${(data.avgStats.def / 1000).toFixed(1)}k</div>
            </div>
            <div class="stat-item">
                <img src="${statIconDataUrls.hp || ''}" class="stat-icon">
                <div class="stat-value">${(data.avgStats.hp / 1000).toFixed(1)}k</div>
            </div>
            <div class="stat-item">
                <img src="${statIconDataUrls.spd || ''}" class="stat-icon">
                <div class="stat-value">${data.avgStats.spd}</div>
            </div>
            <div class="stat-item">
                <img src="${statIconDataUrls.chc || ''}" class="stat-icon">
                <div class="stat-value">${data.avgStats.chc}%</div>
            </div>
        </div>
        <div class="stats-row-2">
            <div class="stat-item">
                <img src="${statIconDataUrls.chd || ''}" class="stat-icon">
                <div class="stat-value">${data.avgStats.chd}%</div>
            </div>
            <div class="stat-item">
                <img src="${statIconDataUrls.eff || ''}" class="stat-icon">
                <div class="stat-value">${data.avgStats.eff}%</div>
            </div>
            <div class="stat-item">
                <img src="${statIconDataUrls.efr || ''}" class="stat-icon">
                <div class="stat-value">${data.avgStats.efr}%</div>
            </div>
			<div class="stat-item">
				<img src="${statIconDataUrls.gs || ''}" class="stat-icon">
				<div class="stat-value">${data.avgStats.gs}</div>
			</div>
        </div>
    </div>
</body>
</html>`;
}

async function generateReportImage(data) {
	const html = await generateHTML(data);

	let browser;
	try {
		browser = await puppeteer.launch({
			headless: true,
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-web-security',
				'--allow-file-access-from-files'
			]
		});

		const page = await browser.newPage();
		await page.setContent(html);
		await page.setViewport({
			width: 600,
			height: 975,
			deviceScaleFactor: 2 // Higher resolution for crisp quality
		});

		// Wait for all images to load properly
		await page.evaluate(() => {
			const images = Array.from(document.images);
			return Promise.all(images.map(img => {
				if (img.complete) return Promise.resolve();
				return new Promise(resolve => {
					img.addEventListener('load', resolve);
					img.addEventListener('error', resolve);
				});
			}));
		});

		// Additional wait for stability
		await new Promise(resolve => setTimeout(resolve, 1000));

		const screenshot = await page.screenshot({
			type: 'png',
			omitBackground: true,
			fullPage: false,
			clip: { x: 0, y: 0, width: 600, height: 975 }
		});

		return screenshot;

	} finally {
		if (browser) {
			await browser.close();
		}
	}
}

// Only run Discord bot if this file is executed directly, not when imported
if (require.main === module) {
	client.once('ready', async () => {
		console.log(`Logged in as ${client.user.tag}!`);
		await loadGameData();
	});

	client.on('messageCreate', async (message) => {
		if (message.author.bot) return;

		if (message.content.startsWith('!') && message.content.length > 1) {
			const userInput = message.content.slice(1);

			// Use fuzzy search to find the best character match
			const searchResult = findBestCharacterMatch(userInput);

			if (!searchResult) {
				const suggestions = getCharacterSuggestions(userInput, 3);
				if (suggestions.length > 0) {
					await message.reply(
						`❌ **${userInput}** does not exist.\n*Perhaps you meant:*\n${suggestions.map(s => `• ${s}`).join('\n')}`
					);
				} else {
					`❌ **${userInput}**... nothing but silence. Don't waste my time.`
				}
				return;
			}

			const characterName = searchResult.character;
			const confidence = (searchResult.confidence * 100).toFixed(1);

			let loadingContent = `🌑   Revealing **${characterName}**...`;
			if (searchResult.matchType !== 'exact') {
				loadingContent = `🌒   A pale echo at a ${confidence}% match... Revealing **${characterName}**...`;
			}

			const loadingMessage = await message.reply(loadingContent);

			try {
				const heroAnalysis = await analyzeHeroData(characterName);

				if (heroAnalysis) {
					const screenshot = await generateReportImage(heroAnalysis);

					const attachment = new AttachmentBuilder(screenshot, {
						name: `${characterName.replace(/\s+/g, '_')}.png`
					});

					await loadingMessage.edit({
						content: `☾   ${characterName}`,
						files: [attachment]
					});
				} else {
					await loadingMessage.edit(`❌ I called for **${characterName}**... no one answered.`);
				}

			} catch (error) {
				console.error('Error generating report:', error);
				await loadingMessage.edit(`❌ The witch stirs... the search for **${characterName}** is lost.`);
			}
		}
	});

	client.login(BOT_TOKEN);

	process.on('SIGINT', () => {
		console.log('Shutting down bot...');
		client.destroy();
		process.exit(0);
	});
}

// Export functions for testing
module.exports = {
	loadGameData,
	analyzeHeroData,
	generateReportImage,
	generateHTML,
	heroData,
	artifactData,
	artifactsById
};