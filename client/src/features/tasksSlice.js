import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';
import { API_BASE } from '../lib/config';

// Async thunks
export const fetchTasks = createAsyncThunk('tasks/fetchTasks', async () => {
    const [chores, familyMembers, googleTasks, settings] = await Promise.all([
        api.getTasks(),
        api.getFamilyMembers(),
        api.getGoogleTasks(),
        fetch(`${API_BASE}/settings`).then(r => r.json()),
    ]);

    // Map Google tasks to family members based on task list mappings
    const mappedGoogleTasks = googleTasks.map(task => {
        // Find the mapping for this task's list
        const mappingKey = `taskListMapping_${task.listId}`;
        const memberId = settings[mappingKey];
        const member = familyMembers.find(m => m.id === memberId);

        return {
            ...task,
            assignedTo: member?.name || task.listName,
            assignedMemberId: memberId,
        };
    });

    return { chores, familyMembers, googleTasks: mappedGoogleTasks };
});

export const toggleChoreAsync = createAsyncThunk('tasks/toggleChore', async (choreId, { getState }) => {
    await api.toggleChore(choreId);
    // Refetch to get updated data
    const [chores, familyMembers] = await Promise.all([
        api.getTasks(),
        api.getFamilyMembers(),
    ]);
    return { chores, familyMembers, choreId };
});

const initialState = {
    chores: [],
    familyMembers: [],
    googleTasks: [],
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
        builder
            .addCase(fetchTasks.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchTasks.fulfilled, (state, action) => {
                state.loading = false;
                state.chores = action.payload.chores;
                state.familyMembers = action.payload.familyMembers;
                state.googleTasks = action.payload.googleTasks;
            })
            .addCase(fetchTasks.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(toggleChoreAsync.fulfilled, (state, action) => {
                state.chores = action.payload.chores;
                state.familyMembers = action.payload.familyMembers;
                // Check if the chore was completed (not uncompleted)
                const chore = action.payload.chores.find(c => c.id === action.payload.choreId);
                if (chore?.completed) {
                    state.showConfetti = true;
                    state.lastCompletedChore = action.payload.choreId;
                }
            });
    },
});

export const { hideConfetti } = tasksSlice.actions;

export default tasksSlice.reducer;
