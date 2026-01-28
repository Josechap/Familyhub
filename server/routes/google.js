const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const db = require('../db/database');
const { SCOPES, getOAuth2Client, getAuthenticatedClient } = require('../lib/googleAuth');

// GET /auth - Redirect to Google OAuth
router.get('/auth', (req, res) => {
    const oauth2Client = getOAuth2Client();

    if (!oauth2Client) {
        return res.status(500).json({ error: 'Google OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env' });
    }

    // Force re-consent to get new scopes (like Photos)
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
        include_granted_scopes: true,
    });

    console.log('Redirecting to Google OAuth with scopes:', SCOPES);
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

        console.log('OAuth callback received, storing tokens for:', data.email);
        console.log('Token scopes:', tokens.scope);
        console.log('New refresh_token received:', !!tokens.refresh_token);

        // Get existing tokens to preserve refresh_token if not provided
        const existing = db.prepare('SELECT refresh_token FROM google_tokens WHERE id = 1').get();
        const refreshToken = tokens.refresh_token || existing?.refresh_token;

        if (!refreshToken) {
            console.error('No refresh token available - user needs to re-authorize with consent');
        }

        // Store tokens in database (preserve old refresh_token if new one not provided)
        db.prepare(`
            INSERT OR REPLACE INTO google_tokens (id, access_token, refresh_token, expiry_date, email)
            VALUES (1, ?, ?, ?, ?)
        `).run(tokens.access_token, refreshToken, tokens.expiry_date, data.email);

        console.log('Tokens stored successfully with refresh_token:', !!refreshToken);

        // Redirect back to settings page (use env var or default)
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        res.redirect(`${clientUrl}/settings?google=connected`);
    } catch (error) {
        console.error('OAuth error:', error);
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        res.redirect(`${clientUrl}/settings?google=error`);
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

// Helper to parse [Name] prefix from event title
const parseMemberFromTitle = (title) => {
    const match = title.match(/^\[([^\]]+)\]\s*/);
    if (match) {
        return {
            member: match[1],
            cleanTitle: title.replace(match[0], ''),
        };
    }
    return { member: null, cleanTitle: title };
};

// GET /calendar/events - Fetch Google Calendar events
router.get('/calendar/events', async (req, res) => {
    try {
        const auth = await getAuthenticatedClient();
        if (!auth) {
            return res.status(401).json({ error: 'Not connected to Google' });
        }

        const calendar = google.calendar({ version: 'v3', auth });

        // Get settings for manual mappings and family members for colors
        const settings = {};
        db.prepare('SELECT key, value FROM settings').all().forEach(row => {
            settings[row.key] = row.value;
        });
        const familyMembers = db.prepare('SELECT * FROM family_members').all();
        const memberColorMap = {};
        familyMembers.forEach(m => {
            memberColorMap[m.name] = m.color;
        });

        // Get events for the next 28 days (4 weeks)
        const now = new Date();
        const fourWeeksLater = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: now.toISOString(),
            timeMax: fourWeeksLater.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 200,
        });

        const events = response.data.items.map(event => {
            const start = event.start.dateTime || event.start.date;
            const startDate = new Date(start);
            const rawTitle = event.summary || 'Untitled';
            const eventId = event.id;

            // Check for manual mapping first (stored as calendarEventMapping_{eventId})
            let assignedMember = settings[`calendarEventMapping_${eventId}`];
            let cleanTitle = rawTitle;

            // If no manual mapping, try [Name] prefix parsing
            if (!assignedMember) {
                const parsed = parseMemberFromTitle(rawTitle);
                assignedMember = parsed.member || 'Family';
                cleanTitle = parsed.cleanTitle;
            }

            // Get color from family member or default
            const color = memberColorMap[assignedMember] || 'google-blue';

            return {
                id: `google-${eventId}`,
                googleEventId: eventId,
                title: cleanTitle,
                date: startDate.toISOString().split('T')[0],
                startHour: event.start.dateTime ? startDate.getHours() + startDate.getMinutes() / 60 : 9,
                duration: event.end?.dateTime && event.start?.dateTime
                    ? (new Date(event.end.dateTime) - new Date(event.start.dateTime)) / (1000 * 60 * 60)
                    : 1,
                color: color,
                source: 'google',
                member: assignedMember,
            };
        });

        res.json(events);
    } catch (error) {
        console.error('Calendar fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /tasks/lists - Get all task lists (for mapping to family members)
router.get('/tasks/lists', async (req, res) => {
    try {
        const auth = await getAuthenticatedClient();
        if (!auth) {
            return res.status(401).json({ error: 'Not connected to Google' });
        }

        const tasks = google.tasks({ version: 'v1', auth });
        const taskLists = await tasks.tasklists.list();

        if (!taskLists.data.items) {
            return res.json([]);
        }

        res.json(taskLists.data.items.map(list => ({
            id: list.id,
            title: list.title,
        })));
    } catch (error) {
        console.error('Task lists fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /tasks - Fetch Google Tasks from all lists
router.get('/tasks', async (req, res) => {
    try {
        const auth = await getAuthenticatedClient();
        if (!auth) {
            return res.status(401).json({ error: 'Not connected to Google' });
        }

        const tasks = google.tasks({ version: 'v1', auth });

        // Get all task lists
        const taskLists = await tasks.tasklists.list();
        if (!taskLists.data.items || taskLists.data.items.length === 0) {
            return res.json([]);
        }

        // Fetch tasks from each list
        const allTasks = [];
        for (const list of taskLists.data.items) {
            const response = await tasks.tasks.list({
                tasklist: list.id,
                showCompleted: false,
                maxResults: 50,
            });

            const taskItems = (response.data.items || []).map(task => ({
                id: `google-${task.id}`,
                googleTaskId: task.id,
                title: task.title,
                notes: task.notes || '',
                dueDate: task.due ? task.due.split('T')[0] : null,
                status: task.status,
                completed: task.completed || null,
                updated: task.updated,
                listId: list.id,
                listName: list.title,
                source: 'google',
            }));
            allTasks.push(...taskItems);
        }

        res.json(allTasks);
    } catch (error) {
        console.error('Tasks fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// PATCH /tasks/:listId/:taskId/complete - Mark task as complete
router.patch('/tasks/:listId/:taskId/complete', async (req, res) => {
    try {
        const auth = await getAuthenticatedClient();
        if (!auth) {
            return res.status(401).json({ error: 'Not connected to Google' });
        }

        const { listId, taskId } = req.params;
        const tasks = google.tasks({ version: 'v1', auth });

        const result = await tasks.tasks.patch({
            tasklist: listId,
            task: taskId,
            requestBody: {
                status: 'completed',
                completed: new Date().toISOString(),
            },
        });

        // Award 1 point to the assigned family member
        // First check for manual mapping
        const mappingKey = `taskListMapping_${listId}`;
        const mapping = db.prepare('SELECT value FROM settings WHERE key = ?').get(mappingKey);

        let memberId = mapping ? mapping.value : null;

        // If no mapping, try to find member by list name
        if (!memberId) {
            const listName = result.data.title; // Note: This might not be the list title, but we don't have it here easily. 
            // Actually, we need the list title to match by name if mapping is missing.
            // For now, let's rely on the mapping which is the primary way.
            // If we really need to support name matching here, we'd need to fetch the list details or pass it.
            // Given the current architecture, let's stick to the mapping or try to find a member with the same name as the list if we could fetch it.
            // But fetching list details adds latency.
            // Let's try to get the list title from the DB if we cached it? No cache.
            // Let's just stick to the mapping for now as it's the most robust way.
        }

        if (memberId) {
            db.prepare('UPDATE family_members SET points = points + 1 WHERE id = ?').run(memberId);

            // Log completion to history
            const member = db.prepare('SELECT name FROM family_members WHERE id = ?').get(memberId);
            const taskTitle = result.data.title || 'Google Task';
            db.prepare(`
                INSERT INTO task_completions (member_id, member_name, task_title, task_source, points_earned)
                VALUES (?, ?, ?, 'google', 1)
            `).run(memberId, member?.name || 'Unknown', taskTitle);
        }

        res.json({ success: true, task: result.data });
    } catch (error) {
        console.error('Task complete error:', error);
        res.status(500).json({ error: error.message });
    }
});

// PATCH /tasks/:listId/:taskId/reopen - Reopen a completed task
router.patch('/tasks/:listId/:taskId/reopen', async (req, res) => {
    try {
        const auth = await getAuthenticatedClient();
        if (!auth) {
            return res.status(401).json({ error: 'Not connected to Google' });
        }

        const { listId, taskId } = req.params;
        const tasks = google.tasks({ version: 'v1', auth });

        const result = await tasks.tasks.patch({
            tasklist: listId,
            task: taskId,
            requestBody: {
                status: 'needsAction',
                completed: null,
            },
        });

        // Deduct 1 point from the assigned family member
        const mappingKey = `taskListMapping_${listId}`;
        const mapping = db.prepare('SELECT value FROM settings WHERE key = ?').get(mappingKey);

        let memberId = mapping ? mapping.value : null;

        if (memberId) {
            db.prepare('UPDATE family_members SET points = points - 1 WHERE id = ?').run(memberId);
        }

        res.json({ success: true, task: result.data });
    } catch (error) {
        console.error('Task reopen error:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /tasks/:listId/:taskId - Update task (title, due date, notes)
router.put('/tasks/:listId/:taskId', async (req, res) => {
    try {
        const auth = await getAuthenticatedClient();
        if (!auth) {
            return res.status(401).json({ error: 'Not connected to Google' });
        }

        const { listId, taskId } = req.params;
        const { title, dueDate, notes } = req.body;
        const tasks = google.tasks({ version: 'v1', auth });

        // Build update body
        const updateBody = {};
        if (title !== undefined) updateBody.title = title;
        if (notes !== undefined) updateBody.notes = notes;
        if (dueDate !== undefined) {
            updateBody.due = dueDate ? `${dueDate}T00:00:00.000Z` : null;
        }

        const result = await tasks.tasks.patch({
            tasklist: listId,
            task: taskId,
            requestBody: updateBody,
        });

        res.json({ success: true, task: result.data });
    } catch (error) {
        console.error('Task update error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /tasks/:listId - Create a new task
router.post('/tasks/:listId', async (req, res) => {
    try {
        const auth = await getAuthenticatedClient();
        if (!auth) {
            return res.status(401).json({ error: 'Not connected to Google' });
        }

        const { listId } = req.params;
        const { title, dueDate, notes } = req.body;
        const tasks = google.tasks({ version: 'v1', auth });

        const taskBody = {
            title: title || 'New Task',
            status: 'needsAction',
        };
        if (notes) taskBody.notes = notes;
        if (dueDate) taskBody.due = `${dueDate}T00:00:00.000Z`;

        const result = await tasks.tasks.insert({
            tasklist: listId,
            requestBody: taskBody,
        });

        res.json({ success: true, task: result.data });
    } catch (error) {
        console.error('Task create error:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /tasks/:listId/:taskId - Delete a task
router.delete('/tasks/:listId/:taskId', async (req, res) => {
    try {
        const auth = await getAuthenticatedClient();
        if (!auth) {
            return res.status(401).json({ error: 'Not connected to Google' });
        }

        const { listId, taskId } = req.params;
        const tasks = google.tasks({ version: 'v1', auth });

        await tasks.tasks.delete({
            tasklist: listId,
            task: taskId,
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Task delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /tasks/:listId/:taskId/transfer - Transfer task to another list
router.post('/tasks/:listId/:taskId/transfer', async (req, res) => {
    try {
        const auth = await getAuthenticatedClient();
        if (!auth) {
            return res.status(401).json({ error: 'Not connected to Google' });
        }

        const { listId, taskId } = req.params;
        const { targetListId } = req.body;
        const tasks = google.tasks({ version: 'v1', auth });

        // 1. Get the original task
        const originalTask = await tasks.tasks.get({
            tasklist: listId,
            task: taskId,
        });

        // 2. If task was completed, deduct point from original list's owner
        if (originalTask.data.status === 'completed') {
            const mappingKey = `taskListMapping_${listId}`;
            const mapping = db.prepare('SELECT value FROM settings WHERE key = ?').get(mappingKey);

            if (mapping?.value) {
                db.prepare('UPDATE family_members SET points = points - 1 WHERE id = ?').run(mapping.value);
            }
        }

        // 3. Create new task in target list (always reset to needsAction)
        const newTaskBody = {
            title: originalTask.data.title,
            notes: originalTask.data.notes,
            due: originalTask.data.due,
            status: 'needsAction', // Reset status when transferring
        };

        const newTask = await tasks.tasks.insert({
            tasklist: targetListId,
            requestBody: newTaskBody,
        });

        // 4. Delete original task
        await tasks.tasks.delete({
            tasklist: listId,
            task: taskId,
        });

        res.json({ success: true, task: newTask.data });
    } catch (error) {
        console.error('Task transfer error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /disconnect - Remove stored tokens and revoke with Google
router.post('/disconnect', async (req, res) => {
    try {
        // Get current token to revoke it
        const tokens = db.prepare('SELECT access_token, refresh_token FROM google_tokens WHERE id = 1').get();

        if (tokens?.access_token) {
            // Revoke the token with Google to ensure fresh scopes on reconnect
            try {
                await fetch(`https://oauth2.googleapis.com/revoke?token=${tokens.access_token}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                });
                console.log('Token revoked with Google');
            } catch (revokeError) {
                console.log('Token revoke failed (may already be invalid):', revokeError.message);
            }
        }

        // Delete from database
        db.prepare('DELETE FROM google_tokens WHERE id = 1').run();
        console.log('Google tokens deleted from database');

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
