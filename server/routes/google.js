const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const db = require('../db/database');

// OAuth2 client configuration
const getOAuth2Client = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/google/callback';

    if (!clientId || !clientSecret) {
        return null;
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

// Scopes for Google APIs
const SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/tasks.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
];

// GET /auth - Redirect to Google OAuth
router.get('/auth', (req, res) => {
    const oauth2Client = getOAuth2Client();

    if (!oauth2Client) {
        return res.status(500).json({ error: 'Google OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env' });
    }

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
    });

    res.redirect(authUrl);
});

// GET /callback - Handle OAuth callback
router.get('/callback', async (req, res) => {
    const { code } = req.query;
    const oauth2Client = getOAuth2Client();

    if (!oauth2Client) {
        return res.status(500).json({ error: 'Google OAuth not configured' });
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get user email
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data } = await oauth2.userinfo.get();

        // Store tokens in database
        db.prepare(`
            INSERT OR REPLACE INTO google_tokens (id, access_token, refresh_token, expiry_date, email)
            VALUES (1, ?, ?, ?, ?)
        `).run(tokens.access_token, tokens.refresh_token, tokens.expiry_date, data.email);

        // Redirect back to settings page
        res.redirect('http://localhost:5176/settings?google=connected');
    } catch (error) {
        console.error('OAuth error:', error);
        res.redirect('http://localhost:5176/settings?google=error');
    }
});

// GET /status - Check connection status
router.get('/status', (req, res) => {
    try {
        const tokens = db.prepare('SELECT email, expiry_date FROM google_tokens WHERE id = 1').get();

        if (tokens) {
            res.json({
                connected: true,
                email: tokens.email,
                expiresAt: tokens.expiry_date,
            });
        } else {
            res.json({ connected: false });
        }
    } catch (error) {
        res.json({ connected: false });
    }
});

// Helper to get authenticated client
const getAuthenticatedClient = async () => {
    const oauth2Client = getOAuth2Client();
    if (!oauth2Client) return null;

    const tokens = db.prepare('SELECT access_token, refresh_token, expiry_date FROM google_tokens WHERE id = 1').get();
    if (!tokens) return null;

    oauth2Client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
    });

    // Check if token needs refresh
    if (tokens.expiry_date && Date.now() > tokens.expiry_date) {
        try {
            const { credentials } = await oauth2Client.refreshAccessToken();
            db.prepare(`
                UPDATE google_tokens SET access_token = ?, expiry_date = ? WHERE id = 1
            `).run(credentials.access_token, credentials.expiry_date);
            oauth2Client.setCredentials(credentials);
        } catch (error) {
            console.error('Token refresh failed:', error);
            return null;
        }
    }

    return oauth2Client;
};

// GET /calendar/events - Fetch Google Calendar events
router.get('/calendar/events', async (req, res) => {
    try {
        const auth = await getAuthenticatedClient();
        if (!auth) {
            return res.status(401).json({ error: 'Not connected to Google' });
        }

        const calendar = google.calendar({ version: 'v3', auth });

        // Get events for the next 14 days
        const now = new Date();
        const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: now.toISOString(),
            timeMax: twoWeeksLater.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 100,
        });

        const events = response.data.items.map(event => {
            const start = event.start.dateTime || event.start.date;
            const startDate = new Date(start);

            return {
                id: `google-${event.id}`,
                title: event.summary || 'Untitled',
                date: startDate.toISOString().split('T')[0],
                startHour: event.start.dateTime ? startDate.getHours() + startDate.getMinutes() / 60 : 9,
                duration: event.end?.dateTime && event.start?.dateTime
                    ? (new Date(event.end.dateTime) - new Date(event.start.dateTime)) / (1000 * 60 * 60)
                    : 1,
                color: 'google-blue',
                source: 'google',
                member: 'Google',
            };
        });

        res.json(events);
    } catch (error) {
        console.error('Calendar fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /tasks - Fetch Google Tasks
router.get('/tasks', async (req, res) => {
    try {
        const auth = await getAuthenticatedClient();
        if (!auth) {
            return res.status(401).json({ error: 'Not connected to Google' });
        }

        const tasks = google.tasks({ version: 'v1', auth });

        // Get default task list
        const taskLists = await tasks.tasklists.list();
        if (!taskLists.data.items || taskLists.data.items.length === 0) {
            return res.json([]);
        }

        const defaultList = taskLists.data.items[0];
        const response = await tasks.tasks.list({
            tasklist: defaultList.id,
            showCompleted: false,
            maxResults: 50,
        });

        const taskItems = (response.data.items || []).map(task => ({
            id: `google-${task.id}`,
            title: task.title,
            dueDate: task.due ? task.due.split('T')[0] : null,
            source: 'google',
        }));

        res.json(taskItems);
    } catch (error) {
        console.error('Tasks fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /disconnect - Remove stored tokens
router.post('/disconnect', (req, res) => {
    try {
        db.prepare('DELETE FROM google_tokens WHERE id = 1').run();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
