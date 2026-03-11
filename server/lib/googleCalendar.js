const { google } = require('googleapis');
const db = require('../db/database');
const { getAuthenticatedClient } = require('./googleAuth');
const { attachPrepMatches } = require('./prepTemplates');

const parseMemberFromTitle = (title) => {
    const match = title.match(/^\[([^\]]+)\]\s*/);
    if (match) {
        return {
            member: match[1],
            cleanTitle: title.replace(match[0], ''),
        };
    }

    return {
        member: null,
        cleanTitle: title,
    };
};

const fetchGoogleCalendarEvents = async ({ includePrepMatches = true, now = new Date() } = {}) => {
    const auth = await getAuthenticatedClient();
    if (!auth) {
        throw new Error('Not connected to Google');
    }

    const calendar = google.calendar({ version: 'v3', auth });
    const settings = {};
    db.prepare('SELECT key, value FROM settings').all().forEach((row) => {
        settings[row.key] = row.value;
    });

    const familyMembers = db.prepare('SELECT id, name, color FROM family_members').all();
    const memberByName = new Map(familyMembers.map((member) => [member.name, member]));
    const fourWeeksLater = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

    const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: fourWeeksLater.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 200,
    });

    const events = response.data.items.map((event) => {
        const start = event.start.dateTime || event.start.date;
        const startDate = new Date(start);
        const rawTitle = event.summary || 'Untitled';
        const eventId = event.id;

        let assignedMember = settings[`calendarEventMapping_${eventId}`];
        let cleanTitle = rawTitle;

        if (!assignedMember) {
            const parsed = parseMemberFromTitle(rawTitle);
            assignedMember = parsed.member || 'Family';
            cleanTitle = parsed.cleanTitle;
        }

        const familyMember = memberByName.get(assignedMember);

        return {
            id: `google-${eventId}`,
            googleEventId: eventId,
            title: cleanTitle,
            date: startDate.toISOString().split('T')[0],
            startHour: event.start.dateTime ? startDate.getHours() + startDate.getMinutes() / 60 : 9,
            duration: event.end?.dateTime && event.start?.dateTime
                ? (new Date(event.end.dateTime) - new Date(event.start.dateTime)) / (1000 * 60 * 60)
                : 1,
            color: familyMember?.color || 'google-blue',
            source: 'google',
            member: assignedMember,
            memberId: familyMember ? String(familyMember.id) : null,
            eventType: event.eventType || 'general',
        };
    });

    return includePrepMatches ? attachPrepMatches(db, events) : events;
};

module.exports = {
    fetchGoogleCalendarEvents,
};
