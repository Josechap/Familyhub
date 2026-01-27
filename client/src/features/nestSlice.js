import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';

export const fetchNestDevices = createAsyncThunk(
    'nest/fetchDevices',
    async () => {
        return await api.getNestDevices();
    }
);

export const fetchNestState = createAsyncThunk(
    'nest/fetchState',
    async (deviceId) => {
        return await api.getNestState(deviceId);
    }
);

export const setNestTemperature = createAsyncThunk(
    'nest/setTemperature',
    async ({ deviceId, temperature }) => {
        return await api.setNestTemperature(deviceId, temperature);
    }
);

export const setNestMode = createAsyncThunk(
    'nest/setMode',
    async ({ deviceId, mode }) => {
        return await api.setNestMode(deviceId, mode);
    }
);

const nestSlice = createSlice({
    name: 'nest',
    initialState: {
        devices: [],
        activeDeviceId: null,
        thermostatState: {
            currentTemp: null,
            targetTemp: null,
            humidity: null,
            mode: 'OFF', // HEAT, COOL, HEATCOOL, OFF, ECO
            hvacStatus: 'idle', // heating, cooling, idle
            isOnline: false,
        },
        loading: false,
        error: null,
        connected: false,
    },
    reducers: {
        setActiveDevice: (state, action) => {
            state.activeDeviceId = action.payload;
        },
        // Optimistic update for temperature
        setTargetTempOptimistic: (state, action) => {
            state.thermostatState.targetTemp = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNestDevices.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchNestDevices.fulfilled, (state, action) => {
                state.loading = false;
                state.devices = action.payload.devices || [];
                state.connected = action.payload.connected || false;
                // Auto-select first device if none selected
                if (!state.activeDeviceId && state.devices.length > 0) {
                    state.activeDeviceId = state.devices[0].id;
                }
            })
            .addCase(fetchNestDevices.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
                state.connected = false;
            })
            .addCase(fetchNestState.fulfilled, (state, action) => {
                state.thermostatState = {
                    ...state.thermostatState,
                    ...action.payload,
                };
            })
            .addCase(setNestTemperature.fulfilled, (state, action) => {
                state.thermostatState.targetTemp = action.payload.targetTemp;
            })
            .addCase(setNestMode.fulfilled, (state, action) => {
                state.thermostatState.mode = action.payload.mode;
            });
    }
});

export const { setActiveDevice, setTargetTempOptimistic } = nestSlice.actions;
export default nestSlice.reducer;
