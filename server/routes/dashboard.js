const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const db = require('../db/database');
const {
    formatDateKey,
    getClothingRecommendation,
    refreshRoutineTask,
} = require('../lib/familyOps');
const { attachPrepMatches, buildPrepAgendaForDate } = require('../lib/prepTemplates');
const { getShoppingItems } = require('../lib/shoppingItems');
const { fetchGoogleCalendarEvents } = require('../lib/googleCalendar');
const { getAuthenticatedClient } = require('../lib/googleAuth');

const DASHBOARD_EVENT_LIMIT = 8;
const GOOGLE_TASK_LIMIT = 50;

const formatEventTime = (startHour, duration) => {
    if (startHour === null || startHour === undefined) {
        return 'All day';
    }

    const startMinutes = Math.round(Number(startHour) * 60);
    const endMinutes = startMinutes + Math.round(Number(duration || 1) * 60);

    const formatMinutes = (minutes) => {
        const hours24 = Math.floor(minutes / 60) % 24;
        const mins = minutes % 60;
        const suffix = hours24 >= 12 ? 'PM' : 'AM';
        const hours12 = hours24 % 12 || 12;
        return `${hours12}:${String(mins).padStart(2, '0')} ${suffix}`;
    };

    return `${formatMinutes(startMinutes)}${duration ? ` - ${formatMinutes(endMinutes)}` : ''}`;
};

const mapEvent = (event, todayKey) => ({
    id: String(event.id),
    title: event.title,
    date: event.date,
    startHour: event.start_hour,
    duration: event.duration,
    time: formatEventTime(event.start_hour, event.duration),
    color: event.color,
    eventType: event.event_type || 'general',
    member: event.member_name || null,
    memberId: event.member_id ? String(event.member_id) : null,
    isToday: event.date === todayKey,
    source: 'local',
});

const normalizeEvent = (event, todayKey) => ({
    ...event,
    id: String(event.id),
    date: event.date,
    startHour: event.startHour ?? event.start_hour ?? null,
    duration: event.duration ?? 1,
    time: event.time || formatEventTime(event.startHour ?? event.start_hour, event.duration),
    isToday: event.date === todayKey,
    source: event.source || 'local',
});

const sortEvents = (events) => [...events].sort((a, b) => {
    if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
    }

    return (a.startHour ?? 99) - (b.startHour ?? 99);
});

const getLocalUpcomingEvents = (todayKey) => {
    const rows = db.prepare(`
        SELECT
            e.id,
            e.title,
            e.date,
            e.start_hour,
            e.duration,
            e.color,
            e.event_type,
            fm.id AS member_id,
            fm.name AS member_name
        FROM calendar_events e
        LEFT JOIN family_members fm ON e.member_id = fm.id
        WHERE e.date >= ?
        ORDER BY e.date, e.start_hour
        LIMIT ?
    `).all(todayKey, DASHBOARD_EVENT_LIMIT);

    return rows.map((event) => mapEvent(event, todayKey));
};

const getCloudUpcomingEvents = async (todayKey, now) => {
    try {
        const events = await fetchGoogleCalendarEvents({ includePrepMatches: false, now });
        return {
            events: events
                .filter((event) => event.date >= todayKey)
                .map((event) => normalizeEvent(event, todayKey)),
            error: null,
        };
    } catch (error) {
        if (error.message === 'Not connected to Google') {
            return { events: [], error: null };
        }

        return { events: [], error: error.message };
    }
};

const getConsolidatedUpcomingEvents = async (todayKey, now) => {
    const localEvents = getLocalUpcomingEvents(todayKey).map((event) => normalizeEvent(event, todayKey));
    const cloud = await getCloudUpcomingEvents(todayKey, now);
    const events = attachPrepMatches(db, sortEvents([...localEvents, ...cloud.events]).slice(0, DASHBOARD_EVENT_LIMIT));

    return { events, cloudError: cloud.error };
};

const getTodayMeals = (todayKey) => {
    const rows = db.prepare(`
        SELECT id, meal_type, recipe_id, recipe_title, recipe_emoji, recipe_photo
        FROM meal_slots
        WHERE date = ?
    `).all(todayKey);

    const meals = {
        breakfast: null,
        lunch: null,
        dinner: null,
        snack: null,
    };

    rows.forEach((row) => {
        meals[row.meal_type] = {
            id: String(row.id),
            recipeId: row.recipe_id ? String(row.recipe_id) : null,
            recipeTitle: row.recipe_title,
            recipeEmoji: row.recipe_emoji || '🍽️',
            recipePhoto: row.recipe_photo || null,
        };
    });

    return meals;
};

const mapTask = (task) => ({
    id: String(task.id),
    title: task.title,
    points: task.points,
    completed: Boolean(task.completed),
    recurring: task.recurring,
    scheduleType: task.scheduleType,
    daysOfWeek: task.daysOfWeek,
    dueTime: task.dueTime,
    cycleKey: task.cycleKey,
    active: Boolean(task.active),
    assignedTo: task.assigned_name || null,
    assignedMemberId: task.member_id ? String(task.member_id) : null,
    color: task.color,
    dueToday: task.dueToday,
    dueThisWeek: task.dueThisWeek,
    isRoutine: task.isRoutine,
});

const loadSettingsMap = () => {
    const settings = {};
    db.prepare('SELECT key, value FROM settings').all().forEach((row) => {
        settings[row.key] = row.value;
    });
    return settings;
};

const getFamilyMembersById = () => new Map(
    db.prepare('SELECT id, name, color FROM family_members').all()
        .map((member) => [String(member.id), member])
);

const getCloudDueTasks = async (todayKey) => {
    try {
        const auth = await getAuthenticatedClient();
        if (!auth) {
            return { tasks: [], error: null };
        }

        const tasksApi = google.tasks({ version: 'v1', auth });
        const settings = loadSettingsMap();
        const familyMembersById = getFamilyMembersById();
        const taskLists = await tasksApi.tasklists.list();

        const lists = taskLists.data.items || [];
        const cloudTasks = [];

        for (const list of lists) {
            const response = await tasksApi.tasks.list({
                tasklist: list.id,
                showCompleted: false,
                maxResults: GOOGLE_TASK_LIMIT,
            });

            (response.data.items || []).forEach((task) => {
                const dueDate = task.due ? task.due.split('T')[0] : null;
                if (dueDate && dueDate > todayKey) {
                    return;
                }

                const mappedMemberId = settings[`taskListMapping_${list.id}`] || null;
                const mappedMember = mappedMemberId ? familyMembersById.get(String(mappedMemberId)) : null;

                cloudTasks.push({
                    id: `google-${task.id}`,
                    googleTaskId: task.id,
                    title: task.title,
                    notes: task.notes || '',
                    dueDate,
                    dueTime: null,
                    points: 1,
                    completed: false,
                    active: true,
                    assignedTo: mappedMember?.name || list.title,
                    assignedMemberId: mappedMemberId,
                    color: mappedMember?.color || 'google-blue',
                    source: 'google',
                    listId: list.id,
                    listName: list.title,
                    dueToday: true,
                    dueThisWeek: true,
                    isRoutine: false,
                });
            });
        }

        return { tasks: cloudTasks, error: null };
    } catch (error) {
        return { tasks: [], error: error.message };
    }
};

const getDueRoutines = (now) => {
    const rawTasks = db.prepare(`
        SELECT
            c.id,
            c.title,
            c.points,
            c.completed,
            c.recurring,
            c.schedule_type,
            c.days_of_week,
            c.due_time,
            c.cycle_key,
            c.active,
            c.assigned_to,
            fm.id AS member_id,
            fm.name AS assigned_name,
            fm.color
        FROM chores c
        LEFT JOIN family_members fm ON c.assigned_to = fm.id
        WHERE c.active = 1
        ORDER BY c.completed, c.due_time IS NULL, c.due_time, c.title
    `).all();

    const hydrate = db.transaction((tasks) => tasks.map((task) => refreshRoutineTask(db, task, now)));
    return hydrate(rawTasks)
        .filter((task) => task.dueToday && !task.completed)
        .map(mapTask);
};

const getActiveAnnouncements = () => {
    const now = new Date().toISOString();
    const rows = db.prepare(`
        SELECT a.*, fm.name AS member_name
        FROM announcements a
        LEFT JOIN family_members fm ON a.member_id = fm.id
        WHERE datetime(a.start_at) <= datetime(?)
          AND (a.expires_at IS NULL OR datetime(a.expires_at) >= datetime(?))
          AND a.dismissed_at IS NULL
        ORDER BY
            CASE a.priority
                WHEN 'high' THEN 0
                WHEN 'normal' THEN 1
                ELSE 2
            END,
            datetime(a.start_at) DESC
    `).all(now, now);

    return rows.map((row) => ({
        id: String(row.id),
        title: row.title,
        body: row.body,
        memberId: row.member_id ? String(row.member_id) : null,
        memberName: row.member_name || null,
        priority: row.priority,
        startAt: row.start_at,
        expiresAt: row.expires_at,
        dismissedAt: row.dismissed_at,
    }));
};

const getConfiguredWeather = async () => {
    const apiKey = db.prepare('SELECT value FROM settings WHERE key = ?').get('weatherApiKey');
    const location = db.prepare('SELECT value FROM settings WHERE key = ?').get('location');

    if (!apiKey?.value || !location?.value) {
        return null;
    }

    const loc = location.value.trim();
    const isZipCode = /^\d{5}$/.test(loc);
    const url = isZipCode
        ? `https://api.openweathermap.org/data/2.5/weather?zip=${loc},US&appid=${apiKey.value}&units=imperial`
        : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(loc)}&appid=${apiKey.value}&units=imperial`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Weather provider request failed');
    }

    const data = await response.json();
    const condition = data.weather?.[0]?.main || 'Unknown';
    const iconByCondition = {
        Clear: '☀️',
        Clouds: '☁️',
        Rain: '🌧️',
        Drizzle: '🌦️',
        Thunderstorm: '⛈️',
        Snow: '❄️',
        Mist: '🌫️',
        Fog: '🌫️',
        Haze: '🌫️',
    };

    return {
        temp: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        condition,
        description: data.weather?.[0]?.description || condition,
        icon: iconByCondition[condition] || '🌡️',
        windSpeed: Math.round(data.wind?.speed || 0),
        location: data.name,
    };
};

router.get('/today', async (req, res) => {
    const now = new Date();
    const todayKey = formatDateKey(now);

    try {
        const { events: nextEvents, cloudError: calendarCloudError } = await getConsolidatedUpcomingEvents(todayKey, now);
        const todayEvents = nextEvents.filter((event) => event.date === todayKey);
        const todayMeals = getTodayMeals(todayKey);
        const localDueRoutines = getDueRoutines(now);
        const { tasks: cloudDueTasks, error: tasksCloudError } = await getCloudDueTasks(todayKey);
        const dueRoutines = [...localDueRoutines, ...cloudDueTasks];
        const announcements = getActiveAnnouncements();
        const prepAgenda = buildPrepAgendaForDate(nextEvents, todayKey);
        const shopping = getShoppingItems(db);

        let weather = null;
        let weatherError = null;
        try {
            weather = await getConfiguredWeather();
        } catch (error) {
            weatherError = error.message;
        }

        res.json({
            date: todayKey,
            todayEvents,
            nextEvents,
            todayMeals,
            dueRoutines,
            announcements,
            prepAgenda,
            shopping,
            weather,
            clothing: getClothingRecommendation(weather),
            weatherError,
            integrations: {
                googleCalendar: {
                    included: nextEvents.some((event) => event.source === 'google'),
                    error: calendarCloudError,
                },
                googleTasks: {
                    included: cloudDueTasks.length > 0,
                    error: tasksCloudError,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
