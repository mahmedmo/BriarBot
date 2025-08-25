# Epic Seven Build Analyzer 🗡️

A standalone console application that extracts and analyzes popular Epic Seven hero builds from the Fribbels Hero Library. Get instant access to community-driven build data, statistics, and meta insights for any hero.

## Features

- **Popular Build Analysis**: Get top community builds with gear scores, stats, and rankings
- **Statistical Insights**: Min/max/average stats across all builds
- **Set Popularity**: See which gear set combinations are most popular
- **Artifact Usage**: Track which artifacts are commonly used
- **Hero Search**: Fuzzy search and hero information lookup
- **Build Comparison**: Compare stats between multiple heroes
- **No Rate Limits**: Direct API access to Fribbels Hero Library data

## Installation

```bash
# Install dependencies
npm install

# Make globally accessible (optional)
npm link
```

## Quick Start

```bash
# Analyze a hero's popular builds
node src/index.js analyze "Arbiter Vildred"

# Or if installed globally
e7builds analyze "Arbiter Vildred"
```

## Usage Examples

### Basic Hero Analysis
```bash
# Full analysis with all sections
e7builds analyze "Seaside Bellona"

# Show only top 10 builds
e7builds analyze "Luna" -t 10

# Hide certain sections
e7builds analyze "Fallen Cecilia" --no-artifacts --no-sets
```

### Search and Browse
```bash
# List all heroes
e7builds list

# Search for heroes by name
e7builds search bellona

# Get hero base stats and info
e7builds info "Remnant Violet"
```

### Advanced Features
```bash
# Compare multiple heroes
e7builds compare "Arbiter Vildred" "Remnant Violet" "Luna"

# Show gear score percentile distribution
e7builds analyze "Straze" --distribution

# Get examples and help
e7builds examples
e7builds --help
```

## Sample Output

```
═══════════════════════════════════════════════════════════
  ARBITER VILDRED - POPULAR BUILDS ANALYSIS
═══════════════════════════════════════════════════════════

  📊 Total builds analyzed: 1,247
  🏆 Top gear score: 387
  📈 Average gear score: 312

🔥 TOP BUILDS
────────────────────────────────────────────────
┌────┬──────┬───────┬───────┬────────┬──────┬─────┬─────┬──────────────────┐
│ #  │ GS   │ ATK   │ DEF   │ HP     │ SPD  │ CC  │ CD  │ Sets             │
├────┼──────┼───────┼───────┼────────┼──────┼─────┼─────┼──────────────────┤
│ 1  │ 387  │ 4,234 │ 1,012 │ 12,456 │ 283  │ 98% │ 312% │ Speed + Immunity │
│ 2  │ 385  │ 4,189 │ 978   │ 11,892 │ 289  │ 95% │ 318% │ Speed + Critical │
│ 3  │ 381  │ 4,312 │ 945   │ 11,234 │ 276  │ 100%│ 295% │ Attack + Immunity│
└────┴──────┴───────┴───────┴────────┴──────┴─────┴─────┴──────────────────┘

⚡ POPULAR SET COMBINATIONS
────────────────────────────────────────────────
1.   42.3% ████████████████████████ Speed + Immunity
2.   28.7% ██████████████████ Speed + Critical  
3.   15.2% ████████████ Attack + Immunity
4.    8.4% ████████ Destruction + Immunity
5.    3.8% ████ Speed + Hit
```

## Data Sources

This application uses the official Fribbels Epic Seven Optimizer data sources:

- **Hero Data**: AWS S3 / Azure CDN endpoints with complete hero information
- **Build Data**: Fribbels Hero Library Lambda API with community builds
- **Filtering**: 350+ gear score minimum, verified items only, anonymized stats

## Architecture

```
src/
├── data/
│   ├── heroFetcher.js     # Fetches hero/artifact data from Fribbels CDN
│   └── buildsFetcher.js   # Fetches popular builds from Hero Library API
├── utils/
│   └── formatter.js       # Console output formatting and tables
├── analyzer.js            # Main analysis logic and coordination
└── index.js              # CLI interface and commands
```

## API Endpoints

The application connects to these public endpoints:

- **Hero Data**: `https://e7-optimizer-game-data.s3-accelerate.amazonaws.com/herodata.json`
- **Artifact Data**: `https://e7-optimizer-game-data.s3-accelerate.amazonaws.com/artifactdata.json`
- **Builds Data**: `https://krivpfvxi0.execute-api.us-west-2.amazonaws.com/dev/getBuilds`

## Commands Reference

| Command | Alias | Description | Example |
|---------|-------|-------------|---------|
| `analyze <hero>` | `a` | Analyze popular builds for a hero | `e7builds analyze "Luna"` |
| `list [search]` | `ls` | List all heroes or search | `e7builds list seaside` |
| `info <hero>` | `i` | Get hero information | `e7builds info "Krau"` |
| `compare <heroes...>` | `c` | Compare multiple heroes | `e7builds compare "A.Vildred" "R.Violet"` |
| `search <term>` | `s` | Search heroes by name | `e7builds search vildred` |
| `examples` | - | Show usage examples | `e7builds examples` |

## Options

| Option | Description | Example |
|--------|-------------|---------|
| `-t, --top <number>` | Number of top builds to show | `--top 10` |
| `--no-stats` | Hide statistics section | `--no-stats` |
| `--no-sets` | Hide set popularity | `--no-sets` |
| `--no-artifacts` | Hide artifact popularity | `--no-artifacts` |
| `--no-builds` | Hide top builds table | `--no-builds` |
| `-d, --distribution` | Show gear score percentiles | `--distribution` |

## Error Handling

- **Hero not found**: Suggests similar hero names
- **No build data**: Indicates if hero has no community builds yet
- **Network errors**: Falls back to Azure CDN if AWS S3 is unavailable
- **Invalid input**: Clear error messages and suggestions

## Performance

- **Caching**: Hero and artifact data cached in memory
- **Concurrent**: Parallel API calls when comparing heroes
- **Efficient**: Only fetches needed data, minimal processing

## Contributing

This tool extracts logic from the open-source Fribbels Epic Seven Optimizer. The build data comes from the community of optimizer users who have opted in to data sharing.

## License

MIT - Extracted and modularized from Fribbels Epic Seven Optimizer

## Credits

- **Fribbels**: Original Epic Seven Optimizer and Hero Library
- **Community**: Epic Seven players sharing build data
- **SG/SC**: Epic Seven game assets and data