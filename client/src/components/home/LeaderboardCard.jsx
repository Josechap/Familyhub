import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Star, Trophy } from 'lucide-react';
import api from '../../lib/api';
import { cn } from '../../lib/utils';
import HomeCard from './HomeCard';
import CardEmptyState from './CardEmptyState';

const familyColors = {
    'pastel-blue': 'bg-family-blue',
    'pastel-pink': 'bg-family-pink',
    'pastel-green': 'bg-family-green',
    'pastel-purple': 'bg-family-purple',
    'pastel-yellow': 'bg-family-orange',
    'pastel-orange': 'bg-family-orange',
};

const LeaderboardCard = () => {
    const navigate = useNavigate();
    const familyMembers = useSelector((state) => state.settings.familyMembers);
    const [weeklyStats, setWeeklyStats] = useState({ stats: [] });

    useEffect(() => {
        api.getWeeklyTaskStats().then(setWeeklyStats).catch(console.error);
    }, []);

    const getWeeklyCompletions = (memberId) => (
        weeklyStats.stats?.find((item) => item.id === memberId)?.weeklyTasksCompleted || 0
    );

    const sortedMembers = [...familyMembers].sort(
        (a, b) => getWeeklyCompletions(b.id) - getWeeklyCompletions(a.id)
    );
    const maxCompletions = Math.max(...sortedMembers.map((member) => getWeeklyCompletions(member.id)), 1);

    return (
        <HomeCard icon={Trophy} kicker="Leaderboard" tone="gold" align="start" onClick={() => navigate('/tasks')}>
            {sortedMembers.length === 0 ? (
                <CardEmptyState
                    icon={Trophy}
                    tone="gold"
                    title="No family members yet"
                    description="Add them in Settings"
                />
            ) : (
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto hide-scrollbar">
                    {sortedMembers.map((member, idx) => {
                        const completions = getWeeklyCompletions(member.id);
                        const isLeader = idx === 0 && completions > 0;
                        const progress = Math.max((completions / maxCompletions) * 100, 6);

                        return (
                            <div
                                key={member.id}
                                className={cn(
                                    'flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-2',
                                    isLeader && 'border-warning/25 bg-warning/10'
                                )}
                            >
                                <div className={cn(
                                    'relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white',
                                    familyColors[member.color] || 'bg-family-blue'
                                )}>
                                    {member.name[0]}
                                    {isLeader && (
                                        <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-warning text-white">
                                            <Trophy size={9} />
                                        </div>
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate text-sm font-semibold">{member.name}</p>
                                        <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-warning">
                                            <Star size={10} className="fill-warning" />
                                            {member.points}
                                        </span>
                                    </div>
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/8">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <span className="flex-shrink-0 text-[0.68rem] text-white/45">{completions} tasks</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </HomeCard>
    );
};

export default LeaderboardCard;
