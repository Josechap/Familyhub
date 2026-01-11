const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const os = require('os');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Production logging helper
const log = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, ...meta };
    if (IS_PRODUCTION) {
        console.log(JSON.stringify(logEntry));
    } else {
        console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, Object.keys(meta).length ? meta : '');
    }
};

// Environment validation for production
const validateEnvironment = () => {
    const warnings = [];
    const errors = [];

    // Check optional but recommended vars
    if (!process.env.GOOGLE_CLIENT_ID) {
        warnings.push('GOOGLE_CLIENT_ID not set - Google Calendar integration disabled');
    }
    if (!process.env.ENCRYPTION_KEY && IS_PRODUCTION) {
        warnings.push('ENCRYPTION_KEY not set - using default (not recommended for production)');
    }

    // Log warnings
    warnings.forEach(w => log('warn', w));

    // Exit on critical errors in production
    if (errors.length > 0 && IS_PRODUCTION) {
        errors.forEach(e => log('error', e));
        process.exit(1);
    }

    return { warnings, errors };
};

validateEnvironment();

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3001', 'https://accounts.google.com'];

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

// Routes
const recipesRouter = require('./routes/recipes');
const tasksRouter = require('./routes/tasks');
const calendarRouter = require('./routes/calendar');
const settingsRouter = require('./routes/settings');
const googleRouter = require('./routes/google');
const paprikaRouter = require('./routes/paprika');
const mealsRouter = require('./routes/meals');

app.use('/api/recipes', recipesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/google', googleRouter);
app.use('/api/paprika', paprikaRouter);
app.use('/api/meals', mealsRouter);
app.use('/api/sonos', require('./routes/sonos'));
app.use('/api/google/photos', require('./routes/google-photos'));
app.use('/api/photos', require('./routes/local-photos'));

// Health check with system info
app.get('/api/health', async (req, res) => {
    const dbPath = path.join(__dirname, 'db', 'familyhub.db');

    // Database check
    let dbStatus = 'ok';
    let dbSize = 0;
    try {
        const stats = fs.statSync(dbPath);
        dbSize = Math.round(stats.size / 1024); // KB
    } catch (err) {
        dbStatus = 'error';
    }

    // Memory info
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = Math.round((usedMem / totalMem) * 100);

    // Disk info (for the install directory)
    let diskFree = null;
    let diskTotal = null;
    try {
        // Works on Linux/macOS
        const { execSync } = require('child_process');
        const dfOutput = execSync(`df -k "${__dirname}" | tail -1`).toString();
        const parts = dfOutput.split(/\s+/);
        if (parts.length >= 4) {
            diskTotal = Math.round(parseInt(parts[1]) / 1024); // MB
            diskFree = Math.round(parseInt(parts[3]) / 1024); // MB
        }
    } catch (err) {
        // Ignore disk check errors
    }

    // Uptime
    const uptime = Math.round(process.uptime());
    const uptimeStr = uptime > 3600
        ? `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`
        : `${Math.floor(uptime / 60)}m ${uptime % 60}s`;

    res.json({
        status: 'ok',
        version: '1.0.0',
        environment: IS_PRODUCTION ? 'production' : 'development',
        uptime: uptimeStr,
        database: {
            status: dbStatus,
            sizeKB: dbSize,
        },
        memory: {
            usedMB: Math.round(usedMem / 1024 / 1024),
            totalMB: Math.round(totalMem / 1024 / 1024),
            percent: memPercent,
        },
        disk: diskFree !== null ? {
            freeMB: diskFree,
            totalMB: diskTotal,
        } : null,
    });
});

// Serve static files from the React app build
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// SPA fallback - serve index.html for any non-API route
// Express 5 requires named parameters instead of bare '*'
app.get('/{*splat}', (req, res) => {
    // If path starts with /api, return 404 JSON instead of HTML
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    log('error', 'Unhandled error', { error: err.message, stack: err.stack, path: req.path });
    res.status(500).json({ error: 'Something went wrong!' });
});

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
