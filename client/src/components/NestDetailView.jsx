import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchNestDevices,
    fetchNestState,
    setNestTemperature,
    setNestMode,
    setActiveDevice,
} from '../features/nestSlice';
import TemperatureDial from './TemperatureDial';
import { Thermometer, Flame, Snowflake, Leaf, Power, Droplets, X, ChevronUp, ChevronDown, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

const NestDetailView = ({ onClose }) => {
    const dispatch = useDispatch();
    const { devices, activeDeviceId, thermostatState, loading, connected } = useSelector((state) => state.nest);
    const [pendingTemp, setPendingTemp] = useState(null);
    const tempTimeoutRef = useRef(null);

    const displayTargetTemp = pendingTemp !== null ? pendingTemp : thermostatState.targetTemp;

    useEffect(() => {
        dispatch(fetchNestDevices());
    }, [dispatch]);

    // Fetch state when active device changes
    useEffect(() => {
        if (activeDeviceId) {
            dispatch(fetchNestState(activeDeviceId));
        }
    }, [dispatch, activeDeviceId]);

    // Poll for updates every 30 seconds on detail view
    useEffect(() => {
        if (!activeDeviceId) return;
        const interval = setInterval(() => {
            dispatch(fetchNestState(activeDeviceId));
        }, 30000);
        return () => clearInterval(interval);
    }, [dispatch, activeDeviceId]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (tempTimeoutRef.current) {
                clearTimeout(tempTimeoutRef.current);
            }
        };
    }, []);

    // Handle temperature change from dial
    const handleTempChange = (newTemp) => {
        setPendingTemp(newTemp);

        if (tempTimeoutRef.current) {
            clearTimeout(tempTimeoutRef.current);
        }

        tempTimeoutRef.current = setTimeout(() => {
            if (activeDeviceId) {
                dispatch(setNestTemperature({ deviceId: activeDeviceId, temperature: newTemp }));
            }
            setPendingTemp(null);
        }, 500);
    };

    // Handle +/- button temperature adjustment
    const handleTempAdjust = (delta) => {
        const currentTarget = pendingTemp !== null ? pendingTemp : thermostatState.targetTemp;
        const newTemp = Math.max(50, Math.min(90, currentTarget + delta));
        handleTempChange(newTemp);
    };

    // Handle mode change
    const handleModeChange = (mode) => {
        if (activeDeviceId) {
            dispatch(setNestMode({ deviceId: activeDeviceId, mode }));
        }
    };

    const activeDevice = devices.find(d => d.id === activeDeviceId);

    const modes = [
        { id: 'HEAT', label: 'Heat', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/20', activeBg: 'bg-orange-500' },
        { id: 'COOL', label: 'Cool', icon: Snowflake, color: 'text-blue-500', bg: 'bg-blue-500/20', activeBg: 'bg-blue-500' },
        { id: 'HEATCOOL', label: 'Auto', icon: Thermometer, color: 'text-purple-500', bg: 'bg-purple-500/20', activeBg: 'bg-purple-500' },
        { id: 'ECO', label: 'Eco', icon: Leaf, color: 'text-green-500', bg: 'bg-green-500/20', activeBg: 'bg-green-500' },
        { id: 'OFF', label: 'Off', icon: Power, color: 'text-gray-400', bg: 'bg-gray-500/20', activeBg: 'bg-gray-600' },
    ];

    // Not connected state
    if (!connected && !loading) {
        return (
            <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-8">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="text-center max-w-md">
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
                        <Thermometer size={40} className="text-white/50" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Connect Your Nest</h2>
                    <p className="text-white/60 mb-8">
                        To control your Nest thermostat, you'll need to set up Google Device Access
                        and connect your account.
                    </p>
                    <a
                        href="/settings"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-white/90 transition-colors"
                    >
                        <Settings size={20} />
                        Go to Settings
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                        <Thermometer size={24} className="text-orange-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Thermostat</h1>
                        {devices.length > 0 && (
                            <p className="text-white/50">{activeDevice?.name || 'Select device'}</p>
                        )}
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Device Tabs (if multiple) */}
            {devices.length > 1 && (
                <div className="flex gap-2 p-4 border-b border-white/10 overflow-x-auto">
                    {devices.map((device) => (
                        <button
                            key={device.id}
                            onClick={() => dispatch(setActiveDevice(device.id))}
                            className={cn(
                                "px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors",
                                device.id === activeDeviceId
                                    ? "bg-white text-black"
                                    : "bg-white/10 hover:bg-white/20"
                            )}
                        >
                            {device.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
                {/* Temperature Dial */}
                <TemperatureDial
                    currentTemp={thermostatState.currentTemp}
                    targetTemp={displayTargetTemp}
                    mode={thermostatState.mode}
                    hvacStatus={thermostatState.hvacStatus}
                    onChange={handleTempChange}
                    disabled={loading}
                />

                {/* Quick +/- Controls */}
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => handleTempAdjust(-1)}
                        disabled={thermostatState.mode === 'OFF' || loading}
                        className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                        <ChevronDown size={28} />
                    </button>
                    <div className="text-center">
                        <div className="text-4xl font-bold">{displayTargetTemp ?? '--'}°</div>
                        <div className="text-white/50 text-sm">Target</div>
                    </div>
                    <button
                        onClick={() => handleTempAdjust(1)}
                        disabled={thermostatState.mode === 'OFF' || loading}
                        className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                        <ChevronUp size={28} />
                    </button>
                </div>

                {/* Humidity Display */}
                <div className="flex items-center gap-2 text-white/60">
                    <Droplets size={20} />
                    <span className="text-lg">{thermostatState.humidity ?? '--'}% Humidity</span>
                </div>

                {/* Mode Selector */}
                <div className="flex gap-3 flex-wrap justify-center">
                    {modes.map((mode) => {
                        const Icon = mode.icon;
                        const isActive = thermostatState.mode === mode.id;

                        return (
                            <button
                                key={mode.id}
                                onClick={() => handleModeChange(mode.id)}
                                disabled={loading}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all min-w-[80px]",
                                    isActive
                                        ? `${mode.activeBg} text-white shadow-lg`
                                        : `${mode.bg} ${mode.color} hover:scale-105`
                                )}
                            >
                                <Icon size={24} />
                                <span className="text-sm font-medium">{mode.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Status */}
                <div className={cn(
                    "text-lg font-medium",
                    thermostatState.hvacStatus === 'heating' && "text-orange-400",
                    thermostatState.hvacStatus === 'cooling' && "text-blue-400",
                    thermostatState.hvacStatus === 'idle' && "text-white/50"
                )}>
                    {thermostatState.mode === 'OFF'
                        ? 'System Off'
                        : thermostatState.hvacStatus === 'idle'
                            ? 'Idle'
                            : thermostatState.hvacStatus === 'heating'
                                ? `Heating to ${displayTargetTemp}°`
                                : `Cooling to ${displayTargetTemp}°`
                    }
                </div>
            </div>
        </div>
    );
};

export default NestDetailView;
