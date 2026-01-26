/**
 * Server entry point
 * Starts the Express server
 */
const { app, log } = require('./app');
const os = require('os');

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Graceful shutdown
const shutdown = (signal) => {
    log('info', `Received ${signal}, shutting down gracefully...`);
    process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

app.listen(PORT, HOST, () => {
    log('info', 'Server started', { host: HOST, port: PORT, env: IS_PRODUCTION ? 'production' : 'development' });

    if (!IS_PRODUCTION) {
        console.log('');
        console.log(`🏠 Familyhub OS Server running on http://${HOST}:${PORT}`);
        console.log(`   Access locally: http://localhost:${PORT}`);
        if (HOST === '0.0.0.0') {
            console.log(`   Access from network: http://<your-ip>:${PORT}`);
        }
        console.log('');
        console.log('API routes:');
        console.log('  /api/recipes     /api/tasks      /api/calendar');
        console.log('  /api/settings    /api/google     /api/paprika');
        console.log('  /api/meals       /api/sonos      /api/health');
    }
});
