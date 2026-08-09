import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import api from '../../lib/api';
import { cn } from '../../lib/utils';
import HomeCard from './HomeCard';

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
    const leader = sortedMembers[0];
    const remaining = Math.max(sortedMembers.length - 1, 0);

    return (
        <HomeCard icon={Trophy} kicker="Leaderboard" tone="gold" onClick={() => navigate('/tasks')}>
            {!leader ? (
                <p className="text-sm text-white/55">Add family members in Settings</p>
            ) : (
                <>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-lg font-semibold text-white',
                            familyColors[leader.color] || 'bg-family-blue'
                        )}>
                            {leader.name[0]}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-lg font-semibold">{leader.name}</p>
                            <p className="text-sm font-medium text-warning">{leader.points} pts</p>
                        </div>
                    </div>
                    {remaining > 0 && (
                        <p className="mt-3 text-sm text-white/45">+{remaining} more</p>
                    )}
                </>
            )}
        </HomeCard>
    );
};

export default LeaderboardCard;
