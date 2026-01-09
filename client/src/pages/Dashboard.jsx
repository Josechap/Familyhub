import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useClock } from '../hooks/useClock';
import { cn } from '../lib/utils';
import { fetchDashboardData, setScoreboard } from '../features/dashboardSlice';
import { fetchSettings } from '../features/settingsSlice';
import { Music, Calendar, Utensils, Play, Pause, SkipForward } from 'lucide-react';
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
    const { weather, upcomingEvents, todayTasks, dinner, loading } = useSelector((state) => state.dashboard);
    const familyMembers = useSelector((state) => state.settings.familyMembers);
    const { devices, activeDeviceIp, playerState } = useSelector((state) => state.sonos);

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

    // Calculate task completion per member
    const getMemberTaskStats = (member) => {
        const memberTasks = todayTasks.filter(t => t.assignedTo === member.name);
        const completed = memberTasks.filter(t => t.completed).length;
        const total = memberTasks.length || 1; // Avoid division by zero
        return { completed, total, percent: Math.round((completed / total) * 100) };
    };

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
                <div className="flex items-center justify-center gap-3 mt-4">
                    <span className="text-4xl">{weather.icon}</span>
                    <span className="text-2xl font-semibold">{weather.temp}°F</span>
                    <span className="text-white/60">{weather.condition}</span>
                </div>
            </div>

            {/* Quick Glance Cards */}
            <div className="grid grid-cols-3 gap-4">
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

                {/* Tonight's Dinner Card */}
                <div className="card cursor-pointer bg-gradient-to-br from-success/20 to-success/5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                            <Utensils size={20} className="text-success" />
                        </div>
                        <span className="text-white/60 text-sm font-medium">Dinner</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-white">{dinner.title}</p>
                            {dinner.title !== 'Plan Dinner' && (
                                <p className="text-white/50 text-sm">Ready to cook</p>
                            )}
                        </div>
                        <span className="text-4xl">{dinner.emoji}</span>
                    </div>
                </div>
            </div>

            {/* Family Progress Section */}
            <div className="card">
                <h2 className="text-lg font-semibold mb-4">Family Progress</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {familyMembers.map((member) => {
                        const stats = getMemberTaskStats(member);
                        const colorClass = familyColors[member.color] || 'bg-family-blue';

                        return (
                            <div key={member.id} className="flex items-center gap-3">
                                {/* Avatar */}
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg",
                                    colorClass
                                )}>
                                    {member.name[0]}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white truncate">{member.name}</p>
                                    <div className="progress-bar mt-1">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${stats.percent}%` }}
                                        />
                                    </div>
                                    <p className="text-white/50 text-xs mt-1">
                                        {stats.completed} of {stats.total} tasks
                                    </p>
                                </div>
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
                        <span className="text-white/50 text-sm">{todayTasks.length} remaining</span>
                    </div>
                    <div className="space-y-2">
                        {todayTasks.slice(0, 4).map((task) => (
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
                        {todayTasks.length > 4 && (
                            <p className="text-center text-white/40 text-sm pt-2">
                                +{todayTasks.length - 4} more tasks
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
