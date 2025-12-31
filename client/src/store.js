import { configureStore } from '@reduxjs/toolkit';
import appReducer from './features/appSlice';
import dashboardReducer from './features/dashboardSlice';
import calendarReducer from './features/calendarSlice';
import tasksReducer from './features/tasksSlice';
import recipesReducer from './features/recipesSlice';
import settingsReducer from './features/settingsSlice';

export const store = configureStore({
    reducer: {
        app: appReducer,
        dashboard: dashboardReducer,
        calendar: calendarReducer,
        tasks: tasksReducer,
        recipes: recipesReducer,
        settings: settingsReducer,
    },
});
