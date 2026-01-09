const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3001'];

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

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Familyhub OS Server Running', version: '1.0.0' });
});

// Serve static files from the React app build
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// SPA fallback - serve index.html for any non-API route
// Express 5 requires named parameters instead of bare '*'
app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, HOST, () => {
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
});
