# 🌙  BriarBot

*"The witch stirs... speak your desires, mortal."*

A Discord bot that provides Epic Seven character build analysis and statistics.

## What BriarBot Does

- **Build Statistics** - Average stats from thousands of players
- **Popular Gear Sets** - Most used set combinations
- **Artifact Recommendations** - Popular artifact choices
- **Visual Reports** - Clean stat cards with build data
- **Server Integration** - Seamless discord server integration


## Commands

```
!arbiter vildred    → Get Arbiter Vildred build data
!luna               → Get Luna build data
!seaside bellona    → Get Seaside Bellona build data
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

## Testing

```bash
npm test                 → Run all tests
npm run test:bot         → Test bot workflow and scraping
npm run test:search      → Test character search functionality
npm run test:interactive → Interactive testing mode
```

## Built With

- Discord.js
- Puppeteer
- Epic Seven Optimizer Data

---

*☾ The witch awaits your command...*