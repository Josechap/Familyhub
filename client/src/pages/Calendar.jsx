import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronLeft, ChevronRight, Loader2, X, Clock, Calendar as CalendarIcon, User, Utensils, MapPin } from 'lucide-react';
import { fetchCalendarData } from '../features/calendarSlice';
import { cn } from '../lib/utils';
import { API_BASE } from '../lib/config';

// Family member colors mapping
const familyColors = {
    'pastel-blue': { bg: 'bg-family-blue', text: 'text-family-blue', light: 'bg-family-blue/20', border: 'border-family-blue' },
    'pastel-pink': { bg: 'bg-family-pink', text: 'text-family-pink', light: 'bg-family-pink/20', border: 'border-family-pink' },
    'pastel-green': { bg: 'bg-family-green', text: 'text-family-green', light: 'bg-family-green/20', border: 'border-family-green' },
    'pastel-purple': { bg: 'bg-family-purple', text: 'text-family-purple', light: 'bg-family-purple/20', border: 'border-family-purple' },
    'pastel-yellow': { bg: 'bg-family-orange', text: 'text-family-orange', light: 'bg-family-orange/20', border: 'border-family-orange' },
    'pastel-orange': { bg: 'bg-family-orange', text: 'text-family-orange', light: 'bg-family-orange/20', border: 'border-family-orange' },
};

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

    const eventDate = new Date(event.date + 'T12:00:00');
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    const colors = familyColors[event.color] || familyColors['pastel-blue'];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="card w-full max-w-md animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with color bar */}
                <div className={cn("h-1 rounded-full mb-4", colors.bg)} />

                {/* Close button */}
                <div className="flex items-start justify-between mb-4">
                    <h2 className="text-xl font-semibold pr-4">{event.title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors touch-target"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Event Details */}
                <div className="space-y-3 mb-6">
                    {/* Date */}
                    <div className="flex items-center gap-3 text-white/60">
                        <CalendarIcon size={18} className="text-white/40" />
                        <span className="text-sm">{formattedDate}</span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-3 text-white/60">
                        <Clock size={18} className="text-white/40" />
                        <span className="text-sm">
                            {formatTime(event.startHour)} - {formatTime(event.startHour + event.duration)}
                            <span className="text-white/40 ml-2">
                                ({event.duration >= 1 ? `${Math.floor(event.duration)}h` : ''}
                                {event.duration % 1 > 0 ? ` ${Math.round((event.duration % 1) * 60)}m` : ''})
                            </span>
                        </span>
                    </div>

                    {/* Source */}
                    {event.source === 'google' && (
                        <div className="flex items-center gap-3 text-white/60">
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="text-sm">Google Calendar</span>
                        </div>
                    )}
                </div>

                {/* Assignment Section */}
                <div className="border-t border-white/10 pt-4">
                    <label className="block text-sm font-medium text-white/60 mb-2">
                        <User size={14} className="inline mr-2" />
                        Assigned To
                    </label>
                    <select
                        value={assignedTo}
                        onChange={(e) => handleAssign(e.target.value)}
                        disabled={saving}
                        className="w-full px-4 py-3 bg-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary border border-white/10 text-white"
                    >
                        <option value="Family">Family (Everyone)</option>
                        {familyMembers.map(member => (
                            <option key={member.id} value={member.name}>
                                {member.name}
                            </option>
                        ))}
                    </select>
                    {saving && (
                        <div className="text-xs text-white/40 mt-2 flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin" />
                            Saving...
                        </div>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full mt-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/80 transition-colors touch-target"
                >
                    Done
                </button>
            </div>
        </div>
    );
};

const Calendar = () => {
    const dispatch = useDispatch();
    const { events, dinnerSlots, familyMembers, loading } = useSelector((state) => state.calendar);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [multiDayView, setMultiDayView] = useState(false);
    const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, 1 = next week, etc.

    // Fetch calendar data on mount
    useEffect(() => {
        dispatch(fetchCalendarData());
    }, [dispatch]);

    // Generate array of dates (7 days for current week view)
    const getDates = () => {
        const dates = [];
        const today = new Date();
        const startOffset = weekOffset * 7;
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + startOffset + i);
            const dayIndex = startOffset + i;
            dates.push({
                date: date.toISOString().split('T')[0],
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                dayNum: date.getDate(),
                month: date.toLocaleDateString('en-US', { month: 'short' }),
                fullDay: date.toLocaleDateString('en-US', { weekday: 'long' }),
                isToday: dayIndex === 0,
            });
        }
        return dates;
    };

    const dates = getDates();

    // Get events for selected date
    const getEventsForDate = (date) => {
        return events.filter((e) => e.date === date).sort((a, b) => a.startHour - b.startHour);
    };

    // Get dinner for a specific date
    const getDinner = (date) => {
        return dinnerSlots.find((d) => d.date === date);
    };

    // Handle assigning event to member
    const handleAssignEvent = async (eventId, memberName) => {
        await fetch(`${API_BASE}/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [`calendarEventMapping_${eventId}`]: memberName || '' }),
        });
        dispatch(fetchCalendarData());
    };

    const selectedDateData = dates[selectedDayIndex];
    const dayEvents = getEventsForDate(selectedDateData.date);
    const dinner = getDinner(selectedDateData.date);

    // Loading state
    if (loading && events.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="animate-spin text-white/40" size={48} />
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col gap-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-2xl font-semibold">Calendar</h1>
                <div className="flex items-center gap-2">
                    {/* Week navigation */}
                    <button
                        onClick={() => { setWeekOffset(Math.max(0, weekOffset - 1)); setSelectedDayIndex(0); }}
                        disabled={weekOffset === 0}
                        className={cn(
                            "p-2 rounded-xl transition-colors touch-target",
                            weekOffset === 0
                                ? "text-white/20 cursor-not-allowed"
                                : "hover:bg-white/10 text-white"
                        )}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <span className="text-sm text-white/60 min-w-[80px] text-center">
                        {weekOffset === 0 ? 'This Week' : weekOffset === 1 ? 'Next Week' : `Week +${weekOffset}`}
                    </span>
                    <button
                        onClick={() => { setWeekOffset(Math.min(3, weekOffset + 1)); setSelectedDayIndex(0); }}
                        disabled={weekOffset === 3}
                        className={cn(
                            "p-2 rounded-xl transition-colors touch-target",
                            weekOffset === 3
                                ? "text-white/20 cursor-not-allowed"
                                : "hover:bg-white/10 text-white"
                        )}
                    >
                        <ChevronRight size={24} />
                    </button>
                    <button
                        onClick={() => setMultiDayView(!multiDayView)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium transition-all touch-target ml-2",
                            multiDayView
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "bg-white/10 text-white/60 hover:bg-white/20"
                        )}
                    >
                        {multiDayView ? 'Week View' : 'Day View'}
                    </button>
                </div>
            </div>

            {!multiDayView ? (
                <>
                    {/* Day Selector Pills - Single Day View */}
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                        {dates.map((d, idx) => (
                            <button
                                key={d.date}
                                onClick={() => setSelectedDayIndex(idx)}
                                className={cn(
                                    "flex flex-col items-center px-5 py-3 rounded-2xl transition-all min-w-[80px] touch-target",
                                    idx === selectedDayIndex
                                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                                        : d.isToday
                                            ? "bg-primary/20 text-primary border border-primary/30"
                                            : "bg-white/5 text-white/60 hover:bg-white/10"
                                )}
                            >
                                <span className="text-xs font-medium uppercase tracking-wide opacity-80">{d.dayName}</span>
                                <span className="text-2xl font-bold mt-1">{d.dayNum}</span>
                            </button>
                        ))}
                    </div>

                    {/* Selected Day Header */}
                    <div className="card">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                                selectedDateData.isToday ? "bg-primary" : "bg-white/10"
                            )}>
                                <CalendarIcon size={28} className={selectedDateData.isToday ? "text-white" : "text-white/60"} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">{selectedDateData.fullDay}</h2>
                                <p className="text-white/50">
                                    {selectedDateData.month} {selectedDateData.dayNum}
                                    {selectedDateData.isToday && <span className="text-primary ml-2 font-medium">• Today</span>}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Agenda View */}
                    <div className="flex-1 overflow-y-auto space-y-3 touch-scroll hide-scrollbar">
                        {/* Dinner Card */}
                        {dinner && (
                            <div className="card bg-gradient-to-br from-success/20 to-success/5 border border-success/30 animate-slide-up">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center">
                                        <Utensils size={24} className="text-success" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-success font-semibold uppercase tracking-wide mb-1">Tonight's Dinner</p>
                                        <p className="font-semibold text-lg">{dinner.recipe}</p>
                                    </div>
                                    <span className="text-4xl">{dinner.emoji || '🍽️'}</span>
                                </div>
                            </div>
                        )}

                        {/* Events */}
                        {dayEvents.length === 0 && !dinner ? (
                            <div className="card text-center py-16">
                                <CalendarIcon size={56} className="mx-auto text-white/10 mb-4" />
                                <p className="text-white/40 text-lg font-medium">No events scheduled</p>
                                <p className="text-white/30 text-sm mt-2">Enjoy your free day!</p>
                            </div>
                        ) : (
                            dayEvents.map((event, idx) => {
                                const members = event.members || [event.member];
                                const colorKey = event.colors?.[0] || event.color || 'pastel-blue';
                                const colors = familyColors[colorKey] || familyColors['pastel-blue'];

                                return (
                                    <div
                                        key={event.id}
                                        onClick={() => setSelectedEvent(event)}
                                        className={cn(
                                            "card cursor-pointer hover:bg-white/10 transition-all animate-slide-up border-l-4",
                                            colors.border
                                        )}
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Time */}
                                            <div className="text-center min-w-[70px]">
                                                <p className="text-xl font-bold">{formatTime(event.startHour).split(' ')[0]}</p>
                                                <p className="text-xs text-white/40 uppercase tracking-wide">{formatTime(event.startHour).split(' ')[1]}</p>
                                                <div className="mt-2 px-2 py-1 bg-white/5 rounded-lg">
                                                    <p className="text-xs text-white/50">
                                                        {Math.floor(event.duration)}h {event.duration % 1 > 0 ? `${Math.round((event.duration % 1) * 60)}m` : ''}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Event Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-lg mb-1">{event.title}</p>
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    {members.length > 0 && members[0] !== 'Family' && (
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white", colors.bg)}>
                                                                {members[0]?.[0]}
                                                            </div>
                                                            <span className="text-white/50 text-sm">{members.join(' & ')}</span>
                                                        </div>
                                                    )}
                                                    {event.source === 'google' && (
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                            </svg>
                                                            <span className="text-xs text-white/40">Google</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            ) : (
                // Multi-Day Grid View
                <div className="flex-1 overflow-x-auto overflow-y-hidden touch-scroll hide-scrollbar">
                    <div className="flex gap-4 h-full pb-4">
                        {dates.map((day) => {
                            const dayEventsData = getEventsForDate(day.date);
                            const dayDinner = getDinner(day.date);

                            return (
                                <div key={day.date} className="flex flex-col gap-3 min-w-[180px] max-w-[220px]">
                                    {/* Day Header */}
                                    <div className={cn(
                                        "card text-center py-4 transition-all",
                                        day.isToday ? "ring-2 ring-primary bg-primary/10" : ""
                                    )}>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-white/50 mb-1">{day.dayName}</p>
                                        <p className={cn(
                                            "text-3xl font-bold",
                                            day.isToday ? "text-primary" : "text-white"
                                        )}>
                                            {day.dayNum}
                                        </p>
                                        <p className="text-xs text-white/40 mt-1">{day.month}</p>
                                    </div>

                                    {/* Dinner */}
                                    {dayDinner && (
                                        <div className="card bg-success/10 border border-success/30 p-3 text-center">
                                            <div className="flex items-center justify-center gap-2 mb-1">
                                                <Utensils size={14} className="text-success" />
                                                <p className="text-xs text-success font-semibold uppercase">Dinner</p>
                                            </div>
                                            <p className="text-sm font-medium line-clamp-2">{dayDinner.recipe}</p>
                                        </div>
                                    )}

                                    {/* Events */}
                                    <div className="space-y-2 flex-1 overflow-y-auto max-h-[400px] hide-scrollbar">
                                        {dayEventsData.length === 0 ? (
                                            <div className="card p-4 text-center">
                                                <p className="text-xs text-white/30">No events</p>
                                            </div>
                                        ) : (
                                            <>
                                                {dayEventsData.slice(0, 5).map((event) => {
                                                    const colorKey = event.colors?.[0] || event.color || 'pastel-blue';
                                                    const colors = familyColors[colorKey] || familyColors['pastel-blue'];

                                                    return (
                                                        <div
                                                            key={event.id}
                                                            onClick={() => setSelectedEvent(event)}
                                                            className={cn(
                                                                "card p-3 cursor-pointer hover:bg-white/10 transition-all border-l-2",
                                                                colors.border
                                                            )}
                                                        >
                                                            <p className="text-sm font-semibold line-clamp-2 mb-1">{event.title}</p>
                                                            <p className="text-xs text-white/50">
                                                                {formatTime(event.startHour).split(' ')[0]} {formatTime(event.startHour).split(' ')[1]}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                                {dayEventsData.length > 5 && (
                                                    <p className="text-xs text-white/40 text-center py-2">+{dayEventsData.length - 5} more</p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

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
