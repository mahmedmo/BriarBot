# Contributing

Bug fixes, security patches, and other critical improvements are welcome. Larger changes and feature enhancements will be reviewed individually to ensure they fit the project’s direction.

## Before you open a pull request

1. Keep the change focused on one problem.
2. Follow the local setup and checks in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).
3. Run `bun install --frozen-lockfile` and the relevant tests (`bun run test`, and `bun run test:character-data` when touching character data).
4. Do not commit secrets, `.env` files, `cache/`, logs, or `node_modules/`.

Describe what you changed, why it is needed, and how you verified it. Reviews may take a while.
