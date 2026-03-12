import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchNestDevices,
    fetchNestState,
    setNestTemperature,
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
                className="card flex items-center justify-center gap-3 py-4 text-white/45 transition-colors hover:bg-white/5"
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
            <div className="card flex items-center justify-center gap-3 py-4 text-white/45">
                <Thermometer size={20} className="opacity-50 animate-pulse" />
                <span>Loading...</span>
            </div>
        );
    }

    return (
        <div
            className="card cursor-pointer px-5 py-4 transition-colors hover:bg-white/5"
            onClick={onOpenDetail}
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl flex-shrink-0", modeDisplay.bg)}>
                        <ModeIcon size={20} className={modeDisplay.color} />
                    </div>
                    <div>
                        <p className="text-[0.72rem] uppercase tracking-[0.18em] text-white/35">Home climate</p>
                        <p className="mt-1 text-lg font-semibold text-white/85">
                            {thermostatState.mode === 'OFF' ? 'System off' : thermostatState.mode.toLowerCase()}
                        </p>
                    </div>
                </div>

                <div className={cn(
                    "rounded-full border px-3 py-1 text-sm font-medium",
                    thermostatState.hvacStatus === 'heating' && "border-orange-500/20 bg-orange-500/10 text-orange-300",
                    thermostatState.hvacStatus === 'cooling' && "border-blue-500/20 bg-blue-500/10 text-blue-300",
                    thermostatState.hvacStatus === 'idle' && "border-white/10 bg-white/5 text-white/55",
                    thermostatState.mode === 'OFF' && "border-white/10 bg-white/5 text-white/55"
                )}>
                    {thermostatState.mode === 'OFF' ? 'Off' :
                     thermostatState.hvacStatus === 'idle' ? 'Idle' :
                     thermostatState.hvacStatus === 'heating' ? 'Heating' : 'Cooling'}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
                        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/35">Inside</p>
                        <p className="mt-2 text-3xl font-semibold">{thermostatState.currentTemp ?? '--'}°</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
                        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/35">Target</p>
                        <p className="mt-2 text-3xl font-semibold">{displayTargetTemp ?? '--'}°</p>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
                    <div>
                        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/35">Adjust target</p>
                        <p className="mt-1 text-sm text-white/55">Tap to change by one degree.</p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleTempChange(-1); }}
                            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            disabled={thermostatState.mode === 'OFF'}
                        >
                            <ChevronDown size={16} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleTempChange(1); }}
                            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            disabled={thermostatState.mode === 'OFF'}
                        >
                            <ChevronUp size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NestCard;
