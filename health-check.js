const http = require('http');

const options = {
	hostname: 'localhost',
	port: 3000,
	path: '/',
	method: 'GET',
	timeout: 5000
};

const req = http.request(options, (res) => {
	if (res.statusCode === 200) {
		console.log('Health check passed');
		process.exit(0);
	} else {
		console.log('Health check failed');
		process.exit(1);
	}
});

req.on('timeout', () => {
	console.log('Health check timeout');
	process.exit(1);
});

req.on('error', () => {
	console.log('Health check error');
	process.exit(1);
});

req.end();