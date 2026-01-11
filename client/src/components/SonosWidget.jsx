import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchSonosDevices,
    fetchSonosState,
    sonosPlay,
    sonosPause,
    sonosNext,
    sonosPrevious,
    sonosVolume,
    setActiveDevice
} from '../features/sonosSlice';
import { Play, Pause, SkipBack, SkipForward, Volume2, Speaker, Music2 } from 'lucide-react';

const SonosWidget = () => {
    const dispatch = useDispatch();
    const { devices, activeDeviceIp, playerState, loading } = useSelector((state) => state.sonos);
    const [pendingVolume, setPendingVolume] = useState(null);
    const volumeTimeoutRef = useRef(null);

    useEffect(() => {
        dispatch(fetchSonosDevices());
    }, [dispatch]);

    // Display pending volume while adjusting, otherwise show server volume
    const displayVolume = pendingVolume !== null ? pendingVolume : (playerState.volume ?? 0);

    // Poll for state updates every 5 seconds if a device is active
    useEffect(() => {
        if (!activeDeviceIp) return;

        const fetchState = () => dispatch(fetchSonosState(activeDeviceIp));
        fetchState(); // Initial fetch

        const interval = setInterval(fetchState, 5000);
        return () => clearInterval(interval);
    }, [dispatch, activeDeviceIp]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (volumeTimeoutRef.current) {
                clearTimeout(volumeTimeoutRef.current);
            }
        };
    }, []);

    // Filter to show only coordinators (main speakers of groups)
    const coordinators = devices.filter(d => d.isCoordinator);
    const displayDevices = coordinators.length > 0 ? coordinators : devices;

    const isPlaying = playerState.state === 'PLAYING' || playerState.state === 'TRANSITIONING';

    // Volume change handler with debounce
    const handleVolumeChange = (e) => {
        const level = parseInt(e.target.value);
        setPendingVolume(level); // Update local state immediately for smooth UI

        if (!activeDeviceIp) return;

        // Clear any pending volume change
        if (volumeTimeoutRef.current) {
            clearTimeout(volumeTimeoutRef.current);
        }

        // Debounce the actual API call by 500ms
        volumeTimeoutRef.current = setTimeout(() => {
            dispatch(sonosVolume({ ip: activeDeviceIp, level: level }));
            setPendingVolume(null); // Clear pending, let server value take over
        }, 500);
    };

    if (devices.length === 0 && !loading) {
        return (
            <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-gray-400 h-full min-h-[200px]">
                <Speaker size={32} className="mb-2 opacity-50" />
                <div>No Sonos speakers found</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-4 shadow-sm h-full flex flex-col overflow-hidden">
            {/* Header / Device Selector */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 w-full">
                    <Speaker size={18} className="text-orange-500 flex-shrink-0" />
                    <select
                        className="text-sm font-serif bg-transparent border-none focus:ring-0 cursor-pointer w-full truncate"
                        value={activeDeviceIp || ''}
                        onChange={(e) => dispatch(setActiveDevice(e.target.value))}
                    >
                        {displayDevices.map(device => (
                            <option key={device.ip} value={device.ip}>
                                {device.name} {device.group && device.group !== device.name ? `(${device.group})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Track Info */}
            <div className="flex-1 flex flex-col items-center justify-center text-center min-h-0 mb-2">
                {playerState.track?.art ? (
                    <img
                        src={playerState.track.art}
                        alt="Album Art"
                        className="w-20 h-20 rounded-xl shadow-md mb-2 object-cover"
                    />
                ) : (
                    <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center mb-2">
                        <Music2 size={24} className="text-gray-300" />
                    </div>
                )}
                <div className="font-bold text-base line-clamp-1 w-full px-2">
                    {playerState.track?.title || 'Not Playing'}
                </div>
                <div className="text-xs text-gray-500 line-clamp-1 w-full px-2">
                    {playerState.track?.artist || 'Select music to play'}
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-3 mt-auto">
                {/* Playback Buttons */}
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={() => activeDeviceIp && dispatch(sonosPrevious(activeDeviceIp))}
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={!activeDeviceIp}
                    >
                        <SkipBack size={20} />
                    </button>

                    <button
                        onClick={() => activeDeviceIp && dispatch(isPlaying ? sonosPause(activeDeviceIp) : sonosPlay(activeDeviceIp))}
                        className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors shadow-md"
                        disabled={!activeDeviceIp}
                    >
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                    </button>

                    <button
                        onClick={() => activeDeviceIp && dispatch(sonosNext(activeDeviceIp))}
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={!activeDeviceIp}
                    >
                        <SkipForward size={20} />
                    </button>
                </div>

                {/* Volume Slider */}
                <div className="flex items-center gap-2 px-1">
                    <Volume2 size={14} className="text-gray-400" />
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={displayVolume}
                        onChange={handleVolumeChange}
                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        disabled={!activeDeviceIp}
                    />
                    <span className="text-xs text-gray-400 w-8 text-right">{displayVolume}</span>
                </div>
            </div>
        </div>
    );
};

export default SonosWidget;
