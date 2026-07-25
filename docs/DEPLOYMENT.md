# Deployment

Briar Bot runs as a single Docker Compose service. Runtime cache and logs live in local bind mounts. The published image is `ghcr.io/ahdmuh/briar-bot`.

## Docker Compose

From a checkout of this repository (or any directory that has the compose file and a `.env` beside it as compose expects):

```bash
cp .env.example .env
# Edit .env and set BOT_TOKEN
docker compose -f .docker/compose.yml pull
docker compose -f .docker/compose.yml up -d --remove-orphans
```

Compose loads `../.env` relative to `.docker/compose.yml` and mounts `../cache` and `../logs` into the container. Pull the image alone with:

```bash
docker pull ghcr.io/ahdmuh/briar-bot:latest
```

To update an existing deployment, pull again and recreate:

```bash
docker compose -f .docker/compose.yml pull
docker compose -f .docker/compose.yml up -d --remove-orphans
```

## Optional automatic updater

On a server that already uses the Compose layout, install the optional updater:

```bash
bash scripts/install-updater.sh 5
```

The `5` is the update check interval in minutes. The updater runs `scripts/update-briar-bot.sh`, pulls the configured image, and recreates the bot when a new image is available.

## Configuration

Copy `.env.example` to `.env` and set the variables you need. Full defaults also appear in `.env.example`.

| Variable | Requirement | Description | Default |
| -------- | ----------- | ----------- | ------- |
| `BOT_TOKEN` | Required | Discord bot token from the Discord Developer Portal | — |
| `GUILD_WAR_ANNOUNCEMENT_CHANNELS` | Optional | Comma-separated Discord channel IDs for guild war reminders. Empty disables reminders. | — |
| `CACHE_TTL_DAYS` | Optional | Number of days to keep cached data | `30` |
| `CACHE_MAX_SIZE` | Optional | Maximum cache entries | `500` |
| `CACHE_CLEANUP_INTERVAL` | Optional | Cache cleanup interval in milliseconds | `3600000` |
| `RATE_LIMIT_MAX_RETRIES` | Optional | Maximum retry attempts for rate-limited requests | `12` |
| `RATE_LIMIT_BASE_DELAY` | Optional | Base delay for rate-limit backoff (ms) | `1000` |
| `RATE_LIMIT_MAX_DELAY` | Optional | Maximum delay for rate-limit backoff (ms) | `300000` |
| `MAX_MEMORY_RESTART` | Optional | Memory threshold used by runtime cleanup logic | `1024M` |
| `MEMORY_CLEANUP_INTERVAL` | Optional | Memory cleanup interval in milliseconds | `1800000` |

Guild war announcements are scheduled for 00:00 UTC:

- Mon / Wed / Fri: attack announcements (guild war ends in 3 hours)
- Sun / Tue / Thu: defense announcements (guild war begins in 3 hours)

## Image publication

The **Briar · Image** workflow builds the Docker image and publishes `latest` and SHA-tagged images to GitHub Container Registry. The **Characters · Sync** workflow can add or update character names and aliases, then reuses image publication rather than duplicating those steps.
