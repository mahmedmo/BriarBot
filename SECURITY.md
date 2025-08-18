# BriarBot Security Guidelines

## Environment Setup

1. **Discord Bot Token**: 
   - Copy `.env.example` to `.env`
   - Replace `your_discord_bot_token_here` with your actual Discord bot token
   - **NEVER** commit the `.env` file to version control

2. **Production Deployment**:
   - Set `NODE_ENV=production` for production environments
   - Set `DOCKER=true` if running in Docker containers (enables sandbox mode for Puppeteer)
   - Use environment variables for sensitive configuration

## Security Features Implemented

✅ **Input Validation**: All user input is validated and sanitized
✅ **Rate Limiting**: 5 requests per minute per user
✅ **Token Validation**: Bot validates Discord token on startup
✅ **Error Handling**: Generic error messages prevent information disclosure
✅ **URL Validation**: External URLs are validated before use
✅ **Puppeteer Security**: Unsafe flags removed, sandbox only in containers

## Deployment Checklist

- [ ] Set proper environment variables
- [ ] Rotate Discord bot token if compromised
- [ ] Review bot permissions in Discord
- [ ] Monitor logs for unusual activity
- [ ] Ensure `.env` file is not included in deployments
- [ ] Use HTTPS for all external API calls
- [ ] Run security audit on dependencies: `npm audit`

## Bot Permissions

The bot requires minimal Discord permissions:
- Read Messages
- Send Messages
- Attach Files

## Security Monitoring

Monitor logs for:
- Rate limit violations
- Input validation errors
- Puppeteer launch failures
- External API failures

## Reporting Security Issues

Report security vulnerabilities privately to the repository maintainer.