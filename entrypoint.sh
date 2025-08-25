#!/bin/sh
# BriarBot Docker Entrypoint Script

# Ensure cache directory exists and has correct permissions
if [ ! -d "/app/cache" ]; then
    mkdir -p /app/cache
fi

if [ ! -d "/app/cache/heroes" ]; then
    mkdir -p /app/cache/heroes
fi

# Fix ownership of cache directory to briarbot user
if [ "$(stat -c %u /app/cache)" != "1001" ] || [ "$(stat -c %g /app/cache)" != "1001" ]; then
    echo "Fixing cache directory permissions..."
    chown -R briarbot:briarbot /app/cache
fi

# If logs directory exists, fix permissions too
if [ -d "/app/logs" ]; then
    chown -R briarbot:briarbot /app/logs
fi

# Switch to briarbot user and run the application
exec su-exec briarbot "$@"