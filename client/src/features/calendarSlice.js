import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';

// Async thunks
export const fetchCalendarData = createAsyncThunk('calendar/fetchData', async () => {
    const [events, familyMembers, dinnerSlots] = await Promise.all([
        api.getEvents(),
        api.getFamilyMembers(),
        api.getDinnerSlots(),
    ]);
    return { events, familyMembers, dinnerSlots };
});

const initialState = {
    events: [],
    dinnerSlots: [],
    selectedDate: new Date().toISOString().split('T')[0],
    familyMembers: [],
    loading: false,
    error: null,
};

export const calendarSlice = createSlice({
    name: 'calendar',
    initialState,
    reducers: {
        setSelectedDate: (state, action) => {
            state.selectedDate = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCalendarData.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCalendarData.fulfilled, (state, action) => {
                state.loading = false;
                state.events = action.payload.events;
                state.familyMembers = action.payload.familyMembers;
                state.dinnerSlots = action.payload.dinnerSlots;
            })
            .addCase(fetchCalendarData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    },
});

export const { setSelectedDate } = calendarSlice.actions;

export default calendarSlice.reducer;
