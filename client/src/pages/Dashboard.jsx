import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useClock } from '../hooks/useClock';
import { cn } from '../lib/utils';
import { fetchDashboardData, setScoreboard } from '../features/dashboardSlice';
import { fetchSettings } from '../features/settingsSlice';
import { Music, Calendar, Utensils, Play, SkipForward, Star, Trophy, Shirt } from 'lucide-react';
import api from '../lib/api';

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
    const { time, date, hours } = useClock();
    const { weather, upcomingEvents, todayTasks, todayMeals, clothing } = useSelector((state) => state.dashboard);
    const familyMembers = useSelector((state) => state.settings.familyMembers);
    const { playerState } = useSelector((state) => state.sonos);
    const [weeklyStats, setWeeklyStats] = useState({ stats: [] });

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
        api.getWeeklyTaskStats().then(setWeeklyStats).catch(console.error);
    }, [dispatch]);

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
            {/* LEFT COLUMN - Upcoming Events (75% width) */}
            <div className="w-3/4 flex-shrink-0 flex flex-col gap-3 min-w-0">
                <div className="card flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <Calendar size={20} className="text-purple-400" />
                        </div>
                        <h2 className="text-lg font-semibold">Upcoming Events</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 hide-scrollbar">
                        {upcomingEvents.length > 0 ? (
                            upcomingEvents.map((event, idx) => (
                                <div
                                    key={event.id || idx}
                                    className={cn(
                                        "flex items-start gap-3 p-3 rounded-xl transition-colors",
                                        event.isToday ? "bg-purple-500/20" : "bg-white/5"
                                    )}
                                >
                                    {/* Color dot for family member */}
                                    <div className={cn(
                                        "w-3 h-3 rounded-full flex-shrink-0 mt-1.5",
                                        getMemberColor(event.member, familyMembers)
                                    )} />
                                    {/* Date badge */}
                                    <div className={cn(
                                        "flex-shrink-0 w-20 text-center rounded-lg py-2 px-2",
                                        event.isToday ? "bg-purple-500/30 text-purple-300" : "bg-white/10 text-white/60"
                                    )}>
                                        <div className="text-sm font-semibold">{formatEventDate(event.date)}</div>
                                    </div>
                                    {/* Event details */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-white truncate text-lg">{event.title}</p>
                                        <p className="text-white/50">{event.time}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-white/40">
                                <p>No upcoming events</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Today's Meals - Compact */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                            <Utensils size={16} className="text-success" />
                        </div>
                        <span className="font-medium">Today's Meals</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { key: 'breakfast', emoji: '🍳', label: 'Breakfast', color: 'text-yellow-400' },
                            { key: 'lunch', emoji: '🥗', label: 'Lunch', color: 'text-green-400' },
                            { key: 'dinner', emoji: '🍽️', label: 'Dinner', color: 'text-blue-400' },
                            { key: 'snack', emoji: '🍎', label: 'Snack', color: 'text-pink-400' },
                        ].map(meal => (
                            <div key={meal.key} className="text-center p-2 bg-white/5 rounded-lg">
                                <span className="text-xl">{todayMeals?.[meal.key]?.recipeEmoji || meal.emoji}</span>
                                <p className="text-xs text-white/50 truncate mt-1">
                                    {todayMeals?.[meal.key]?.recipeTitle || 'Not set'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN - Clock, Weather, Small Cards (Wider) */}
            <div className="flex-1 flex flex-col gap-3">
                {/* Time & Weather Card */}
                <div className="card text-center">
                    <p className="text-white/60 text-sm mb-1">{getGreeting()}</p>
                    <h1 className="text-5xl text-white font-display tracking-tight">{time}</h1>
                    <p className="text-white/60 text-sm">{date}</p>

                    {weather && (
                        <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-white/10">
                            <span className="text-3xl">{weather.icon}</span>
                            <div className="text-left">
                                <span className="text-xl font-semibold">{weather.temp}°F</span>
                                <p className="text-white/50 text-xs">{weather.condition}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* What to Wear - Compact */}
                {clothing && (
                    <div className="card bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 py-3">
                        <div className="flex items-center gap-2">
                            <Shirt size={16} className="text-cyan-400" />
                            <span className="text-sm text-white/60">Wear</span>
                            <span className="text-lg">{clothing.mainIcon}</span>
                            <span className="font-medium text-white">{clothing.main}</span>
                        </div>
                    </div>
                )}

                {/* Now Playing - Compact */}
                <div className="card py-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Music size={16} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            {playerState?.currentTrack ? (
                                <>
                                    <p className="font-medium text-white text-sm truncate">
                                        {playerState.currentTrack.title || 'Unknown'}
                                    </p>
                                    <p className="text-white/50 text-xs truncate">
                                        {playerState.currentTrack.artist || 'Unknown Artist'}
                                    </p>
                                </>
                            ) : (
                                <p className="text-white/40 text-sm">No music playing</p>
                            )}
                        </div>
                        <div className="flex gap-1">
                            <button className="p-1.5 rounded-full bg-white/10 hover:bg-white/20">
                                <Play size={14} />
                            </button>
                            <button className="p-1.5 rounded-full bg-white/10 hover:bg-white/20">
                                <SkipForward size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Weekly Scoreboard - Vertical */}
                <div className="card flex-1 overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-semibold text-lg">Weekly Scoreboard</h2>
                        <Trophy size={20} className="text-warning" />
                    </div>
                    <div className="space-y-2">
                        {sortedMembers.slice(0, 5).map((member, idx) => {
                            const weekly = getMemberWeeklyStats(member.id);
                            const colorClass = familyColors[member.color] || 'bg-family-blue';
                            const isLeader = idx === 0 && weekly.weeklyTasksCompleted > 0;

                            return (
                                <div key={member.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg",
                                        colorClass
                                    )}>
                                        {member.name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-base truncate">{member.name.split(' ')[0]}</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-base">
                                        <span className="text-success font-bold text-lg">{weekly.weeklyTasksCompleted}</span>
                                        <span className="text-white/30">|</span>
                                        <div className="flex items-center gap-1">
                                            <Star size={14} className="text-warning fill-warning" />
                                            <span className="text-warning font-bold text-lg">{member.points}</span>
                                        </div>
                                    </div>
                                    {isLeader && <Trophy size={18} className="text-warning fill-warning" />}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Today's Tasks - Quick Preview */}
                {todayTasks.filter(t => !t.completed).length > 0 && (
                    <div className="card py-3">
                        <p className="text-xs text-white/50 mb-2">
                            {todayTasks.filter(t => !t.completed).length} tasks remaining
                        </p>
                        <div className="space-y-1">
                            {todayTasks.filter(t => !t.completed).slice(0, 3).map((task) => (
                                <div key={task.id} className="flex items-center gap-2 text-sm">
                                    <div className="w-3 h-3 rounded-full border border-white/30" />
                                    <span className="truncate">{task.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
