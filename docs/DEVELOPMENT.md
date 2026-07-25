# Development

Requires [Bun](https://bun.sh) 1.3.14 or newer (`packageManager` in `package.json`).

## Setup

```bash
cp .env.example .env
# Set BOT_TOKEN for a live Discord connection
bun install --frozen-lockfile
```

## Run locally

Development (auto-restart on changes):

```bash
bun run dev
```

Production-like local start:

```bash
bun start
```

Both entry points run `src/briar_bot.js`.

## Tests

```bash
bun run test
bun run test:character-data
```

- `bun run test` exercises core bot behavior in `src/briar_bot.test.js`.
- `bun run test:character-data` validates character name and alias data via `src/character_search.test.js`.

Interactive testing against a running process is available with `bun run test:interactive` (`scripts/interactive_test_runner.js`).

## Project layout

| Path | Role |
| ---- | ---- |
| `src/` | Service source and colocated tests |
| `data/` | Tracked character names and aliases |
| `cache/` | Runtime cache (ignored; created locally) |
| `assets/discord/` | Runtime icons used by Discord responses |
| `assets/shared/` | Brand and documentation artwork |
| `scripts/` | Updater install, image update helper, character data tools |
| `.docker/` | Dockerfile, Compose, container entrypoint |
| `.github/workflows/` | Image publish and character-data sync |

Source filenames use `snake_case`. Do not commit `.env`, `cache/`, or `node_modules/`.

## Docker build from source

```bash
docker build -f .docker/Dockerfile .
```
