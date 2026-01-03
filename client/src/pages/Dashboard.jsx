import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useClock } from '../hooks/useClock';
import { cn } from '../lib/utils';
import { fetchDashboardData, setScoreboard } from '../features/dashboardSlice';
import { fetchSettings } from '../features/settingsSlice';
import { CheckCircle2, Calendar, ListTodo, Trophy, Utensils, Loader2 } from 'lucide-react';
import SonosWidget from '../components/SonosWidget';
import api from '../lib/api';

const Dashboard = () => {
    const dispatch = useDispatch();
    const { time, date, hours } = useClock();
    const { weather, clothing, upcomingEvents, todayTasks, dinner, scoreboard, loading } = useSelector((state) => state.dashboard);
    const familyMembers = useSelector((state) => state.settings.familyMembers);

    // Dynamic greeting based on time
    const dynamicGreeting = hours < 12 ? 'Good Morning' : hours < 18 ? 'Good Afternoon' : 'Good Evening';

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

    // Handle task completion
    const handleCompleteTask = async (task) => {
        try {
            await api.completeGoogleTask(task.listId, task.googleTaskId);
            dispatch(fetchDashboardData()); // Refresh
        } catch (error) {
            console.error('Failed to complete task:', error);
        }
    };

    const colorClasses = {
        'pastel-blue': 'bg-pastel-blue/20 border-pastel-blue',
        'pastel-pink': 'bg-pastel-pink/20 border-pastel-pink',
        'pastel-green': 'bg-pastel-green/20 border-pastel-green',
        'pastel-yellow': 'bg-pastel-yellow/20 border-pastel-yellow',
        'pastel-purple': 'bg-pastel-purple/20 border-pastel-purple',
    };

    return (
        <div className="h-full w-full">
            <h1 className="text-3xl mb-6 font-serif">Today</h1>

            <div className="grid grid-cols-3 gap-6 h-[calc(100%-4rem)]">
                {/* Left Column */}
                <div className="flex flex-col gap-4">
                    {/* Time & Weather Card */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm">
                        <h2 className="text-base text-gray-400">{dynamicGreeting}</h2>
                        <div className="text-4xl font-bold text-editorial-text">{time}</div>
                        <div className="text-sm text-gray-500 mb-3">{date}</div>

                        {/* Current Weather */}
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl mb-2">
                            <span className="text-4xl">{weather.icon}</span>
                            <div className="flex-1">
                                <div className="text-2xl font-bold text-editorial-text">{weather.temp}°F</div>
                                <div className="text-xs text-gray-600">{weather.condition}</div>
                            </div>
                        </div>

                        {/* Forecast Details */}
                        <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                            <div className="p-1.5 bg-gray-50 rounded-lg">
                                <div className="text-gray-400 text-[10px]">High/Low</div>
                                <div className="font-bold">{weather.high}°/{weather.low}°</div>
                            </div>
                            <div className="p-1.5 bg-gray-50 rounded-lg">
                                <div className="text-gray-400 text-[10px]">Humidity</div>
                                <div className="font-bold">{weather.humidity}%</div>
                            </div>
                            <div className="p-1.5 bg-gray-50 rounded-lg">
                                <div className="text-gray-400 text-[10px]">Wind</div>
                                <div className="font-bold">{weather.wind}mph</div>
                            </div>
                        </div>
                    </div>

                    {/* Clothing Recommendation */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-4 shadow-sm">
                        <h2 className="text-sm font-medium text-amber-700 mb-2 text-center">👔 Wear Today</h2>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-4xl">{clothing?.mainIcon || '👕'}</span>
                            <div className="flex-1">
                                <div className="text-lg font-bold text-editorial-text">{clothing?.main || 'T-Shirt'}</div>
                                {clothing?.note && (
                                    <div className="text-xs text-amber-700">{clothing.note}</div>
                                )}
                            </div>
                        </div>
                        {clothing?.accessories && clothing.accessories.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {clothing.accessories.map((item, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-white/60 rounded-full text-xs">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tonight's Dinner */}
                    <div className="bg-pastel-green/30 rounded-3xl p-4 shadow-sm flex items-center justify-between cursor-pointer hover:bg-pastel-green/40 transition-colors">
                        <div className="flex items-center gap-3">
                            <Utensils size={20} className="text-green-700" />
                            <div>
                                <h2 className="text-xs font-medium text-green-700">Tonight's Dinner</h2>
                                <div className="text-lg font-bold text-editorial-text">{dinner.title}</div>
                            </div>
                        </div>
                        <span className="text-3xl">{dinner.emoji}</span>
                    </div>
                </div>

                {/* Middle Column - Tasks Only */}
                <div className="flex flex-col">
                    {/* Today's Tasks - Full Height */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm flex-1 overflow-hidden flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <ListTodo size={20} className="text-blue-500" />
                            <h2 className="text-lg font-serif">Today's Tasks</h2>
                            {loading && <Loader2 size={16} className="animate-spin text-gray-400" />}
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {todayTasks.length === 0 ? (
                                <div className="text-center text-gray-400 py-8">
                                    <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50" />
                                    <div>All caught up!</div>
                                </div>
                            ) : (
                                todayTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                                    >
                                        <button
                                            onClick={() => handleCompleteTask(task)}
                                            className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-green-500 hover:bg-green-50 transition-colors"
                                        >
                                            <CheckCircle2 size={14} className="text-transparent group-hover:text-green-500" />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{task.title}</div>
                                            <div className="text-xs text-gray-500">{task.assignedTo}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-6">
                    {/* Sonos Widget */}
                    <div className="h-64">
                        <SonosWidget />
                    </div>

                    {/* Up Next - Calendar Events */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm flex-1 overflow-hidden flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar size={20} className="text-purple-500" />
                            <h2 className="text-lg font-serif">Up Next</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3">
                            {upcomingEvents.length === 0 ? (
                                <div className="text-center text-gray-400 py-8">
                                    <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                                    <div>No events today</div>
                                </div>
                            ) : (
                                upcomingEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        className={cn(
                                            "p-4 rounded-xl border-l-4",
                                            colorClasses[event.color] || colorClasses['pastel-blue']
                                        )}
                                    >
                                        <div className="font-bold">{event.title}</div>
                                        <div className="text-sm text-gray-600">{event.time}</div>
                                        {event.member && event.member !== 'Family' && (
                                            <div className="text-xs text-gray-500 mt-1">{event.member}</div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Leaderboard */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy size={20} className="text-yellow-500" />
                            <h2 className="text-lg font-serif">Leaderboard</h2>
                        </div>
                        <div className="space-y-2">
                            {scoreboard.length === 0 ? (
                                <div className="text-sm text-gray-400 text-center py-4">No scores yet</div>
                            ) : (
                                scoreboard.map((member, index) => (
                                    <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold",
                                                index === 0 ? "bg-yellow-400" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-amber-600" : "bg-gray-300"
                                            )}>
                                                {index + 1}
                                            </div>
                                            <span className="font-medium text-sm">{member.name}</span>
                                        </div>
                                        <span className={cn(
                                            "font-bold text-sm",
                                            index === 0 ? "text-yellow-500" : "text-gray-500"
                                        )}>
                                            {member.points} pts
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
