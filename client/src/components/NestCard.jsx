import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchNestDevices,
    fetchNestState,
    setNestTemperature,
    setActiveDevice,
    setTargetTempOptimistic,
} from '../features/nestSlice';
import { Thermometer, Flame, Snowflake, Leaf, Power, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

const NestCard = ({ onOpenDetail }) => {
    const dispatch = useDispatch();
    const { devices, activeDeviceId, thermostatState, loading, connected } = useSelector((state) => state.nest);
    const [pendingTemp, setPendingTemp] = useState(null);
    const tempTimeoutRef = useRef(null);

    const displayTargetTemp = pendingTemp !== null ? pendingTemp : thermostatState.targetTemp;

    useEffect(() => {
        dispatch(fetchNestDevices());
    }, [dispatch]);

    useEffect(() => {
        if (!activeDeviceId) return;
        const fetchState = () => dispatch(fetchNestState(activeDeviceId));
        fetchState();
        const interval = setInterval(fetchState, 60000);
        return () => clearInterval(interval);
    }, [dispatch, activeDeviceId]);

    useEffect(() => {
        return () => {
            if (tempTimeoutRef.current) clearTimeout(tempTimeoutRef.current);
        };
    }, []);

    const handleTempChange = (delta) => {
        const newTemp = (pendingTemp !== null ? pendingTemp : thermostatState.targetTemp) + delta;
        const clampedTemp = Math.max(50, Math.min(90, newTemp));
        setPendingTemp(clampedTemp);
        dispatch(setTargetTempOptimistic(clampedTemp));

        if (!activeDeviceId) return;
        if (tempTimeoutRef.current) clearTimeout(tempTimeoutRef.current);

        tempTimeoutRef.current = setTimeout(() => {
            dispatch(setNestTemperature({ deviceId: activeDeviceId, temperature: clampedTemp }));
            setPendingTemp(null);
        }, 1000);
    };

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

    const modeDisplay = getModeDisplay();
    const ModeIcon = modeDisplay.icon;

    // Not connected state
    if (!connected && !loading) {
        return (
            <div
                className="card py-3 flex items-center justify-center gap-3 text-white/40 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={onOpenDetail}
            >
                <Thermometer size={20} className="opacity-50" />
                <span>Nest not connected</span>
            </div>
        );
    }

    // Loading state
    if (loading && devices.length === 0) {
        return (
            <div className="card py-3 flex items-center justify-center gap-3 text-white/40">
                <Thermometer size={20} className="opacity-50 animate-pulse" />
                <span>Loading...</span>
            </div>
        );
    }

    return (
        <div
            className="card py-3 px-4 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={onOpenDetail}
        >
            <div className="flex items-center gap-4">
                {/* Mode Icon */}
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", modeDisplay.bg)}>
                    <ModeIcon size={20} className={modeDisplay.color} />
                </div>

                {/* Current Temp */}
                <div className="flex-shrink-0">
                    <div className="text-3xl font-bold">{thermostatState.currentTemp ?? '--'}°</div>
                    <div className="text-white/40 text-xs">Inside</div>
                </div>

                {/* Divider */}
                <div className="h-10 w-px bg-white/10 flex-shrink-0"></div>

                {/* Target Temp with Controls */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleTempChange(-1); }}
                        className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        disabled={thermostatState.mode === 'OFF'}
                    >
                        <ChevronDown size={16} />
                    </button>
                    <div className="text-center min-w-[50px]">
                        <div className={cn(
                            "text-2xl font-bold",
                            thermostatState.hvacStatus === 'heating' && "text-orange-400",
                            thermostatState.hvacStatus === 'cooling' && "text-blue-400",
                            thermostatState.hvacStatus === 'idle' && "text-white/70"
                        )}>
                            {displayTargetTemp ?? '--'}°
                        </div>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleTempChange(1); }}
                        className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        disabled={thermostatState.mode === 'OFF'}
                    >
                        <ChevronUp size={16} />
                    </button>
                </div>

                {/* Status */}
                <div className={cn(
                    "ml-auto text-sm font-medium flex-shrink-0",
                    thermostatState.hvacStatus === 'heating' && "text-orange-400",
                    thermostatState.hvacStatus === 'cooling' && "text-blue-400",
                    thermostatState.hvacStatus === 'idle' && "text-white/40"
                )}>
                    {thermostatState.mode === 'OFF' ? 'Off' :
                     thermostatState.hvacStatus === 'idle' ? 'Idle' :
                     thermostatState.hvacStatus === 'heating' ? 'Heating' : 'Cooling'}
                </div>
            </div>
        </div>
    );
};

export default NestCard;
