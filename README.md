<div align="center">

# Briar Bot

**Epic Seven builds in Discord.**

Look up popular character builds, gear sets, artifacts, and guild war reminders from chat.

<p>
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black">
  <img alt="Discord" src="https://img.shields.io/badge/Discord-5865F2?style=flat&logo=discord&logoColor=white">
  <img alt="Self-Host" src="https://img.shields.io/badge/Self--Host-2496ED?style=flat&logo=docker&logoColor=white">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/GPL--3.0-0B1F3A?style=flat&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI%2BPHBhdGggZmlsbD0iI2ZmZiIgZD0iTTEyIDNjLS42IDAtMSAuNC0xIDF2LjljLTIuNS40LTQuNSAyLjUtNC41IDUuMXYuMkwzLjYgMTFhMSAxIDAgMCAwLS41IDEuNGwyLjUgNC4zQTMgMyAwIDEgMCAxMSAxNS4zVjE5SDlhMSAxIDAgMSAwIDAgMmg2YTEgMSAwIDEgMCAwLTJoLTJ2LTMuN2EzIDMgMCAxIDAgNS40LTEuNmwyLjUtNC4zYTEgMSAwIDAgMC0uNS0xLjRMMTcuNSAxMC4ydi0uMmMwLTIuNi0yLTQuNy00LjUtNS4xVjRjMC0uNi0uNC0xLTEtMXptLTMgOC40IDMgMSAzLTEgLjkgMS42QTEgMSAwIDEgMSAxNCAxNWExIDEgMCAwIDEtLjItLjdMMTIgMTMuMWwtMS44IDEuMkExIDEgMCAxIDEgOC4xIDEzbC45LTEuNnoiLz48L3N2Zz4%3D&logoColor=white"></a>
</p>

<img src="assets/shared/briar-bot.png" alt="Briar Bot" width="280">

</div>

## About

Briar Bot is a Discord bot for Epic Seven players who want popular character build data without leaving chat. Type a character name or alias and it replies with a visual build report drawn from aggregated community data.

It provides:

- Character build lookups by name or common aliases
- Visual build report cards with common stat ranges, gear sets, and artifacts
- Optional guild war attack and defense reminders on a schedule
- A published container image for private and home-server deployments

Briar Bot is meant to stay a focused Epic Seven utility for Discord communities rather than a general-purpose game bot.

## Usage

Character lookups:

```text
!arbiter vildred
!luna
!seaside bellona
```

Guild war announcement tests (when channels are configured):

```text
!testguildwar both
!testguildwar attack
!testguildwar defense
```

<p><strong>Build Lookup</strong></p>

<img width="250" alt="Briar Bot character build response" src="assets/shared/screenshot.png" />

## Getting Started

The usual path is Docker. Pull the published image and run it with Compose:

```bash
docker pull ghcr.io/ahdmuh/briar-bot:latest
cp .env.example .env
# Set BOT_TOKEN (and optional guild war channels) in .env
docker compose -f .docker/compose.yml pull
docker compose -f .docker/compose.yml up -d --remove-orphans
```

Detailed configuration, environment variables, and the optional image updater are available in [DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Development

Instructions for installing dependencies with Bun, running the bot locally, and executing the test suite are available in [DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Contributing

Bug fixes, security patches, and other critical improvements are welcome. Larger changes and feature enhancements will be reviewed individually to ensure they fit the project’s direction. See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. I’m also a student with limited free time, so reviews may take a while. Thanks for bearing with me.

## Transparency

This project was built with help from agentic coding tools, used throughout development to implement features, debug issues, and refine the code.

## Credits

This project benefits from the work of talented developers, including [Fribbels Epic 7 Optimizer](https://github.com/fribbels/Fribbels-Epic-7-Optimizer) for its build data aggregation. Thank you!
