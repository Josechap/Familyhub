import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    greeting: 'Good Morning',
    weather: {
        temp: 22,
        condition: 'Cloudy',
        icon: '⛅',
    },
    clothing: {
        recommendation: 'Light Jacket',
        icon: '🧥',
    },
    upcomingEvents: [
        { id: 1, title: 'Soccer Practice', time: '16:00 - 17:30', color: 'pastel-blue' },
        { id: 2, title: 'Piano Lesson', time: '18:00 - 19:00', color: 'pastel-pink' },
        { id: 3, title: 'Trash Pickup', time: '20:00', color: 'pastel-green' },
    ],
    dinner: {
        title: 'Tacos Al Pastor',
        emoji: '🌮',
    },
    scoreboard: [
        { id: '2', name: 'Mom', points: 150, color: 'pastel-pink' },
        { id: '1', name: 'Dad', points: 120, color: 'pastel-blue' },
    ],
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
    },
});

export const { setWeather, setUpcomingEvents, setDinner } = dashboardSlice.actions;

export default dashboardSlice.reducer;
