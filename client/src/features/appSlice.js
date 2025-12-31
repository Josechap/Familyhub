import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    activeTab: 'dashboard', // dashboard, calendar, tasks, recipes, photos, settings
    familyMembers: [
        { id: '1', name: 'Dad', color: '#A7C7E7', points: 120 },
        { id: '2', name: 'Mom', color: '#F4C2C2', points: 150 },
        { id: '3', name: 'Kid1', color: '#C1E1C1', points: 80 },
    ],
};

export const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setActiveTab: (state, action) => {
            state.activeTab = action.payload;
        },
    },
});

export const { setActiveTab } = appSlice.actions;

export default appSlice.reducer;
