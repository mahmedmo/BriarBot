# 🌙  BriarBot

*"The witch stirs... speak your desires, mortal."*

A Discord bot that provides Epic Seven character build analysis and statistics.

<div align="center">
<img src="example.png" alt="Example Usage" width="250">
</div>

## What BriarBot Does

- **Build Statistics** - Average stats from thousands of players
- **Popular Gear Sets** - Most used set combinations
- **Artifact Recommendations** - Popular artifact choices
- **Visual Reports** - Clean stat cards with build data
- **Guild War Announcements** - Automated reminders for guild war attack and defense phases
- **Server Integration** - Seamless discord server integration


## Commands

**Character Builds:**
```
!arbiter vildred    → Get Arbiter Vildred build data
!luna               → Get Luna build data
!seaside bellona    → Get Seaside Bellona build data
```

**Guild War Announcements (Admin Only):**
```
!testguildwar both     → Test both announcement types
!testguildwar attack   → Test attack announcement
!testguildwar defense  → Test defense announcement
```

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Bot Token**
   - Set your Discord bot token in `.env`
   - Grant bot permissions: Read Messages, Send Messages, Attach Files

3. **Start the Bot**
   ```bash
   npm start
   ```

## Character Update Automation

You can now add a new Epic Seven unit without hand-editing source files:

1. Open the **Manage Character Data** GitHub Action.
2. Enter the full unit name in `character_name`.
3. Optionally enter abbreviations in `aliases` as comma-separated values like `spoli, sea politis`.
4. Run the workflow against `main` or `develop`.

The workflow updates both [assets/data/character-names.json](assets/data/character-names.json) and [assets/data/character-aliases.json](assets/data/character-aliases.json), validates the search layer, and commits the result back to the branch.

## Hands-Off Server Updates

For a one-time server setup, use the published GitHub Container Registry image plus Watchtower:

1. On the server, set `BRIARBOT_IMAGE=ghcr.io/<owner>/<repo>:latest` in `.env`.
2. Run `docker login ghcr.io` once on the server.
3. Start the production stack with `docker compose -f docker-compose.server.yml up -d`.

After that, pushes to `main` trigger the **Publish Container** workflow, GHCR gets a fresh image, and Watchtower automatically pulls and restarts BriarBot on your server.

## Testing

```bash
npm test                 → Run automated test suite
npm run test:character-data → Validate character names and aliases
npm run test:interactive → Interactive testing mode
```

The test suite includes:
- Character search functionality
- Full workflow testing (data analysis + image generation)  
- Cache system validation
- Performance benchmarks

## Built With

- **Node.js** - Runtime environment
- **Discord.js** - Discord API integration  
- **Puppeteer** - Web scraping and image generation
- **Docker** - Containerized deployment
- **[Fribbels Epic 7 Optimizer](https://github.com/fribbels/Fribbels-Epic-7-Optimizer)** - Build data source

## License

This project is licensed under GPL-3.0-only. See [LICENSE](LICENSE).

---

*☾ The witch awaits your command...*
