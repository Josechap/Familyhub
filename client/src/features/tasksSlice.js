import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';
import { API_BASE } from '../lib/config';

const mapGoogleTasksToMembers = async (googleTasks, familyMembers) => {
    const settings = await fetch(`${API_BASE}/settings`).then((response) => response.json());
    return googleTasks.map((task) => {
        const mappingKey = `taskListMapping_${task.listId}`;
        const memberId = settings[mappingKey];
        const member = familyMembers.find((item) => item.id === memberId);

        return {
            ...task,
            assignedTo: member?.name || task.listName,
            assignedMemberId: memberId || null,
        };
    });
};

const loadTaskPayload = async () => {
    const [chores, familyMembers, googleTasks, history, dailyStats] = await Promise.all([
        api.getTasks(),
        api.getFamilyMembers(),
        api.getGoogleTasks(),
        api.getTaskHistory(14),
        api.getDailyTaskStats(14),
    ]);

    return {
        chores,
        familyMembers,
        googleTasks: await mapGoogleTasksToMembers(googleTasks, familyMembers),
        history,
        dailyStats,
    };
};

export const fetchTasks = createAsyncThunk('tasks/fetchTasks', async () => {
    return loadTaskPayload();
});

export const toggleChoreAsync = createAsyncThunk('tasks/toggleChore', async (choreId) => {
    await api.toggleChore(choreId);
    return loadTaskPayload();
});

export const completeGoogleTaskAsync = createAsyncThunk(
    'tasks/completeGoogleTask',
    async ({ listId, taskId }) => {
        await api.completeGoogleTask(listId, taskId);
        return loadTaskPayload();
    }
);

export const createTaskAsync = createAsyncThunk('tasks/createTask', async (payload) => {
    await api.createTask(payload);
    return loadTaskPayload();
});

export const deleteTaskAsync = createAsyncThunk('tasks/deleteTask', async (taskId) => {
    await api.deleteTask(taskId);
    return loadTaskPayload();
});

const initialState = {
    chores: [],
    familyMembers: [],
    googleTasks: [],
    history: [],
    dailyStats: [],
    showConfetti: false,
    lastCompletedChore: null,
    loading: false,
    error: null,
};

export const tasksSlice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {
        hideConfetti: (state) => {
            state.showConfetti = false;
            state.lastCompletedChore = null;
        },
    },
    extraReducers: (builder) => {
        const applyFetchPayload = (state, action) => {
            state.chores = action.payload.chores;
            state.familyMembers = action.payload.familyMembers;
            state.googleTasks = action.payload.googleTasks;
            state.history = action.payload.history;
            state.dailyStats = action.payload.dailyStats;
        };

        builder
            .addCase(fetchTasks.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchTasks.fulfilled, (state, action) => {
                state.loading = false;
                applyFetchPayload(state, action);
            })
            .addCase(fetchTasks.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(completeGoogleTaskAsync.fulfilled, (state) => {
                state.loading = false;
                state.showConfetti = true;
            })
            .addMatcher(
                (action) => [
                    toggleChoreAsync.fulfilled.type,
                    completeGoogleTaskAsync.fulfilled.type,
                    createTaskAsync.fulfilled.type,
                    deleteTaskAsync.fulfilled.type,
                ].includes(action.type),
                (state, action) => {
                    if (action.payload) {
                        applyFetchPayload(state, action);
                    }
                }
            )
            .addMatcher(
                (action) => [
                    toggleChoreAsync.pending.type,
                    completeGoogleTaskAsync.pending.type,
                    createTaskAsync.pending.type,
                    deleteTaskAsync.pending.type,
                ].includes(action.type),
                (state) => {
                    state.loading = true;
                }
            )
            .addMatcher(
                (action) => [
                    toggleChoreAsync.rejected.type,
                    completeGoogleTaskAsync.rejected.type,
                    createTaskAsync.rejected.type,
                    deleteTaskAsync.rejected.type,
                ].includes(action.type),
                (state, action) => {
                    state.loading = false;
                    state.error = action.error.message;
                }
            );
    },
});

export const { hideConfetti } = tasksSlice.actions;

export default tasksSlice.reducer;
