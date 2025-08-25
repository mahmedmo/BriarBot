module.exports = {
	apps: [{
		name: 'briar-bot',
		script: './src/briar-bot.js',
		instances: process.env.NODE_ENV === 'production' ? 1 : 1, // Single instance for Discord bot
		autorestart: true,
		watch: false,
		max_memory_restart: '1024M', // Increased for image processing
		restart_delay: 3000,
		kill_timeout: 5000,
		env: {
			NODE_ENV: 'development'
		},
		env_production: {
			NODE_ENV: 'production'
		},
		error_file: './logs/err.log',
		out_file: './logs/out.log',
		log_file: './logs/combined.log',
		time: true,
		max_restarts: 10,
		min_uptime: '10s',
		// Docker-specific settings
		exec_mode: 'fork',
		merge_logs: true,
		log_date_format: 'YYYY-MM-DD HH:mm Z',
		// Health monitoring
		health_check_grace_period: 5000,
		// Environment variables for production
		env_production: {
			NODE_ENV: 'production',
			DEBUG: 'bot:*'
		}
	}]
};