const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const recipesRouter = require('./routes/recipes');
const tasksRouter = require('./routes/tasks');
const calendarRouter = require('./routes/calendar');
const settingsRouter = require('./routes/settings');
const googleRouter = require('./routes/google');

app.use('/api/recipes', recipesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/google', googleRouter);

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'Familyhub OS Server Running', version: '1.0.0' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Available routes:');
    console.log('  GET    /api/recipes');
    console.log('  GET    /api/tasks');
    console.log('  GET    /api/tasks/family');
    console.log('  GET    /api/calendar/events');
    console.log('  GET    /api/calendar/dinner');
});
