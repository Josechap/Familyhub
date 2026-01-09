import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE } from '../lib/config';

// Async thunks
export const fetchSettings = createAsyncThunk('settings/fetch', async () => {
    const [settings, family] = await Promise.all([
        fetch(`${API_BASE}/settings`).then(r => r.json()),
        fetch(`${API_BASE}/settings/family`).then(r => r.json()),
    ]);
    return { settings, familyMembers: family };
});

export const updateSettings = createAsyncThunk('settings/update', async (settingsData) => {
    await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData),
    });
    return settingsData;
});

export const addFamilyMember = createAsyncThunk('settings/addMember', async ({ name, color }) => {
    const res = await fetch(`${API_BASE}/settings/family`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
    });
    return res.json();
});

export const updateFamilyMember = createAsyncThunk('settings/updateMember', async ({ id, name, color }) => {
    await fetch(`${API_BASE}/settings/family/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
    });
    return { id, name, color };
});

export const deleteFamilyMember = createAsyncThunk('settings/deleteMember', async (id) => {
    await fetch(`${API_BASE}/settings/family/${id}`, { method: 'DELETE' });
    return id;
});

const initialState = {
    darkMode: false,
    use24Hour: false,
    weeklyGoal: 500,
    weatherApiKey: '',
    location: '',
    familyMembers: [],
    loading: false,
    error: null,
};

export const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        toggleDarkMode: (state) => {
            state.darkMode = !state.darkMode;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSettings.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchSettings.fulfilled, (state, action) => {
                state.loading = false;
                const s = action.payload.settings;
                state.darkMode = s.darkMode === 'true';
                state.use24Hour = s.use24Hour === 'true';
                state.weeklyGoal = parseInt(s.weeklyGoal) || 500;
                state.weatherApiKey = s.weatherApiKey || '';
                state.location = s.location || '';
                state.familyMembers = action.payload.familyMembers;
            })
            .addCase(fetchSettings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(updateSettings.fulfilled, (state, action) => {
                Object.entries(action.payload).forEach(([key, value]) => {
                    if (key in state) {
                        state[key] = value;
                    }
                });
            })
            .addCase(addFamilyMember.fulfilled, (state, action) => {
                state.familyMembers.push(action.payload);
            })
            .addCase(updateFamilyMember.fulfilled, (state, action) => {
                const member = state.familyMembers.find(m => m.id === action.payload.id);
                if (member) {
                    member.name = action.payload.name;
                    member.color = action.payload.color;
                }
            })
            .addCase(deleteFamilyMember.fulfilled, (state, action) => {
                state.familyMembers = state.familyMembers.filter(m => m.id !== action.payload);
            });
    },
});

export const { toggleDarkMode } = settingsSlice.actions;

export default settingsSlice.reducer;
