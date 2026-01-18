import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE } from '../lib/config';

// Fetch dashboard data (upcoming events, tasks, and meals)
export const fetchDashboardData = createAsyncThunk('dashboard/fetchData', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Fetch Google Calendar events
    let events = [];
    try {
        const eventsRes = await fetch(`${API_BASE}/google/calendar/events`);
        if (eventsRes.ok) {
            const allEvents = await eventsRes.json();
            // Filter to today and future events, limit to next 10
            events = allEvents
                .filter(e => e.date >= todayStr)
                .sort((a, b) => {
                    if (a.date !== b.date) return a.date.localeCompare(b.date);
                    return (a.startHour || 0) - (b.startHour || 0);
                })
                .slice(0, 10)
                .map(e => ({
                    id: e.id,
                    title: e.title,
                    date: e.date,
                    time: formatEventTime(e.startHour, e.duration),
                    color: mapColor(e.color),
                    member: e.member,
                    isToday: e.date === todayStr,
                }));
        }
    } catch {
        console.log('Could not fetch events');
    }

    // Fetch local chores from /api/tasks
    let localChores = [];
    try {
        const choresRes = await fetch(`${API_BASE}/tasks`);
        if (choresRes.ok) {
            const allChores = await choresRes.json();
            localChores = allChores.map(c => ({
                id: `local-${c.id}`,
                title: c.title,
                assignedTo: c.assignedTo,
                completed: Boolean(c.completed),
                points: c.points || 1,
                source: 'local',
            }));
        }
    } catch {
        console.log('Could not fetch local chores');
    }

    // Fetch Google Tasks
    let googleTasks = [];
    try {
        const tasksRes = await fetch(`${API_BASE}/google/tasks`);
        if (tasksRes.ok) {
            const allTasks = await tasksRes.json();
            // Filter to tasks due today and assigned to a family member
            googleTasks = allTasks
                .filter(t => {
                    // Only include tasks with a valid assignedTo (family member name)
                    if (!t.assignedTo) return false;
                    // Filter by due date (today or no due date)
                    if (t.dueDate && t.dueDate !== todayStr) return false;
                    return true;
                })
                .map(t => ({
                    id: t.id,
                    title: t.title,
                    listId: t.listId,
                    googleTaskId: t.googleTaskId,
                    assignedTo: t.assignedTo,
                    completed: t.status === 'completed',
                    source: 'google',
                }));
        }
    } catch {
        console.log('Could not fetch Google tasks');
    }

    // Combine local chores and Google Tasks
    const tasks = [...localChores, ...googleTasks];

    // Fetch today's meals (all types: breakfast, lunch, dinner, snack)
    let todayMeals = {
        breakfast: null,
        lunch: null,
        dinner: null,
        snack: null,
    };
    try {
        const mealsRes = await fetch(`${API_BASE}/meals/today`);
        if (mealsRes.ok) {
            const mealsData = await mealsRes.json();
            todayMeals = mealsData;
        }
    } catch {
        console.log('Could not fetch today\'s meals');
    }

    // Legacy dinner for backward compatibility
    const dinner = todayMeals.dinner
        ? {
            title: todayMeals.dinner.recipeTitle || 'No Title',
            emoji: todayMeals.dinner.recipeEmoji || '🍽️',
            photo: todayMeals.dinner.recipePhoto || null,
        }
        : { title: 'Plan Dinner', emoji: '🍽️' };

    return { events, tasks, dinner, todayMeals };
});

// Helper functions
const formatEventTime = (startHour, duration) => {
    const startH = Math.floor(startHour);
    const startM = Math.round((startHour % 1) * 60);
    const endHour = startHour + duration;
    const endH = Math.floor(endHour);
    const endM = Math.round((endHour % 1) * 60);

    const formatTime = (h, m) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
    };

    return `${formatTime(startH, startM)} - ${formatTime(endH, endM)}`;
};

const mapColor = (color) => {
    const colorMap = {
        'pastel-blue': 'pastel-blue',
        'pastel-pink': 'pastel-pink',
        'pastel-green': 'pastel-green',
        'pastel-yellow': 'pastel-yellow',
        'pastel-purple': 'pastel-purple',
        'google-blue': 'pastel-blue',
    };
    return colorMap[color] || 'pastel-blue';
};

const initialState = {
    greeting: 'Good Morning',
    weather: null, // null until real weather data is fetched
    clothing: null, // null until weather-based recommendations are available
    upcomingEvents: [],
    todayTasks: [],
    dinner: {
        title: 'Plan Dinner',
        emoji: '🍽️',
    },
    todayMeals: {
        breakfast: null,
        lunch: null,
        dinner: null,
        snack: null,
    },
    scoreboard: [],
    loading: false,
};

export const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        setWeather: (state, action) => {
            state.weather = action.payload;
        },
        setUpcomingEvents: (state, action) => {
            state.upcomingEvents = action.payload;
        },
        setDinner: (state, action) => {
            state.dinner = action.payload;
        },
        setScoreboard: (state, action) => {
            state.scoreboard = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboardData.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchDashboardData.fulfilled, (state, action) => {
                state.loading = false;
                state.upcomingEvents = action.payload.events;
                state.todayTasks = action.payload.tasks;
                state.dinner = action.payload.dinner;
                state.todayMeals = action.payload.todayMeals;
            })
            .addCase(fetchDashboardData.rejected, (state) => {
                state.loading = false;
            });
    },
});

export const { setWeather, setUpcomingEvents, setDinner, setScoreboard } = dashboardSlice.actions;

export default dashboardSlice.reducer;
