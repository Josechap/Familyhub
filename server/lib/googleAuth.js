const { google } = require('googleapis');
const db = require('../db/database');

// Scopes for Google APIs
const SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/tasks',  // Full access for CRUD operations
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/photoslibrary.readonly',  // Google Photos for screensaver
];

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

// Helper to get authenticated client with valid tokens
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
        console.log('Token expired, refreshing...');
        try {
            const { credentials } = await oauth2Client.refreshAccessToken();
            console.log('Token refreshed. New expiry:', new Date(credentials.expiry_date).toISOString());
            console.log('Refreshed token scopes:', credentials.scope || 'not returned in refresh');
            db.prepare(`
                UPDATE google_tokens SET access_token = ?, expiry_date = ? WHERE id = 1
            `).run(credentials.access_token, credentials.expiry_date);
            oauth2Client.setCredentials(credentials);
        } catch (error) {
            console.error('Token refresh failed:', error);
            return null;
        }
    } else {
        console.log('Using existing token, expires:', new Date(tokens.expiry_date).toISOString());
    }

    return oauth2Client;
};

module.exports = {
    SCOPES,
    getOAuth2Client,
    getAuthenticatedClient,
};
