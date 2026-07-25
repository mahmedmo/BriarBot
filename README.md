<div align="center">

# Briar Bot

**Epic Seven builds in Discord.**

Look up popular character builds, gear sets, artifacts, and guild war reminders from chat.

<p>
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-F59E0B?style=flat&logo=javascript&logoColor=white">
  <img alt="Discord" src="https://img.shields.io/badge/Discord-5865F2?style=flat&logo=discord&logoColor=white">
  <img alt="Self-Host" src="https://img.shields.io/badge/Self--Host-2496ED?style=flat&logo=docker&logoColor=white">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/GPL--3.0-0B1F3A?style=flat&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI%2BPHBhdGggZmlsbD0iI2ZmZiIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMiAxQzEyLjU1MjMgMSAxMyAxLjQ0NzcyIDEzIDJWMy4wMzI0MUMxNC4yNDk4IDMuMTEwNzYgMTUuNDU1MSAzLjMxODcyIDE2LjQ5OTYgMy41MTc2NkMxNi43MzYzIDMuNTYyNzQgMTYuOTYxNCAzLjYwNjcgMTcuMTc2NiAzLjY0ODc1QzE3LjU3NzIgMy43MjY5NyAxNy45NDQyIDMuNzk4NjUgMTguMjg4NSAzLjg1ODU0QzE4LjgyMDEgMy45NTA5OSAxOS4yMTY5IDQgMTkuNSA0QzIwLjAyNjIgNCAyMC40Nzk5IDMuODI0IDIwLjgxNjQgMy42MzE3NkMyMC45ODcgMy41MzQyNSAyMS4xNTQ0IDMuNDIxOTIgMjEuMjk4NSAzLjI4NzMyQzIxLjY4OTUgMi45MDIzOCAyMi4zMTg1IDIuOTA0MjMgMjIuNzA3MSAzLjI5Mjg5QzIzLjA5NzYgMy42ODM0MiAyMy4wOTc2IDQuMzE2NTggMjIuNzA3MSA0LjcwNzExQzIyLjYyNDggNC43ODkyOSAyMi41MzU4IDQuODY0NSAyMi40NDUgNC45MzcxMkMyMi4yOTQ3IDUuMDU3MzUgMjIuMDggNS4yMTMxOCAyMS44MDg2IDUuMzY4MjRDMjEuNTUzMSA1LjUxNDI1IDIxLjIzOTYgNS42NjM5MiAyMC44NzY2IDUuNzgwOUwyMy41OTIgMTIuNzYzM0MyMy44NDA4IDEzLjQwMyAyNC4wODgzIDE0LjMwOTYgMjMuNzczMyAxNS4yMzg4QzIzLjU4MDkgMTUuODA2NCAyMy4yMTExIDE2LjUxMTQgMjIuNTAyNCAxNy4wNzMzQzIxLjc4MjggMTcuNjQzOCAyMC43OTc4IDE4IDE5LjUgMThDMTguMjAyMiAxOCAxNy4yMTcyIDE3LjY0MzggMTYuNDk3NiAxNy4wNzMzQzE1Ljc4ODkgMTYuNTExNCAxNS40MTkxIDE1LjgwNjQgMTUuMjI2NyAxNS4yMzg4QzE0LjkxMTcgMTQuMzA5NiAxNS4xNTkyIDEzLjQwMyAxNS40MDggMTIuNzYzM0wxOC4wOTQ4IDUuODU0MzhDMTcuNjgyNSA1Ljc4NTQ1IDE3LjIzNjMgNS42OTgxOSAxNi43NjQzIDUuNjA2MDZDMTYuNTUzNSA1LjU2NDkgMTYuMzM5NCA1LjUyMzEgMTYuMTI1NCA1LjQ4MjM0QzE1LjEzMTQgNS4yOTMgMTQuMDY4OSA1LjExMjA0IDEzIDUuMDM2NzFWMjFIMTdDMTcuNTUyMyAyMSAxOCAyMS40NDc3IDE4IDIyQzE4IDIyLjU1MjMgMTcuNTUyMyAyMyAxNyAyM0g3QzYuNDQ3NzIgMjMgNiAyMi41NTIzIDYgMjJDNiAyMS40NDc3IDYuNDQ3NzIgMjEgNyAyMUgxMVY1LjAzNjcxQzkuOTMxMDYgNS4xMTIwNCA4Ljg2ODYzIDUuMjkzIDcuODc0NjIgNS40ODIzNEM3LjY2MDYzIDUuNTIzMSA3LjQ0NjUxIDUuNTY0OSA3LjIzNTY3IDUuNjA2MDZDNi43NjM3NSA1LjY5ODE5IDYuMzE3NDkgNS43ODU0NSA1LjkwNTIyIDUuODU0MzhMOC41OTIwMyAxMi43NjMzQzguODQwNzkgMTMuNDAzIDkuMDg4MzEgMTQuMzA5NiA4Ljc3MzMyIDE1LjIzODhDOC41ODA5NSAxNS44MDY0IDguMjExMTMgMTYuNTExNCA3LjUwMjM5IDE3LjA3MzNDNi43ODI4MyAxNy42NDM4IDUuNzk3ODEgMTggNC41IDE4QzMuMjAyMTkgMTggMi4yMTcxNyAxNy42NDM4IDEuNDk3NjIgMTcuMDczM0MwLjc4ODg3OSAxNi41MTE0IDAuNDE5MDU3IDE1LjgwNjQgMC4yMjY2ODkgMTUuMjM4OEMtMC4wODgzMDQ3IDE0LjMwOTYgMC4xNTkyMSAxMy40MDMgMC40MDc5NzUgMTIuNzYzM0wzLjEyMzM2IDUuNzgwOUMyLjc2MDQgNS42NjM5MiAyLjQ0Njg4IDUuNTE0MjUgMi4xOTEzNiA1LjM2ODI0QzEuOTIgNS4yMTMxOCAxLjcwNTI5IDUuMDU3MzUgMS41NTUgNC45MzcxMkMxLjU0NjIzIDQuOTMwMSAxLjI5MjkgNC43MDcxMSAxLjI5MjkgNC43MDcxMUMwLjkwMjM3MiA0LjMxNjU4IDAuOTAyMzcyIDMuNjgzNDIgMS4yOTI5IDMuMjkyODlDMS42ODE1NSAyLjkwNDI0IDIuMzEwNTIgMi45MDIzOCAyLjcwMTQ3IDMuMjg3M0MyLjcxNDU1IDMuMjk5NzMgMi44OTU2OCAzLjQ2NzIxIDMuMTgzNjQgMy42MzE3NkMzLjUyMDA3IDMuODI0IDMuOTczNzggNCA0LjUgNEM0Ljc4MzExIDQgNS4xNzk4OSAzLjk1MDk5IDUuNzExNDcgMy44NTg1NEM2LjA1NTk0IDMuNzk4NjMgNi40MjI2NyAzLjcyNzAxIDYuODIzMyAzLjY0ODc2QzcuMDM4NTEgMy42MDY3MyA3LjI2MzgyIDMuNTYyNzIgNy41MDAzOSAzLjUxNzY2QzguNTQ0ODYgMy4zMTg3MiA5Ljc1MDE2IDMuMTEwNzYgMTEgMy4wMzI0MVYyQzExIDEuNDQ3NzIgMTEuNDQ3NyAxIDEyIDFaTTQuNSA3Ljc1OTAzTDIuNDYxODUgMTNINi41MzgxNkw0LjUgNy43NTkwM1pNMi43NDAxNiAxNS41MDYxQzIuNTUxOTEgMTUuMzU2OSAyLjQxMDIgMTUuMTgxOCAyLjMwMzUxIDE1SDYuNjk2NUM2LjU4OTgxIDE1LjE4MTggNi40NDgwOSAxNS4zNTY5IDYuMjU5ODUgMTUuNTA2MUM1Ljk0NDQ0IDE1Ljc1NjIgNS40MTU4NSAxNiA0LjUgMTZDMy41ODQxNiAxNiAzLjA1NTU2IDE1Ljc1NjIgMi43NDAxNiAxNS41MDYxWk0xNy40NjE4IDEzTDE5LjUgNy43NTkwM0wyMS41MzgyIDEzSDE3LjQ2MThaTTE3LjMwMzUgMTVDMTcuNDEwMiAxNS4xODE4IDE3LjU1MTkgMTUuMzU2OSAxNy43NDAyIDE1LjUwNjFDMTguMDU1NiAxNS43NTYyIDE4LjU4NDIgMTYgMTkuNSAxNkMyMC40MTU4IDE2IDIwLjk0NDQgMTUuNzU2MiAyMS4yNTk4IDE1LjUwNjFDMjEuNDQ4MSAxNS4zNTY5IDIxLjU4OTggMTUuMTgxOCAyMS42OTY1IDE1SDE3LjMwMzVaIi8%2BPC9zdmc%2B&logoColor=white"></a>
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

For more in-depth setup instructions, refer to [DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Development

See [DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Contributing

Bug fixes, security patches, and other critical improvements are welcome. Larger changes and feature enhancements will be reviewed individually to ensure they fit the project’s direction. See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. I’m also a student with limited free time, so reviews may take a while. Thanks for bearing with me.

## Transparency

This project was built with help from agentic coding tools, used throughout development to implement features, debug issues, and refine the code.

## Credits

This project benefits from the work of talented developers, including [Fribbels Epic 7 Optimizer](https://github.com/fribbels/Fribbels-Epic-7-Optimizer) for its build data aggregation. Thank you!
