import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Check, Star, Trophy, Sparkles, Loader2 } from 'lucide-react';
import { fetchTasks, toggleChoreAsync, hideConfetti } from '../features/tasksSlice';
import { cn } from '../lib/utils';

// Color mapping
const colorMap = {
    'pastel-blue': '#A7C7E7',
    'pastel-pink': '#F4C2C2',
    'pastel-green': '#C1E1C1',
};

// Confetti component
const Confetti = ({ show, onHide }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(onHide, 2000);
            return () => clearTimeout(timer);
        }
    }, [show, onHide]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {[...Array(50)].map((_, i) => (
                <div
                    key={i}
                    className="absolute animate-confetti"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: '-20px',
                        animationDelay: `${Math.random() * 0.5}s`,
                        backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 6)],
                        width: '10px',
                        height: '10px',
                        borderRadius: Math.random() > 0.5 ? '50%' : '0',
                    }}
                />
            ))}
        </div>
    );
};

const Tasks = () => {
    const dispatch = useDispatch();
    const { chores, familyMembers, showConfetti, loading } = useSelector((state) => state.tasks);

    // Fetch data on mount
    useEffect(() => {
        dispatch(fetchTasks());
    }, [dispatch]);

    // Sort members by points (descending) for leaderboard
    const leaderboard = [...familyMembers].sort((a, b) => b.points - a.points);

    // Group chores by assignee
    const choresByMember = familyMembers.map(member => ({
        ...member,
        chores: chores.filter(c => c.assignedTo === member.name),
        pending: chores.filter(c => c.assignedTo === member.name && !c.completed).length,
        completed: chores.filter(c => c.assignedTo === member.name && c.completed).length,
    }));

    const handleToggle = (choreId) => {
        dispatch(toggleChoreAsync(choreId));
    };

    // Loading state
    if (loading && chores.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-400" size={48} />
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col">
            <Confetti show={showConfetti} onHide={() => dispatch(hideConfetti())} />

            {/* Header with leaderboard summary */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-serif">Tasks</h1>
                <div className="flex items-center gap-4 bg-white rounded-2xl px-4 py-2 shadow-sm">
                    <Trophy className="text-yellow-500" size={20} />
                    {leaderboard.map((member, index) => (
                        <div key={member.id} className="flex items-center gap-2">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                                style={{ backgroundColor: colorMap[member.color] }}
                            >
                                {member.name[0]}
                            </div>
                            <span className="text-sm font-medium">
                                {member.points}
                                {index === 0 && <span className="ml-1">👑</span>}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chore columns by assignee */}
            <div className="flex-1 grid gap-6 overflow-hidden" style={{ gridTemplateColumns: `repeat(${familyMembers.length}, 1fr)` }}>
                {choresByMember.map((member) => (
                    <div
                        key={member.id}
                        className="bg-white rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col"
                    >
                        {/* Member header */}
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white"
                                style={{ backgroundColor: colorMap[member.color] }}
                            >
                                {member.name[0]}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-editorial-text text-lg">{member.name}</div>
                                <div className="text-sm text-gray-500">
                                    {member.pending} pending · {member.completed} done
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-yellow-500 font-bold">
                                <Star size={16} fill="currentColor" />
                                {member.points}
                            </div>
                        </div>

                        {/* Chores list */}
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {/* Pending chores */}
                            {member.chores
                                .filter(c => !c.completed)
                                .map((chore) => (
                                    <div
                                        key={chore.id}
                                        onClick={() => handleToggle(chore.id)}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all group"
                                    >
                                        <div
                                            className="w-8 h-8 rounded-full border-2 flex items-center justify-center group-hover:border-green-400 group-hover:bg-green-50 transition-colors"
                                            style={{ borderColor: colorMap[member.color] }}
                                        >
                                            <Check className="text-transparent group-hover:text-green-400 transition-colors" size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-editorial-text truncate">{chore.title}</div>
                                        </div>
                                        <div className="text-xs text-yellow-500 font-bold whitespace-nowrap">
                                            +{chore.points}
                                        </div>
                                    </div>
                                ))}

                            {/* Completed divider */}
                            {member.completed > 0 && member.pending > 0 && (
                                <div className="flex items-center gap-2 py-2">
                                    <div className="flex-1 h-px bg-gray-200" />
                                    <span className="text-xs text-gray-400">Done</span>
                                    <div className="flex-1 h-px bg-gray-200" />
                                </div>
                            )}

                            {/* Completed chores */}
                            {member.chores
                                .filter(c => c.completed)
                                .map((chore) => (
                                    <div
                                        key={chore.id}
                                        onClick={() => handleToggle(chore.id)}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-green-50 cursor-pointer transition-all opacity-60 hover:opacity-80"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center">
                                            <Check className="text-white" size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-editorial-text line-through truncate">{chore.title}</div>
                                        </div>
                                        <div className="text-xs text-green-500 font-bold whitespace-nowrap">
                                            +{chore.points}
                                        </div>
                                    </div>
                                ))}

                            {/* Empty state */}
                            {member.chores.length === 0 && (
                                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                                    No tasks assigned
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Weekly goal progress */}
            <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Weekly Family Goal</span>
                    <span className="text-sm font-bold text-editorial-text">
                        {leaderboard.reduce((sum, m) => sum + m.points, 0)} / 500 pts
                    </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (leaderboard.reduce((sum, m) => sum + m.points, 0) / 500) * 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Tasks;
