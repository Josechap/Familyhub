import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronLeft, ChevronRight, Loader2, X, Clock, Calendar as CalendarIcon, User, MapPin } from 'lucide-react';
import { fetchCalendarData, setSelectedDate } from '../features/calendarSlice';
import { cn } from '../lib/utils';

const HOUR_HEIGHT = 60; // pixels per hour
const DAYS_TO_SHOW = 8;

// Format time for display
const formatTime = (hour) => {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
};

// Event Detail Modal
const EventModal = ({ event, familyMembers, onClose, onAssign }) => {
    const [assignedTo, setAssignedTo] = useState(event.member || 'Family');
    const [saving, setSaving] = useState(false);

    const handleAssign = async (memberName) => {
        setAssignedTo(memberName);
        setSaving(true);
        await onAssign(event.googleEventId, memberName);
        setSaving(false);
    };

    const colorMap = {
        'pastel-blue': '#A7C7E7',
        'pastel-pink': '#F4C2C2',
        'pastel-green': '#C1E1C1',
        'pastel-yellow': '#FFFACD',
        'pastel-purple': '#E6E6FA',
        'google-blue': '#4285F4',
    };

    const eventDate = new Date(event.date + 'T12:00:00');
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8" onClick={onClose}>
            <div
                className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with color bar */}
                <div
                    className="h-2 rounded-full mb-4"
                    style={{ backgroundColor: colorMap[event.color] || '#4285F4' }}
                />

                {/* Close button */}
                <div className="flex items-start justify-between mb-4">
                    <h2 className="text-2xl font-serif font-bold text-editorial-text">{event.title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Event Details */}
                <div className="space-y-4 mb-6">
                    {/* Date */}
                    <div className="flex items-center gap-3 text-gray-600">
                        <CalendarIcon size={20} className="text-gray-400" />
                        <span>{formattedDate}</span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-3 text-gray-600">
                        <Clock size={20} className="text-gray-400" />
                        <span>
                            {formatTime(event.startHour)} - {formatTime(event.startHour + event.duration)}
                            <span className="text-gray-400 ml-2">
                                ({event.duration >= 1 ? `${Math.floor(event.duration)}h` : ''}
                                {event.duration % 1 > 0 ? ` ${Math.round((event.duration % 1) * 60)}m` : ''})
                            </span>
                        </span>
                    </div>

                    {/* Source */}
                    {event.source === 'google' && (
                        <div className="flex items-center gap-3 text-gray-600">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span>Google Calendar</span>
                        </div>
                    )}
                </div>

                {/* Assignment Section */}
                <div className="border-t border-gray-100 pt-4">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                        <User size={16} className="inline mr-2" />
                        Assigned To
                    </label>
                    <select
                        value={assignedTo}
                        onChange={(e) => handleAssign(e.target.value)}
                        disabled={saving}
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-blue border border-gray-200"
                    >
                        <option value="Family">👨‍👩‍👧‍👦 Family (Everyone)</option>
                        {familyMembers.map(member => (
                            <option key={member.id} value={member.name}>
                                {member.name}
                            </option>
                        ))}
                    </select>
                    {saving && (
                        <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin" />
                            Saving...
                        </div>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full mt-6 py-3 bg-editorial-text text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                >
                    Done
                </button>
            </div>
        </div>
    );
};

const Calendar = () => {
    const dispatch = useDispatch();
    const { events, dinnerSlots, selectedDate, familyMembers, loading } = useSelector((state) => state.calendar);
    const scrollRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [startDayOffset, setStartDayOffset] = useState(0); // How many days from today to start
    const [selectedEvent, setSelectedEvent] = useState(null);

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
        'pastel-yellow': '#FFFACD',
        'pastel-purple': '#E6E6FA',
        'google-blue': '#4285F4',
    };

    const timeIndicatorPos = getTimeIndicatorPosition();

    // Handle assigning event to member
    const handleAssignEvent = async (eventId, memberName) => {
        await fetch('http://localhost:3001/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [`calendarEventMapping_${eventId}`]: memberName || '' }),
        });
        // Refresh calendar data
        dispatch(fetchCalendarData());
    };

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
                                                    onClick={() => setSelectedEvent(event)}
                                                    className="absolute rounded-lg px-2 py-1 text-xs font-medium overflow-hidden z-10 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
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
                                                            {formatTime(event.startHour)}
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

            {/* Event Detail Modal */}
            {selectedEvent && (
                <EventModal
                    event={selectedEvent}
                    familyMembers={familyMembers}
                    onClose={() => setSelectedEvent(null)}
                    onAssign={handleAssignEvent}
                />
            )}
        </div>
    );
};

export default Calendar;
