import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { toggleChoreAsync, completeGoogleTaskAsync } from '../features/tasksSlice';
import { fetchDashboardData } from '../features/dashboardSlice';
import { fetchSettings } from '../features/settingsSlice';

export const taskSyncMiddleware = createListenerMiddleware();

// Listen for task completion and sync dashboard
taskSyncMiddleware.startListening({
    matcher: isAnyOf(
        toggleChoreAsync.fulfilled,
        completeGoogleTaskAsync.fulfilled,
    ),
    effect: async (action, listenerApi) => {
        // Refresh dashboard data to reflect task completion
        listenerApi.dispatch(fetchDashboardData());
        // Refresh settings to get updated family member points
        listenerApi.dispatch(fetchSettings());
    },
});
