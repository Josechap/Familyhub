import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon } from 'lucide-react';
import HomeCard from './HomeCard';

const CalendarCard = () => {
    const navigate = useNavigate();
    const { upcomingEvents } = useSelector((state) => state.dashboard);
    const events = upcomingEvents.slice(0, 3);
    const remaining = Math.max(upcomingEvents.length - events.length, 0);

    return (
        <HomeCard
            icon={CalendarIcon}
            kicker="Calendar"
            tone="sky"
            onClick={() => navigate('/calendar')}
        >
            {events.length === 0 ? (
                <p className="text-lg font-medium text-white/60">Nothing on the calendar</p>
            ) : (
                <div className="space-y-2">
                    {events.map((event, idx) => (
                        <div
                            key={event.id || idx}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2.5"
                        >
                            <p className="truncate text-base font-semibold">{event.title}</p>
                            {event.time && (
                                <span className="flex-shrink-0 text-sm text-white/55">{event.time}</span>
                            )}
                        </div>
                    ))}
                    {remaining > 0 && (
                        <p className="pl-1 text-sm text-white/45">+{remaining} more today</p>
                    )}
                </div>
            )}
        </HomeCard>
    );
};

export default CalendarCard;
