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
        // Fetch weekly stats
        api.getWeeklyTaskStats().then(setWeeklyStats).catch(console.error);
    }, [dispatch]);

    // Update scoreboard when family members change
    useEffect(() => {
        if (familyMembers.length > 0) {
            const sorted = [...familyMembers].sort((a, b) => b.points - a.points);
            dispatch(setScoreboard(sorted));
        }
    }, [dispatch, familyMembers]);

    // Get next event
    const nextEvent = upcomingEvents[0];

    // Calculate task completion per member (includes both local chores and Google Tasks)
    const getMemberTaskStats = (member) => {
        const memberTasks = todayTasks.filter(t => t.assignedTo === member.name);
        const completed = memberTasks.filter(t => t.completed).length;
        const total = memberTasks.length;

        // If no tasks assigned, show 0% instead of misleading 100%
        if (total === 0) {
            return { completed: 0, total: 0, percent: 0 };
        }

        return { completed, total, percent: Math.round((completed / total) * 100) };
    };

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
        <div className="h-full w-full flex flex-col gap-6 animate-fade-in">
            {/* Hero Section - Time & Weather */}
            <div className="text-center py-8">
                <p className="text-white/60 text-lg mb-2">{getGreeting()}</p>
                <h1 className="text-hero text-white font-display tracking-tight mb-1">
                    {time}
                </h1>
                <p className="text-white/60 text-xl">{date}</p>

                {/* Weather inline */}
                {weather ? (
                    <div className="flex items-center justify-center gap-3 mt-4">
                        <span className="text-4xl">{weather.icon}</span>
                        <span className="text-2xl font-semibold">{weather.temp}°F</span>
                        <span className="text-white/60">{weather.condition}</span>
                    </div>
                ) : (
                    <p className="text-white/40 text-sm mt-4">Configure weather in Settings</p>
                )}
            </div>

            {/* Quick Glance Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Now Playing Card */}
                <div className="card group cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                            <Music size={20} className="text-primary" />
                        </div>
                        <span className="text-white/60 text-sm font-medium">Now Playing</span>
                    </div>
                    {playerState?.currentTrack ? (
                        <div>
                            <p className="font-semibold text-white truncate">
                                {playerState.currentTrack.title || 'Unknown Track'}
                            </p>
                            <p className="text-white/50 text-sm truncate">
                                {playerState.currentTrack.artist || 'Unknown Artist'}
                            </p>
                        </div>
                    ) : (
                        <p className="text-white/40">No music playing</p>
                    )}
                    {/* Mini controls */}
                    <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                            <Play size={16} />
                        </button>
                        <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                            <SkipForward size={16} />
                        </button>
                    </div>
                </div>

                {/* Next Event Card */}
                <div className="card cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <Calendar size={20} className="text-purple-400" />
                        </div>
                        <span className="text-white/60 text-sm font-medium">Up Next</span>
                    </div>
                    {nextEvent ? (
                        <div>
                            <p className="font-semibold text-white truncate">{nextEvent.title}</p>
                            <p className="text-white/50 text-sm">{nextEvent.time}</p>
                            {nextEvent.member && nextEvent.member !== 'Family' && (
                                <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-white/10 text-xs">
                                    {nextEvent.member}
                                </span>
                            )}
                        </div>
                    ) : (
                        <p className="text-white/40">No upcoming events</p>
                    )}
                </div>

                {/* What to Wear Card */}
                <div className="card bg-gradient-to-br from-cyan-500/20 to-cyan-500/5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                            <Shirt size={20} className="text-cyan-400" />
                        </div>
                        <span className="text-white/60 text-sm font-medium">What to Wear</span>
                    </div>
                    {clothing ? (
                        <div className="space-y-2">
                            {/* Main recommendation */}
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{clothing.mainIcon}</span>
                                <p className="font-semibold text-white">{clothing.main}</p>
                            </div>
                            {/* Accessories */}
                            {clothing.accessories?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {clothing.accessories.map((item, idx) => (
                                        <span
                                            key={idx}
                                            className="text-sm bg-white/10 px-2 py-1 rounded-lg"
                                        >
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {/* Note */}
                            {clothing.note && (
                                <p className="text-xs text-white/50 mt-2">
                                    {clothing.note}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-white/40 text-sm">Configure weather to get clothing recommendations</p>
                    )}
                </div>

                {/* Today's Meals Card */}
                <div className="card bg-gradient-to-br from-success/20 to-success/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                            <Utensils size={20} className="text-success" />
                        </div>
                        <span className="text-white/60 text-sm font-medium">Today's Meals</span>
                    </div>
                    <div className="space-y-3">
                        {/* Breakfast */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-yellow-400 font-medium">🍳 Breakfast</p>
                                <p className="text-sm text-white">
                                    {todayMeals?.breakfast?.recipeTitle || 'Not planned'}
                                </p>
                            </div>
                            {todayMeals?.breakfast && (
                                <span className="text-2xl">{todayMeals.breakfast.recipeEmoji || '🍳'}</span>
                            )}
                        </div>
                        {/* Lunch */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-green-400 font-medium">🥗 Lunch</p>
                                <p className="text-sm text-white">
                                    {todayMeals?.lunch?.recipeTitle || 'Not planned'}
                                </p>
                            </div>
                            {todayMeals?.lunch && (
                                <span className="text-2xl">{todayMeals.lunch.recipeEmoji || '🥗'}</span>
                            )}
                        </div>
                        {/* Dinner */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-blue-400 font-medium">🍽️ Dinner</p>
                                <p className="text-sm text-white">
                                    {todayMeals?.dinner?.recipeTitle || 'Not planned'}
                                </p>
                            </div>
                            {todayMeals?.dinner && (
                                <span className="text-2xl">{todayMeals.dinner.recipeEmoji || '🍽️'}</span>
                            )}
                        </div>
                        {/* Snack */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-pink-400 font-medium">🍎 Snack</p>
                                <p className="text-sm text-white">
                                    {todayMeals?.snack?.recipeTitle || 'Not planned'}
                                </p>
                            </div>
                            {todayMeals?.snack && (
                                <span className="text-2xl">{todayMeals.snack.recipeEmoji || '🍎'}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Family Scoreboard - Weekly Stats - Fixed 5 columns */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Weekly Scoreboard</h2>
                    <span className="text-white/40 text-xs">This week</span>
                </div>
                <div className="grid grid-cols-5 gap-3">
                    {sortedMembers.map((member, idx) => {
                        const stats = getMemberTaskStats(member);
                        const weekly = getMemberWeeklyStats(member.id);
                        const colorClass = familyColors[member.color] || 'bg-family-blue';
                        const isLeader = idx === 0 && weekly.weeklyTasksCompleted > 0;

                        return (
                            <div key={member.id} className="relative flex flex-col items-center p-3 bg-white/5 rounded-xl">
                                {/* Leader badge */}
                                {isLeader && (
                                    <div className="absolute -top-2 -right-2">
                                        <Trophy size={20} className="text-warning fill-warning" />
                                    </div>
                                )}

                                {/* Avatar */}
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2",
                                    colorClass
                                )}>
                                    {member.name[0]}
                                </div>

                                {/* Name */}
                                <p className="font-medium text-white text-sm truncate w-full text-center">{member.name.split(' ')[0]}</p>

                                {/* Weekly Stats */}
                                <div className="flex items-center gap-2 mt-2">
                                    {/* Tasks completed this week */}
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-success">{weekly.weeklyTasksCompleted}</p>
                                        <p className="text-white/40 text-xs">tasks</p>
                                    </div>
                                    <div className="w-px h-6 bg-white/10" />
                                    {/* Total points */}
                                    <div className="text-center">
                                        <div className="flex items-center gap-0.5">
                                            <Star size={12} className="text-warning fill-warning" />
                                            <p className="text-lg font-bold text-warning">{member.points}</p>
                                        </div>
                                        <p className="text-white/40 text-xs">pts</p>
                                    </div>
                                </div>

                                {/* Today's progress */}
                                {stats.total > 0 && (
                                    <div className="w-full mt-2">
                                        <div className="progress-bar h-1">
                                            <div
                                                className="progress-bar-fill h-1"
                                                style={{ width: `${stats.percent}%` }}
                                            />
                                        </div>
                                        <p className="text-white/40 text-xs text-center mt-1">
                                            {stats.completed}/{stats.total} today
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Today's Tasks Preview */}
            {todayTasks.length > 0 && (
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Today's Tasks</h2>
                        <span className="text-white/50 text-sm">{todayTasks.filter(t => !t.completed).length} remaining</span>
                    </div>
                    <div className="space-y-2">
                        {todayTasks.filter(t => !t.completed).slice(0, 4).map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <div className="w-5 h-5 rounded-full border-2 border-white/30" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{task.title}</p>
                                    <p className="text-white/50 text-xs">{task.assignedTo}</p>
                                </div>
                            </div>
                        ))}
                        {todayTasks.filter(t => !t.completed).length > 4 && (
                            <p className="text-center text-white/40 text-sm pt-2">
                                +{todayTasks.filter(t => !t.completed).length - 4} more tasks
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
