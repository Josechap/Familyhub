import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';

export const fetchSonosDevices = createAsyncThunk(
    'sonos/fetchDevices',
    async () => {
        return await api.getSonosDevices();
    }
);

export const fetchSonosState = createAsyncThunk(
    'sonos/fetchState',
    async (ip) => {
        return await api.getSonosState(ip);
    }
);

export const sonosPlay = createAsyncThunk(
    'sonos/play',
    async (ip) => {
        return await api.sonosPlay(ip);
    }
);

export const sonosPause = createAsyncThunk(
    'sonos/pause',
    async (ip) => {
        return await api.sonosPause(ip);
    }
);

export const sonosNext = createAsyncThunk(
    'sonos/next',
    async (ip) => {
        return await api.sonosNext(ip);
    }
);

export const sonosPrevious = createAsyncThunk(
    'sonos/previous',
    async (ip) => {
        return await api.sonosPrevious(ip);
    }
);

export const sonosVolume = createAsyncThunk(
    'sonos/volume',
    async ({ ip, level }) => {
        return await api.sonosVolume(ip, level);
    }
);

const sonosSlice = createSlice({
    name: 'sonos',
    initialState: {
        devices: [],
        activeDeviceIp: null,
        playerState: {
            volume: 0,
            state: 'STOPPED',
            track: null
        },
        loading: false,
        error: null
    },
    reducers: {
        setActiveDevice: (state, action) => {
            state.activeDeviceIp = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSonosDevices.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchSonosDevices.fulfilled, (state, action) => {
                state.loading = false;
                state.devices = action.payload;
                // Auto-select first device if none selected
                if (!state.activeDeviceIp && action.payload.length > 0) {
                    state.activeDeviceIp = action.payload[0].ip;
                }
            })
            .addCase(fetchSonosDevices.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(fetchSonosState.fulfilled, (state, action) => {
                state.playerState = action.payload;
            });
    }
});

export const { setActiveDevice } = sonosSlice.actions;
export default sonosSlice.reducer;
