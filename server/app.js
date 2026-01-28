/**
 * Express application setup
 * Exports the app for both server startup and testing
 */
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_TEST = process.env.NODE_ENV === 'test';

// Production logging helper
const log = (level, message, meta = {}) => {
    if (IS_TEST) return; // Suppress logs during tests
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

    if (!process.env.GOOGLE_CLIENT_ID) {
        warnings.push('GOOGLE_CLIENT_ID not set - Google Calendar integration disabled');
    }
    if (!process.env.ENCRYPTION_KEY && IS_PRODUCTION) {
        warnings.push('ENCRYPTION_KEY not set - using default (not recommended for production)');
    }

    if (!IS_TEST) {
        warnings.forEach(w => log('warn', w));
    }

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
    : null;

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins) {
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'));
        }
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
        const isLocalNetwork = /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(origin);
        const isLocalDomain = /\.local(:\d+)?$/.test(new URL(origin).host);
        const isGoogleAuth = origin.includes('accounts.google.com');
        if (isLocalhost || isLocalNetwork || isLocalDomain || isGoogleAuth) {
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
const weatherRouter = require('./routes/weather');

app.use('/api/recipes', recipesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/google', googleRouter);
app.use('/api/paprika', paprikaRouter);
app.use('/api/meals', mealsRouter);
app.use('/api/weather', weatherRouter);

// Skip Sonos in test mode - it does network discovery on import
if (!IS_TEST) {
    app.use('/api/sonos', require('./routes/sonos'));
}

app.use('/api/google/photos', require('./routes/google-photos'));
app.use('/api/photos', require('./routes/local-photos'));

// Health check
app.get('/api/health', async (req, res) => {
    const dbPath = path.join(__dirname, 'db', 'familyhub.db');
    let dbStatus = 'ok';
    let dbSize = 0;
    try {
        const stats = fs.statSync(dbPath);
        dbSize = Math.round(stats.size / 1024);
    } catch (err) {
        dbStatus = 'error';
    }

    res.json({
        status: 'ok',
        version: '1.0.0',
        environment: IS_PRODUCTION ? 'production' : IS_TEST ? 'test' : 'development',
    });
});

// Serve static files from the React app build (skip in test mode)
if (!IS_TEST) {
    const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
    app.use(express.static(clientDistPath));

    // SPA fallback
    app.get('/{*splat}', (req, res) => {
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ error: 'API endpoint not found' });
        }
        res.sendFile(path.join(clientDistPath, 'index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    if (!IS_TEST) {
        log('error', 'Unhandled error', { error: err.message, stack: err.stack, path: req.path });
    }
    res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = { app, log };
