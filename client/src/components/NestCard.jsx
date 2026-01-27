import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchNestDevices,
    fetchNestState,
    setNestTemperature,
    setActiveDevice,
    setTargetTempOptimistic,
} from '../features/nestSlice';
import { Thermometer, Flame, Snowflake, Leaf, Power, ChevronUp, ChevronDown, Droplets } from 'lucide-react';
import { cn } from '../lib/utils';

const NestCard = ({ onOpenDetail }) => {
    const dispatch = useDispatch();
    const { devices, activeDeviceId, thermostatState, loading, connected } = useSelector((state) => state.nest);
    const [pendingTemp, setPendingTemp] = useState(null);
    const tempTimeoutRef = useRef(null);

    // Display pending temp while adjusting, otherwise show server temp
    const displayTargetTemp = pendingTemp !== null ? pendingTemp : thermostatState.targetTemp;

    useEffect(() => {
        dispatch(fetchNestDevices());
    }, [dispatch]);

    // Poll for state updates every 60 seconds if a device is active
    useEffect(() => {
        if (!activeDeviceId) return;

        const fetchState = () => dispatch(fetchNestState(activeDeviceId));
        fetchState(); // Initial fetch

        const interval = setInterval(fetchState, 60000);
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

    // Temperature adjustment handler with debounce
    const handleTempChange = (delta) => {
        const newTemp = (pendingTemp !== null ? pendingTemp : thermostatState.targetTemp) + delta;

        // Clamp between 50-90°F
        const clampedTemp = Math.max(50, Math.min(90, newTemp));
        setPendingTemp(clampedTemp);
        dispatch(setTargetTempOptimistic(clampedTemp));

        if (!activeDeviceId) return;

        // Clear any pending API call
        if (tempTimeoutRef.current) {
            clearTimeout(tempTimeoutRef.current);
        }

        // Debounce the actual API call by 1 second
        tempTimeoutRef.current = setTimeout(() => {
            dispatch(setNestTemperature({ deviceId: activeDeviceId, temperature: clampedTemp }));
            setPendingTemp(null);
        }, 1000);
    };

    // Get mode icon and color
    const getModeDisplay = () => {
        switch (thermostatState.mode) {
            case 'HEAT':
                return { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/20' };
            case 'COOL':
                return { icon: Snowflake, color: 'text-blue-500', bg: 'bg-blue-500/20' };
            case 'HEATCOOL':
                return { icon: Thermometer, color: 'text-purple-500', bg: 'bg-purple-500/20' };
            case 'ECO':
                return { icon: Leaf, color: 'text-green-500', bg: 'bg-green-500/20' };
            default:
                return { icon: Power, color: 'text-gray-400', bg: 'bg-gray-500/20' };
        }
    };

    // Get HVAC status text
    const getHvacStatusText = () => {
        if (thermostatState.hvacStatus === 'heating') return 'Heating to';
        if (thermostatState.hvacStatus === 'cooling') return 'Cooling to';
        return 'Set to';
    };

    const modeDisplay = getModeDisplay();
    const ModeIcon = modeDisplay.icon;

    // Not connected state
    if (!connected && !loading) {
        return (
            <div
                className="card flex flex-col items-center justify-center text-white/40 h-full min-h-[180px] cursor-pointer hover:bg-white/5 transition-colors"
                onClick={onOpenDetail}
            >
                <Thermometer size={32} className="mb-2 opacity-50" />
                <div className="text-lg">Nest not connected</div>
                <div className="text-sm mt-1">Tap to set up</div>
            </div>
        );
    }

    // Loading state
    if (loading && devices.length === 0) {
        return (
            <div className="card flex flex-col items-center justify-center text-white/40 h-full min-h-[180px]">
                <Thermometer size={32} className="mb-2 opacity-50 animate-pulse" />
                <div>Loading...</div>
            </div>
        );
    }

    const activeDevice = devices.find(d => d.id === activeDeviceId);

    return (
        <div
            className="card h-full flex flex-col cursor-pointer hover:bg-white/5 transition-colors"
            onClick={onOpenDetail}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", modeDisplay.bg)}>
                        <ModeIcon size={20} className={modeDisplay.color} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">Thermostat</h3>
                        {devices.length > 1 && (
                            <p className="text-white/50 text-sm">{activeDevice?.name}</p>
                        )}
                    </div>
                </div>
                {devices.length > 1 && (
                    <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
                        +{devices.length - 1} more
                    </span>
                )}
            </div>

            {/* Temperature Display */}
            <div className="flex-1 flex items-center justify-center gap-6">
                {/* Current Temperature */}
                <div className="text-center">
                    <div className="text-5xl font-bold text-white">
                        {thermostatState.currentTemp ?? '--'}°
                    </div>
                    <div className="text-white/50 text-sm mt-1">Current</div>
                </div>

                {/* Divider */}
                <div className="h-16 w-px bg-white/10"></div>

                {/* Target Temperature with Controls */}
                <div className="text-center">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleTempChange(-1);
                            }}
                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            disabled={thermostatState.mode === 'OFF'}
                        >
                            <ChevronDown size={20} />
                        </button>
                        <div className={cn(
                            "text-4xl font-bold min-w-[80px]",
                            thermostatState.hvacStatus === 'heating' && "text-orange-400",
                            thermostatState.hvacStatus === 'cooling' && "text-blue-400",
                            thermostatState.hvacStatus === 'idle' && "text-white/70"
                        )}>
                            {displayTargetTemp ?? '--'}°
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleTempChange(1);
                            }}
                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            disabled={thermostatState.mode === 'OFF'}
                        >
                            <ChevronUp size={20} />
                        </button>
                    </div>
                    <div className="text-white/50 text-sm mt-1">
                        {getHvacStatusText()}
                    </div>
                </div>
            </div>

            {/* Footer - Humidity & Status */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-2 text-white/50">
                    <Droplets size={16} />
                    <span className="text-sm">{thermostatState.humidity ?? '--'}% humidity</span>
                </div>
                <div className={cn(
                    "text-sm font-medium",
                    thermostatState.hvacStatus === 'heating' && "text-orange-400",
                    thermostatState.hvacStatus === 'cooling' && "text-blue-400",
                    thermostatState.hvacStatus === 'idle' && "text-white/50"
                )}>
                    {thermostatState.hvacStatus === 'idle' ? 'Idle' :
                     thermostatState.hvacStatus === 'heating' ? 'Heating' : 'Cooling'}
                </div>
            </div>
        </div>
    );
};

export default NestCard;
