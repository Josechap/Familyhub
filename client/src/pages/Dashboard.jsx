import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useClock } from '../hooks/useClock';
import { cn } from '../lib/utils';
import { fetchDashboardData, setScoreboard, setWeather } from '../features/dashboardSlice';
import { fetchSettings } from '../features/settingsSlice';
import { fetchSonosDevices, fetchSonosState } from '../features/sonosSlice';
import { Music, Calendar, Utensils, Play, SkipForward, Star, Trophy } from 'lucide-react';
import api from '../lib/api';
import NestCard from '../components/NestCard';
import NestDetailView from '../components/NestDetailView';
import EventModal from '../components/modals/EventModal';
import MealModal from '../components/modals/MealModal';

// Family member colors mapping
const familyColors = {
    'pastel-blue': 'bg-family-blue',
    'pastel-pink': 'bg-family-pink',
    'pastel-green': 'bg-family-green',
    'pastel-purple': 'bg-family-purple',
    'pastel-yellow': 'bg-family-orange',
    'pastel-orange': 'bg-family-orange',
};

// Member color dots for events
const getMemberColor = (memberName, familyMembers) => {
    const member = familyMembers.find(m => m.name === memberName);
    if (!member) return 'bg-white/30';
    return familyColors[member.color] || 'bg-family-blue';
};

// Format date for display
const formatEventDate = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (dateStr === today) return 'Today';
    if (dateStr === tomorrowStr) return 'Tomorrow';

    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const Dashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { time, date, hours } = useClock();
    const { weather, upcomingEvents, todayTasks, todayMeals, clothing } = useSelector((state) => state.dashboard);
    const familyMembers = useSelector((state) => state.settings.familyMembers);
    const { playerState, activeDeviceIp } = useSelector((state) => state.sonos);
    const [weeklyStats, setWeeklyStats] = useState({ stats: [] });
    const [showNestDetail, setShowNestDetail] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedMeal, setSelectedMeal] = useState(null);

    // Dynamic greeting based on time
    const getGreeting = () => {
        if (hours < 5) return 'Good Night';
        if (hours < 12) return 'Good Morning';
        if (hours < 17) return 'Good Afternoon';
        if (hours < 21) return 'Good Evening';
        return 'Good Night';
    };

    // Fetch dashboard data on mount
    useEffect(() => {
        dispatch(fetchDashboardData());
        dispatch(fetchSettings());
        dispatch(fetchSonosDevices());
        api.getWeeklyTaskStats().then(setWeeklyStats).catch(console.error);
        // Fetch weather
        api.getWeather().then(weather => {
            if (weather) dispatch(setWeather(weather));
        }).catch(console.error);
    }, [dispatch]);

    // Poll Sonos state every 5 seconds when device is active
    useEffect(() => {
        if (!activeDeviceIp) return;
        dispatch(fetchSonosState(activeDeviceIp));
        const interval = setInterval(() => {
            dispatch(fetchSonosState(activeDeviceIp));
        }, 5000);
        return () => clearInterval(interval);
    }, [dispatch, activeDeviceIp]);

    // Update scoreboard when family members change
    useEffect(() => {
        if (familyMembers.length > 0) {
            const sorted = [...familyMembers].sort((a, b) => b.points - a.points);
            dispatch(setScoreboard(sorted));
        }
    }, [dispatch, familyMembers]);

    // Get weekly stats for a member
    const getMemberWeeklyStats = (memberId) => {
        const memberStats = weeklyStats.stats?.find(s => s.id === memberId);
        return memberStats || { weeklyTasksCompleted: 0, weeklyPointsEarned: 0, totalPoints: 0 };
    };

    // Sort family members by weekly tasks for scoreboard
    const sortedMembers = [...familyMembers].sort((a, b) => {
        const aStats = getMemberWeeklyStats(a.id);
        const bStats = getMemberWeeklyStats(b.id);
        return bStats.weeklyTasksCompleted - aStats.weeklyTasksCompleted;
    });

    return (
        <div className="h-full w-full flex gap-4 animate-fade-in overflow-hidden">
            {/* LEFT COLUMN - Upcoming Events (65% width) */}
            <div className="w-[65%] flex-shrink-0 flex flex-col gap-3 min-w-0">
                <div className="card flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <Calendar size={28} className="text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-semibold">Upcoming Events</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 hide-scrollbar">
                        {upcomingEvents.length > 0 ? (
                            upcomingEvents.map((event, idx) => (
                                <button
                                    key={event.id || idx}
                                    onClick={() => setSelectedEvent(event)}
                                    className={cn(
                                        "w-full flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer hover:bg-white/10",
                                        event.isToday ? "bg-purple-500/20" : "bg-white/5"
                                    )}
                                >
                                    {/* Color dot for family member */}
                                    <div className={cn(
                                        "w-4 h-4 rounded-full flex-shrink-0 mt-2",
                                        getMemberColor(event.member, familyMembers)
                                    )} />
                                    {/* Date badge */}
                                    <div className={cn(
                                        "flex-shrink-0 w-28 text-center rounded-lg py-3 px-3",
                                        event.isToday ? "bg-purple-500/30 text-purple-300" : "bg-white/10 text-white/60"
                                    )}>
                                        <div className="text-lg font-semibold">{formatEventDate(event.date)}</div>
                                    </div>
                                    {/* Event details */}
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="font-semibold text-white truncate text-2xl">{event.title}</p>
                                        <p className="text-white/50 text-lg">{event.time}</p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-white/40">
                                <p>No upcoming events</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Today's Meals */}
                <div className="card">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                            <Utensils size={22} className="text-success" />
                        </div>
                        <span className="font-semibold text-xl">Today's Meals</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { key: 'breakfast', emoji: '🍳', label: 'Breakfast', color: 'text-yellow-400' },
                            { key: 'lunch', emoji: '🥗', label: 'Lunch', color: 'text-green-400' },
                            { key: 'dinner', emoji: '🍽️', label: 'Dinner', color: 'text-blue-400' },
                            { key: 'snack', emoji: '🍎', label: 'Snack', color: 'text-pink-400' },
                        ].map(meal => (
                            <button
                                key={meal.key}
                                onClick={() => todayMeals?.[meal.key] ? setSelectedMeal({ meal: todayMeals[meal.key], type: meal.key }) : navigate('/meals')}
                                className="text-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <span className="text-3xl">{todayMeals?.[meal.key]?.recipeEmoji || meal.emoji}</span>
                                <p className="text-base text-white/50 truncate mt-2">
                                    {todayMeals?.[meal.key]?.recipeTitle || 'Not set'}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN - Clock, Sonos (25%), Scoreboard (50%) */}
            <div className="flex-1 flex flex-col gap-3">
                {/* Time & Weather Card - Compact */}
                <div className="card text-center py-4">
                    <p className="text-white/60 text-base mb-1">{getGreeting()}</p>
                    <h1 className="text-5xl text-white font-display tracking-tight">{time}</h1>
                    <p className="text-white/60 text-base mt-1">{date}</p>

                    {weather && (
                        <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-white/10">
                            <span className="text-3xl">{weather.icon}</span>
                            <div className="text-left">
                                <span className="text-xl font-semibold">{weather.temp}°F</span>
                                <p className="text-white/50 text-sm">{weather.condition}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Nest Thermostat Card */}
                <NestCard onOpenDetail={() => setShowNestDetail(true)} />

                {/* Now Playing / Playlists - 25% height */}
                <div className="card h-[25%] flex flex-col overflow-hidden">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                            <Music size={20} className="text-orange-400" />
                        </div>
                        <h2 className="font-semibold text-xl">Music</h2>
                    </div>

                    {playerState?.track && playerState.state === 'PLAYING' ? (
                        /* Currently Playing */
                        <div className="flex-1 flex items-center gap-4">
                            <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
                                {playerState.track.art ? (
                                    <img src={playerState.track.art} alt="Album" className="w-full h-full object-cover" />
                                ) : (
                                    <Music size={32} className="text-white/30" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-xl truncate">{playerState.track.title || 'Unknown'}</p>
                                <p className="text-white/50 text-lg truncate">{playerState.track.artist || 'Unknown Artist'}</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-3 rounded-full bg-white/10 hover:bg-white/20">
                                    <Play size={24} />
                                </button>
                                <button className="p-3 rounded-full bg-white/10 hover:bg-white/20">
                                    <SkipForward size={24} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Quick Playlists when not playing */
                        <div className="flex-1 flex flex-col">
                            <p className="text-white/50 text-base mb-3">Quick Play</p>
                            <div className="grid grid-cols-2 gap-2 flex-1">
                                {[
                                    { name: 'Chill Vibes', emoji: '🎧' },
                                    { name: 'Party Mix', emoji: '🎉' },
                                    { name: 'Focus', emoji: '🎯' },
                                    { name: 'Kids', emoji: '🧒' },
                                ].map(playlist => (
                                    <button
                                        key={playlist.name}
                                        className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-left"
                                    >
                                        <span className="text-2xl">{playlist.emoji}</span>
                                        <span className="font-medium text-base truncate">{playlist.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Weekly Scoreboard - 45% height, 2-column grid */}
                <div className="card h-[45%] flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-2xl">Weekly Scoreboard</h2>
                        <Trophy size={28} className="text-warning" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto">
                        {sortedMembers.slice(0, 6).map((member, idx) => {
                            const weekly = getMemberWeeklyStats(member.id);
                            const colorClass = familyColors[member.color] || 'bg-family-blue';
                            const isLeader = idx === 0 && weekly.weeklyTasksCompleted > 0;

                            return (
                                <button
                                    key={member.id}
                                    onClick={() => navigate('/tasks')}
                                    className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer text-left"
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl relative",
                                        colorClass
                                    )}>
                                        {member.name[0]}
                                        {isLeader && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-warning rounded-full flex items-center justify-center">
                                                <Trophy size={12} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-lg truncate">{member.name.split(' ')[0]}</p>
                                        <div className="flex items-center gap-2 text-base">
                                            <span className="text-success font-bold">{weekly.weeklyTasksCompleted}</span>
                                            <span className="text-white/30">|</span>
                                            <div className="flex items-center gap-1">
                                                <Star size={14} className="text-warning fill-warning" />
                                                <span className="text-warning font-bold">{member.points}</span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Nest Detail Modal */}
            {showNestDetail && (
                <NestDetailView onClose={() => setShowNestDetail(false)} />
            )}

            {/* Event Detail Modal */}
            {selectedEvent && (
                <EventModal
                    event={selectedEvent}
                    familyMembers={familyMembers}
                    onClose={() => setSelectedEvent(null)}
                />
            )}

            {/* Meal Detail Modal */}
            {selectedMeal && (
                <MealModal
                    meal={selectedMeal.meal}
                    mealType={selectedMeal.type}
                    onClose={() => setSelectedMeal(null)}
                />
            )}
        </div>
    );
};

export default Dashboard;
