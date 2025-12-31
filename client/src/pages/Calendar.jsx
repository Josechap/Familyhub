import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { fetchCalendarData, setSelectedDate } from '../features/calendarSlice';
import { cn } from '../lib/utils';

const HOUR_HEIGHT = 60; // pixels per hour
const DAYS_TO_SHOW = 8;

const Calendar = () => {
    const dispatch = useDispatch();
    const { events, dinnerSlots, selectedDate, familyMembers, loading } = useSelector((state) => state.calendar);
    const scrollRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [startDayOffset, setStartDayOffset] = useState(0); // How many days from today to start

    // Fetch calendar data on mount
    useEffect(() => {
        dispatch(fetchCalendarData());
    }, [dispatch]);

    // Update current time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Generate array of dates starting from offset
    const getDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = startDayOffset; i < startDayOffset + DAYS_TO_SHOW; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push({
                date: date.toISOString().split('T')[0],
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                dayNum: date.getDate(),
                month: date.toLocaleDateString('en-US', { month: 'short' }),
                isToday: i === 0,
            });
        }
        return dates;
    };

    const dates = getDates();

    // Navigation handlers
    const goBack = () => {
        if (startDayOffset > 0) {
            setStartDayOffset(startDayOffset - DAYS_TO_SHOW);
        }
    };

    const goForward = () => {
        setStartDayOffset(startDayOffset + DAYS_TO_SHOW);
    };

    const goToToday = () => {
        setStartDayOffset(0);
    };

    // Hours from 6am to 10pm
    const hours = Array.from({ length: 17 }, (_, i) => i + 6);

    // Get events for a specific date
    const getEventsForDate = (date) => {
        return events.filter((e) => e.date === date);
    };

    // Get dinner for a specific date
    const getDinner = (date) => {
        return dinnerSlots.find((d) => d.date === date);
    };

    // Calculate time indicator position (pixels from top)
    const getTimeIndicatorPosition = () => {
        const hour = currentTime.getHours();
        const minutes = currentTime.getMinutes();
        if (hour < 6 || hour > 22) return null;
        const offsetHours = hour - 6 + (minutes / 60);
        return offsetHours * HOUR_HEIGHT;
    };

    // Scroll to current time on mount
    useEffect(() => {
        if (scrollRef.current) {
            const currentHour = new Date().getHours();
            const targetRow = Math.max(0, currentHour - 6 - 2);
            scrollRef.current.scrollTop = targetRow * HOUR_HEIGHT;
        }
    }, []);

    // Color mapping for inline styles
    const colorMap = {
        'pastel-blue': '#A7C7E7',
        'pastel-pink': '#F4C2C2',
        'pastel-green': '#C1E1C1',
    };

    const timeIndicatorPos = getTimeIndicatorPosition();

    return (
        <div className="h-full w-full flex flex-col">
            {/* Header with navigation */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-serif">Calendar</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={goBack}
                        disabled={startDayOffset === 0}
                        className={cn(
                            "p-2 rounded-xl transition-colors",
                            startDayOffset === 0
                                ? "text-gray-300 cursor-not-allowed"
                                : "hover:bg-gray-100 text-editorial-text"
                        )}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={goToToday}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                            startDayOffset === 0
                                ? "bg-editorial-text text-white"
                                : "hover:bg-gray-100 text-editorial-text border border-gray-200"
                        )}
                    >
                        Today
                    </button>
                    <button
                        onClick={goForward}
                        className="p-2 rounded-xl hover:bg-gray-100 text-editorial-text transition-colors"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>

            {/* Date Header */}
            <div className="flex bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <div className="w-16 shrink-0" /> {/* Spacer for time column */}
                {dates.map((d) => (
                    <div
                        key={d.date}
                        onClick={() => dispatch(setSelectedDate(d.date))}
                        className={cn(
                            "flex-1 text-center cursor-pointer py-2 rounded-xl transition-colors",
                            d.date === selectedDate && "bg-editorial-text text-white",
                            d.isToday && d.date !== selectedDate && "bg-pastel-blue/20",
                            !d.isToday && d.date !== selectedDate && "hover:bg-gray-100"
                        )}
                    >
                        <div className="text-xs font-medium opacity-60">{d.month}</div>
                        <div className="text-sm font-medium">{d.dayName}</div>
                        <div className="text-2xl font-bold">{d.dayNum}</div>
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
                {/* Dinner Row */}
                <div className="flex border-b border-gray-100 bg-pastel-green/10">
                    <div className="w-16 shrink-0 p-2 text-sm font-medium text-gray-400 flex items-center justify-center">
                        🍽️
                    </div>
                    {dates.map((d) => {
                        const dinner = getDinner(d.date);
                        return (
                            <div
                                key={`dinner-${d.date}`}
                                className="flex-1 p-2 border-l border-gray-100"
                            >
                                {dinner && (
                                    <div className="bg-pastel-green/30 rounded-lg px-2 py-1 text-sm font-medium truncate">
                                        {dinner.recipe}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Time Grid */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
                    <div className="flex" style={{ minHeight: hours.length * HOUR_HEIGHT }}>
                        {/* Time labels column */}
                        <div className="w-16 shrink-0 relative">
                            {hours.map((hour) => (
                                <div
                                    key={hour}
                                    className="absolute w-full p-2 text-sm font-medium text-gray-400 flex items-start justify-center"
                                    style={{ top: (hour - 6) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                                >
                                    {hour}:00
                                </div>
                            ))}
                        </div>

                        {/* Day columns with events */}
                        {dates.map((d) => {
                            const dayEvents = getEventsForDate(d.date);

                            // Group overlapping events
                            const sortedEvents = [...dayEvents].sort((a, b) => a.startHour - b.startHour);
                            const eventColumns = [];

                            sortedEvents.forEach((event) => {
                                let placed = false;
                                for (let col = 0; col < eventColumns.length; col++) {
                                    const lastInCol = eventColumns[col][eventColumns[col].length - 1];
                                    if (lastInCol.startHour + lastInCol.duration <= event.startHour) {
                                        eventColumns[col].push(event);
                                        placed = true;
                                        break;
                                    }
                                }
                                if (!placed) {
                                    eventColumns.push([event]);
                                }
                            });

                            const numColumns = eventColumns.length || 1;

                            return (
                                <div
                                    key={d.date}
                                    className="flex-1 border-l border-gray-100 relative"
                                    style={{ minHeight: hours.length * HOUR_HEIGHT }}
                                >
                                    {/* Hour grid lines */}
                                    {hours.map((hour) => (
                                        <div
                                            key={hour}
                                            className="absolute w-full border-b border-gray-50"
                                            style={{ top: (hour - 6) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                                        />
                                    ))}

                                    {/* Current time indicator (only on today's column) */}
                                    {d.isToday && timeIndicatorPos !== null && (
                                        <div
                                            className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
                                            style={{ top: timeIndicatorPos }}
                                        >
                                            <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 shadow-lg animate-pulse" />
                                            <div className="flex-1 h-1 bg-red-500 shadow-md" />
                                        </div>
                                    )}

                                    {/* Events */}
                                    {eventColumns.map((column, colIdx) =>
                                        column.map((event) => {
                                            const members = event.members || [event.member];
                                            const colors = event.colors || [event.color];
                                            const isMultiMember = members.length > 1;

                                            let bgStyle = {};
                                            if (isMultiMember && colors.length > 1) {
                                                const gradientColors = colors.map(c => colorMap[c] || '#A7C7E7');
                                                bgStyle = {
                                                    background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
                                                };
                                            } else {
                                                bgStyle = {
                                                    backgroundColor: colorMap[colors[0]] || '#A7C7E7',
                                                };
                                            }

                                            const top = (event.startHour - 6) * HOUR_HEIGHT + 2;
                                            const height = event.duration * HOUR_HEIGHT - 4;
                                            const width = `calc(${100 / numColumns}% - 4px)`;
                                            const left = `calc(${(colIdx / numColumns) * 100}% + 2px)`;

                                            return (
                                                <div
                                                    key={event.id}
                                                    className="absolute rounded-lg px-2 py-1 text-xs font-medium overflow-hidden z-10 shadow-sm"
                                                    style={{
                                                        top,
                                                        height,
                                                        width,
                                                        left,
                                                        ...bgStyle,
                                                    }}
                                                >
                                                    <div className="font-bold truncate text-editorial-text">{event.title}</div>
                                                    <div className="text-xs opacity-70 truncate text-editorial-text">
                                                        {members.join(' & ')}
                                                    </div>
                                                    {event.duration >= 1 && (
                                                        <div className="text-xs opacity-50 text-editorial-text">
                                                            {event.startHour}:00 - {event.startHour + event.duration}:00
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex gap-4 justify-center">
                {familyMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-2">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: colorMap[member.color] }}
                        />
                        <span className="text-sm font-medium">{member.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Calendar;
