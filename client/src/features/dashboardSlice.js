import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';

export const fetchDashboardData = createAsyncThunk('dashboard/fetchData', async () => {
    const today = await api.getDashboardToday();

    const dinner = today.todayMeals?.dinner
        ? {
            title: today.todayMeals.dinner.recipeTitle || 'No Title',
            emoji: today.todayMeals.dinner.recipeEmoji || '🍽️',
            photo: today.todayMeals.dinner.recipePhoto || null,
        }
        : { title: 'Plan Dinner', emoji: '🍽️' };

    return {
        events: today.nextEvents || [],
        todayEvents: today.todayEvents || [],
        tasks: today.dueRoutines || [],
        dinner,
        todayMeals: today.todayMeals || {
            breakfast: null,
            lunch: null,
            dinner: null,
            snack: null,
        },
        announcements: today.announcements || [],
        prepAgenda: today.prepAgenda || [],
        shopping: today.shopping || { items: [], uncheckedCount: 0 },
        weather: today.weather || null,
        clothing: today.clothing || null,
    };
});

const initialState = {
    greeting: 'Good Morning',
    weather: null,
    clothing: null,
    upcomingEvents: [],
    todayEvents: [],
    todayTasks: [],
    announcements: [],
    prepAgenda: [],
    shopping: {
        items: [],
        uncheckedCount: 0,
    },
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
        setUpcomingEvents: (state, action) => {
            state.upcomingEvents = action.payload;
        },
        setDinner: (state, action) => {
            state.dinner = action.payload;
        },
        setScoreboard: (state, action) => {
            state.scoreboard = action.payload;
        },
        dismissAnnouncementLocal: (state, action) => {
            state.announcements = state.announcements.filter((announcement) => announcement.id !== action.payload);
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
                state.todayEvents = action.payload.todayEvents;
                state.todayTasks = action.payload.tasks;
                state.dinner = action.payload.dinner;
                state.todayMeals = action.payload.todayMeals;
                state.announcements = action.payload.announcements;
                state.prepAgenda = action.payload.prepAgenda;
                state.shopping = action.payload.shopping;
                state.weather = action.payload.weather;
                state.clothing = action.payload.clothing;
            })
            .addCase(fetchDashboardData.rejected, (state) => {
                state.loading = false;
            });
    },
});

export const {
    setUpcomingEvents,
    setDinner,
    setScoreboard,
    dismissAnnouncementLocal,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
