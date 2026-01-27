import { configureStore } from '@reduxjs/toolkit';
import appReducer from './features/appSlice';
import dashboardReducer from './features/dashboardSlice';
import calendarReducer from './features/calendarSlice';
import tasksReducer from './features/tasksSlice';
import recipesReducer from './features/recipesSlice';
import settingsReducer from './features/settingsSlice';
import sonosReducer from './features/sonosSlice';
import mealsReducer from './features/mealsSlice';
import nestReducer from './features/nestSlice';
import { taskSyncMiddleware } from './middleware/taskSyncMiddleware';

export const store = configureStore({
    reducer: {
        app: appReducer,
        dashboard: dashboardReducer,
        calendar: calendarReducer,
        tasks: tasksReducer,
        recipes: recipesReducer,
        settings: settingsReducer,
        sonos: sonosReducer,
        meals: mealsReducer,
        nest: nestReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().prepend(taskSyncMiddleware.middleware),
});
