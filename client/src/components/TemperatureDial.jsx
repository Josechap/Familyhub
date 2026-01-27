import React, { useRef, useState, useCallback } from 'react';
import { cn } from '../lib/utils';

const TemperatureDial = ({
    currentTemp,
    targetTemp,
    minTemp = 50,
    maxTemp = 90,
    mode = 'OFF',
    hvacStatus = 'idle',
    onChange,
    disabled = false,
}) => {
    const dialRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [localTarget, setLocalTarget] = useState(null);

    const displayTarget = localTarget !== null ? localTarget : targetTemp;

    // Convert temperature to angle (0° at bottom, going clockwise)
    const tempToAngle = (temp) => {
        const range = maxTemp - minTemp;
        const normalized = (temp - minTemp) / range;
        // Map to -135° to 135° (270° arc, starting from bottom-left)
        return -135 + normalized * 270;
    };

    // Convert angle to temperature
    const angleToTemp = (angle) => {
        // Clamp angle to valid range
        const clampedAngle = Math.max(-135, Math.min(135, angle));
        const normalized = (clampedAngle + 135) / 270;
        return Math.round(minTemp + normalized * (maxTemp - minTemp));
    };

    // Get angle from mouse/touch position
    const getAngleFromEvent = useCallback((e) => {
        if (!dialRef.current) return 0;

        const rect = dialRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
        // Adjust so 0° is at top, going clockwise
        return angle + 90;
    }, []);

    const handleStart = useCallback((e) => {
        if (disabled || mode === 'OFF') return;
        e.preventDefault();
        setIsDragging(true);
        const angle = getAngleFromEvent(e);
        const temp = angleToTemp(angle);
        setLocalTarget(temp);
    }, [disabled, mode, getAngleFromEvent]);

    const handleMove = useCallback((e) => {
        if (!isDragging || disabled) return;
        e.preventDefault();
        const angle = getAngleFromEvent(e);
        const temp = angleToTemp(angle);
        setLocalTarget(temp);
    }, [isDragging, disabled, getAngleFromEvent]);

    const handleEnd = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);
        if (localTarget !== null && onChange) {
            onChange(localTarget);
        }
        setLocalTarget(null);
    }, [isDragging, localTarget, onChange]);

    // Get color based on mode and status
    const getDialColor = () => {
        if (mode === 'OFF') return 'stroke-gray-600';
        if (hvacStatus === 'heating') return 'stroke-orange-500';
        if (hvacStatus === 'cooling') return 'stroke-blue-500';
        if (mode === 'ECO') return 'stroke-green-500';
        if (mode === 'HEAT') return 'stroke-orange-400';
        if (mode === 'COOL') return 'stroke-blue-400';
        return 'stroke-purple-500';
    };

    const getTextColor = () => {
        if (mode === 'OFF') return 'text-gray-500';
        if (hvacStatus === 'heating') return 'text-orange-500';
        if (hvacStatus === 'cooling') return 'text-blue-500';
        return 'text-white';
    };

    // SVG calculations
    const size = 280;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2 - 20;
    const center = size / 2;

    // Arc path for temperature range
    const createArc = (startAngle, endAngle) => {
        const startRad = (startAngle - 90) * (Math.PI / 180);
        const endRad = (endAngle - 90) * (Math.PI / 180);

        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);

        const largeArc = endAngle - startAngle > 180 ? 1 : 0;

        return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
    };

    // Target indicator position
    const targetAngle = tempToAngle(displayTarget || minTemp);
    const targetRad = (targetAngle - 90) * (Math.PI / 180);
    const targetX = center + radius * Math.cos(targetRad);
    const targetY = center + radius * Math.sin(targetRad);

    // Tick marks
    const ticks = [];
    for (let temp = minTemp; temp <= maxTemp; temp += 5) {
        const angle = tempToAngle(temp);
        const rad = (angle - 90) * (Math.PI / 180);
        const innerRadius = radius - 15;
        const outerRadius = radius - 8;

        const x1 = center + innerRadius * Math.cos(rad);
        const y1 = center + innerRadius * Math.sin(rad);
        const x2 = center + outerRadius * Math.cos(rad);
        const y2 = center + outerRadius * Math.sin(rad);

        const isMinor = temp % 10 !== 0;

        ticks.push(
            <line
                key={temp}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={cn(
                    "transition-colors",
                    isMinor ? "stroke-white/20" : "stroke-white/40"
                )}
                strokeWidth={isMinor ? 1 : 2}
            />
        );
    }

    return (
        <div className="relative flex items-center justify-center">
            <svg
                ref={dialRef}
                width={size}
                height={size}
                className={cn(
                    "select-none",
                    !disabled && mode !== 'OFF' && "cursor-pointer"
                )}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
            >
                {/* Background arc */}
                <path
                    d={createArc(-135, 135)}
                    fill="none"
                    className="stroke-white/10"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />

                {/* Active arc (from min to target) */}
                {displayTarget && mode !== 'OFF' && (
                    <path
                        d={createArc(-135, targetAngle)}
                        fill="none"
                        className={cn("transition-colors", getDialColor())}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />
                )}

                {/* Tick marks */}
                {ticks}

                {/* Target indicator */}
                {displayTarget && mode !== 'OFF' && (
                    <circle
                        cx={targetX}
                        cy={targetY}
                        r={isDragging ? 14 : 10}
                        className={cn(
                            "fill-white transition-all",
                            isDragging && "drop-shadow-lg"
                        )}
                    />
                )}

                {/* Center display */}
                <g>
                    {/* Current temperature */}
                    <text
                        x={center}
                        y={center - 15}
                        textAnchor="middle"
                        className="fill-white/50 text-sm font-medium"
                        style={{ fontSize: '14px' }}
                    >
                        Current
                    </text>
                    <text
                        x={center}
                        y={center + 25}
                        textAnchor="middle"
                        className="fill-white font-bold"
                        style={{ fontSize: '56px' }}
                    >
                        {currentTemp ?? '--'}°
                    </text>

                    {/* Target temperature */}
                    <text
                        x={center}
                        y={center + 60}
                        textAnchor="middle"
                        className={cn("font-semibold transition-colors", getTextColor())}
                        style={{ fontSize: '20px' }}
                    >
                        {mode === 'OFF' ? 'Off' : `Set to ${displayTarget ?? '--'}°`}
                    </text>
                </g>
            </svg>
        </div>
    );
};

export default TemperatureDial;
