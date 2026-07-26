# Contributing

Bug fixes, security patches, and other critical improvements are welcome. Larger changes and feature enhancements will be reviewed individually to ensure they fit the project’s direction.

## Overview

Briar Bot is a focused Epic Seven Discord utility. Prefer changes that improve reliability, correctness of build data, or the existing command surface.

## Before you start

1. Read [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md) for local setup and project layout.
2. Keep the change focused on one problem when practical.
3. From the repository root, install dependencies and run the checks that match your change:

```bash
bun install --frozen-lockfile
bun run test
```

When you touch character lookup data or search, also run `bun run test:character-data`.
4. Do not commit secrets, `.env` files, `cache/`, logs, or `node_modules/`.

## Pull requests

Open a pull request with a clear description. Use the structure below (copy into the PR body if it helps).

### Summary

What changed, and why the change is needed.

### Testing notes

What you ran (commands, clients, platforms) and what you verified by hand. Link to CI when it covers the change.

### Acceptance criteria

List concrete, checkable outcomes. Example:

- [ ] Behavior X works for Y
- [ ] Related tests pass
- [ ] No secrets or local data committed

Screenshots or short recordings are welcome for user-facing UI changes.

### What went wrong

If something is incomplete, flaky, or blocked, say so here. Include error messages, reproduction steps, and what still needs attention. Skip this section when everything is clean.

## Scope

Prefer small pull requests that stay within the bot's current surface: character build lookups, guild war reminders, and the self-hosted deployment path. Broad rewrites or unrelated product expansions need discussion first.

## Reviews

I’m also a student with limited free time, so reviews may take a while. Thanks for bearing with me.
