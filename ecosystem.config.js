module.exports = {
	apps: [{
		name: 'briar-bot',
		script: './src/briar-bot.js',
		instances: 1,
		autorestart: true,
		watch: false,
		max_memory_restart: '1G',
		env: {
			NODE_ENV: 'development'
		},
		env_production: {
			NODE_ENV: 'production'
		},
		error_file: './logs/err.log',
		out_file: './logs/out.log',
		log_file: './logs/combined.log',
		time: true
	}]
};