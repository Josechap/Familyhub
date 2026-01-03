import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Fetch dashboard data (today's events, tasks, and dinner)
export const fetchDashboardData = createAsyncThunk('dashboard/fetchData', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Fetch Google Calendar events
    let events = [];
    try {
        const eventsRes = await fetch('http://localhost:3001/api/google/calendar/events');
        if (eventsRes.ok) {
            const allEvents = await eventsRes.json();
            // Filter to today's events
            events = allEvents.filter(e => e.date === todayStr).map(e => ({
                id: e.id,
                title: e.title,
                time: formatEventTime(e.startHour, e.duration),
                color: mapColor(e.color),
                member: e.member,
            }));
        }
    } catch (err) {
        console.log('Could not fetch events');
    }

    // Fetch Google Tasks
    let tasks = [];
    try {
        const tasksRes = await fetch('http://localhost:3001/api/google/tasks');
        if (tasksRes.ok) {
            const allTasks = await tasksRes.json();
            // Filter to tasks due today and assigned to a family member
            tasks = allTasks
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
                }));
        }
    } catch (err) {
        console.log('Could not fetch tasks');
    }

    // Fetch today's dinner
    let dinner = { title: 'Plan Dinner', emoji: '🍽️' };
    try {
        const dinnerRes = await fetch('http://localhost:3001/api/meals/today');
        if (dinnerRes.ok) {
            const dinnerData = await dinnerRes.json();
            if (dinnerData) {
                dinner = {
                    title: dinnerData.recipe_title || 'No Title',
                    emoji: dinnerData.recipe_emoji || '🍽️',
                    photo: dinnerData.recipe_photo || null,
                };
            }
        }
    } catch (err) {
        console.log('Could not fetch dinner');
    }

    return { events, tasks, dinner };
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
    weather: {
        temp: 68,
        high: 72,
        low: 55,
        condition: 'Partly Cloudy',
        icon: '⛅',
        humidity: 45,
        wind: 8,
    },
    clothing: {
        main: 'Light Jacket',
        mainIcon: '🧥',
        accessories: ['👟 Sneakers', '🧢 Cap'],
        note: 'Bring sunglasses for afternoon sun',
    },
    upcomingEvents: [],
    todayTasks: [],
    dinner: {
        title: 'Plan Dinner',
        emoji: '🍽️',
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
            })
            .addCase(fetchDashboardData.rejected, (state) => {
                state.loading = false;
            });
    },
});

export const { setWeather, setUpcomingEvents, setDinner, setScoreboard } = dashboardSlice.actions;

export default dashboardSlice.reducer;
