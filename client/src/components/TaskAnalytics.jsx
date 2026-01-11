import React, { useEffect, useState } from 'react';
import { Star, Check, Loader2, Calendar } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import api from '../lib/api';
import { cn } from '../lib/utils';

// Family member colors mapping
const familyColors = {
    'pastel-blue': { bg: 'bg-family-blue', text: 'text-family-blue', light: 'bg-family-blue/20', border: 'border-family-blue' },
    'pastel-pink': { bg: 'bg-family-pink', text: 'text-family-pink', light: 'bg-family-pink/20', border: 'border-family-pink' },
    'pastel-green': { bg: 'bg-family-green', text: 'text-family-green', light: 'bg-family-green/20', border: 'border-family-green' },
    'pastel-purple': { bg: 'bg-family-purple', text: 'text-family-purple', light: 'bg-family-purple/20', border: 'border-family-purple' },
    'pastel-yellow': { bg: 'bg-family-orange', text: 'text-family-orange', light: 'bg-family-orange/20', border: 'border-family-orange' },
    'pastel-orange': { bg: 'bg-family-orange', text: 'text-family-orange', light: 'bg-family-orange/20', border: 'border-family-orange' },
};

// Color hex values for chart
const memberColorHex = {
    'pastel-blue': '#3B82F6',
    'pastel-pink': '#EC4899',
    'pastel-green': '#22C55E',
    'pastel-purple': '#A855F7',
    'pastel-yellow': '#F59E0B',
    'pastel-orange': '#F97316',
};

const TaskAnalytics = ({ familyMembers }) => {
    const [weeklyStats, setWeeklyStats] = useState({ stats: [] });
    const [history, setHistory] = useState([]);
    const [dailyStats, setDailyStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDays, setSelectedDays] = useState(7);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const [weekly, hist, daily] = await Promise.all([
                    api.getWeeklyTaskStats(),
                    api.getTaskHistory(selectedDays),
                    api.getDailyTaskStats(selectedDays),
                ]);
                setWeeklyStats(weekly);
                setHistory(hist);
                setDailyStats(daily);
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            }
            setLoading(false);
        };
        fetchAnalytics();
    }, [selectedDays]);

    // Transform daily stats for stacked bar chart
    const chartData = React.useMemo(() => {
        if (!dailyStats.length) return [];

        // Group by date
        const byDate = {};
        dailyStats.forEach(stat => {
            if (!byDate[stat.date]) {
                byDate[stat.date] = { date: stat.date };
            }
            byDate[stat.date][stat.member_name] = stat.count;
        });

        // Convert to array and sort by date
        return Object.values(byDate)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(day => ({
                ...day,
                // Format date for display
                displayDate: new Date(day.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                }),
            }));
    }, [dailyStats]);

    // Get unique member names from daily stats
    const memberNames = React.useMemo(() => {
        const names = new Set();
        dailyStats.forEach(stat => names.add(stat.member_name));
        return Array.from(names);
    }, [dailyStats]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-white/40" size={48} />
            </div>
        );
    }

    // Group history by date
    const historyByDate = history.reduce((acc, item) => {
        const date = item.completed_at?.split('T')[0] || item.completed_at?.split(' ')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(item);
        return acc;
    }, {});

    const sortedDates = Object.keys(historyByDate).sort().reverse();

    return (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto touch-scroll">
            {/* Weekly Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {weeklyStats.stats?.map((member) => {
                    const colors = familyColors[member.color] || familyColors['pastel-blue'];
                    return (
                        <div key={member.id} className="card p-4 text-center">
                            <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2",
                                colors.bg
                            )}>
                                {member.name[0]}
                            </div>
                            <p className="font-medium text-sm mb-2">{member.name}</p>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-2xl font-bold text-success">{member.weeklyTasksCompleted}</p>
                                    <p className="text-xs text-white/40">tasks</p>
                                </div>
                                <div>
                                    <div className="flex items-center justify-center gap-1">
                                        <Star size={14} className="text-warning fill-warning" />
                                        <p className="text-2xl font-bold text-warning">{member.totalPoints}</p>
                                    </div>
                                    <p className="text-xs text-white/40">total pts</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Time Range Selector */}
            <div className="flex gap-2">
                {[7, 14, 30].map((days) => (
                    <button
                        key={days}
                        onClick={() => setSelectedDays(days)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                            selectedDays === days
                                ? "bg-primary text-white"
                                : "bg-white/10 text-white/60 hover:bg-white/20"
                        )}
                    >
                        {days} days
                    </button>
                ))}
            </div>

            {/* Trend Chart */}
            {chartData.length > 0 && (
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Daily Completion Trend</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <XAxis
                                    dataKey="displayDate"
                                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(30, 30, 40, 0.95)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: 'white',
                                    }}
                                    labelStyle={{ color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Legend
                                    wrapperStyle={{ paddingTop: '16px' }}
                                    formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.8)' }}>{value}</span>}
                                />
                                {memberNames.map((name) => {
                                    const member = familyMembers.find(m => m.name === name);
                                    const color = memberColorHex[member?.color] || '#3B82F6';
                                    return (
                                        <Bar
                                            key={name}
                                            dataKey={name}
                                            stackId="tasks"
                                            fill={color}
                                            radius={[4, 4, 0, 0]}
                                        />
                                    );
                                })}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Completion History */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4">Completion History</h3>
                {sortedDates.length === 0 ? (
                    <p className="text-white/40 text-center py-8">No completed tasks yet</p>
                ) : (
                    <div className="space-y-4">
                        {sortedDates.map((date) => {
                            const dayTasks = historyByDate[date];
                            const displayDate = new Date(date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                            });
                            const totalPoints = dayTasks.reduce((sum, t) => sum + (t.points_earned || 1), 0);

                            return (
                                <div key={date}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-white/40" />
                                            <span className="text-sm font-medium">{displayDate}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-white/40">{dayTasks.length} tasks</span>
                                            <span className="text-xs text-warning">+{totalPoints} pts</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1 pl-6">
                                        {dayTasks.map((task) => {
                                            const memberColors = familyColors[
                                                familyMembers.find(m => m.name === task.member_name)?.color
                                            ] || familyColors['pastel-blue'];

                                            return (
                                                <div
                                                    key={task.id}
                                                    className="flex items-center gap-2 p-2 bg-white/5 rounded-lg"
                                                >
                                                    <Check size={14} className="text-success" />
                                                    <span className="flex-1 text-sm truncate">{task.task_title}</span>
                                                    <span className={cn("text-xs px-2 py-0.5 rounded-full", memberColors.light, memberColors.text)}>
                                                        {task.member_name}
                                                    </span>
                                                    <span className="text-xs text-warning">+{task.points_earned}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskAnalytics;
