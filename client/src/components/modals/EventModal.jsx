import React, { useState } from 'react';
import { X, Clock, Calendar as CalendarIcon, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { API_BASE } from '../../lib/config';

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
    if (hour === undefined || hour === null) return '';
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
};

const EventModal = ({ event, familyMembers = [], onClose, onAssign }) => {
    const [assignedTo, setAssignedTo] = useState(event.member || 'Family');
    const [saving, setSaving] = useState(false);

    const handleAssign = async (memberName) => {
        setAssignedTo(memberName);
        if (onAssign) {
            setSaving(true);
            await onAssign(event.googleEventId || event.id, memberName);
            setSaving(false);
        }
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
                    {event.startHour !== undefined && (
                        <div className="flex items-center gap-3 text-white/60">
                            <Clock size={18} className="text-white/40" />
                            <span className="text-sm">
                                {formatTime(event.startHour)} - {formatTime(event.startHour + (event.duration || 1))}
                                <span className="text-white/40 ml-2">
                                    ({(event.duration || 1) >= 1 ? `${Math.floor(event.duration || 1)}h` : ''}
                                    {(event.duration || 1) % 1 > 0 ? ` ${Math.round(((event.duration || 1) % 1) * 60)}m` : ''})
                                </span>
                            </span>
                        </div>
                    )}

                    {/* Time string (for dashboard events) */}
                    {event.time && !event.startHour && (
                        <div className="flex items-center gap-3 text-white/60">
                            <Clock size={18} className="text-white/40" />
                            <span className="text-sm">{event.time}</span>
                        </div>
                    )}

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
                {familyMembers.length > 0 && (
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
                                <span className="animate-spin">⏳</span>
                                Saving...
                            </div>
                        )}
                    </div>
                )}

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

export default EventModal;
