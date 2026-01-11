import React, { useEffect, useState, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Star, Check, Trophy, Plus, X, Loader2, ArrowRightLeft, BarChart3, ListTodo } from 'lucide-react';
import { fetchTasks, toggleChoreAsync, completeGoogleTaskAsync } from '../features/tasksSlice';
import { cn } from '../lib/utils';
import api from '../lib/api';

// Lazy load TaskAnalytics (includes Recharts)
const TaskAnalytics = React.lazy(() => import('../components/TaskAnalytics'));

// Family member colors mapping
const familyColors = {
    'pastel-blue': { bg: 'bg-family-blue', text: 'text-family-blue', light: 'bg-family-blue/20', border: 'border-family-blue' },
    'pastel-pink': { bg: 'bg-family-pink', text: 'text-family-pink', light: 'bg-family-pink/20', border: 'border-family-pink' },
    'pastel-green': { bg: 'bg-family-green', text: 'text-family-green', light: 'bg-family-green/20', border: 'border-family-green' },
    'pastel-purple': { bg: 'bg-family-purple', text: 'text-family-purple', light: 'bg-family-purple/20', border: 'border-family-purple' },
    'pastel-yellow': { bg: 'bg-family-orange', text: 'text-family-orange', light: 'bg-family-orange/20', border: 'border-family-orange' },
    'pastel-orange': { bg: 'bg-family-orange', text: 'text-family-orange', light: 'bg-family-orange/20', border: 'border-family-orange' },
};

// Transfer Task Modal Component
const TransferTaskModal = ({ task, onTransfer, onClose }) => {
    const [taskLists, setTaskLists] = useState([]);
    const [selectedList, setSelectedList] = useState('');
    const [loading, setLoading] = useState(true);
    const [transferring, setTransferring] = useState(false);

    useEffect(() => {
        const fetchLists = async () => {
            try {
                const lists = await api.getGoogleTaskLists();
                setTaskLists(lists.filter(list => list.id !== task.listId));
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch task lists:', error);
                setLoading(false);
            }
        };
        fetchLists();
    }, [task.listId]);

    const handleTransfer = async () => {
        if (!selectedList) return;
        setTransferring(true);
        try {
            await onTransfer(selectedList);
            onClose();
        } catch (error) {
            console.error('Transfer failed:', error);
        }
        setTransferring(false);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-md animate-scale-in">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Transfer Task</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors touch-target">
                        <X size={24} />
                    </button>
                </div>

                <div className="mb-4">
                    <p className="text-white/60 text-sm mb-1">Task: <strong className="text-white">{task.title}</strong></p>
                    <p className="text-white/60 text-sm">From: <strong className="text-white">{task.listName}</strong></p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="animate-spin text-white/40" size={32} />
                    </div>
                ) : taskLists.length === 0 ? (
                    <p className="text-white/40 text-center py-8">No other task lists available</p>
                ) : (
                    <>
                        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                            {taskLists.map((list) => (
                                <button
                                    key={list.id}
                                    onClick={() => setSelectedList(list.id)}
                                    className={cn(
                                        "w-full p-3 rounded-xl text-left transition-all",
                                        selectedList === list.id
                                            ? "bg-primary text-white"
                                            : "bg-white/5 hover:bg-white/10"
                                    )}
                                >
                                    {list.title}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleTransfer}
                            disabled={!selectedList || transferring}
                            className={cn(
                                "w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 touch-target",
                                selectedList && !transferring
                                    ? "bg-primary text-white hover:bg-primary/80"
                                    : "bg-white/10 text-white/40 cursor-not-allowed"
                            )}
                        >
                            {transferring ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <ArrowRightLeft size={18} />
                            )}
                            {transferring ? 'Transferring...' : 'Transfer Task'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const Tasks = () => {
    const dispatch = useDispatch();
    const { chores, familyMembers, googleTasks, confettiVisible, loading } = useSelector((state) => state.tasks);
    const [selectedMember, setSelectedMember] = useState(null);
    const [completingTask, setCompletingTask] = useState(null);
    const [transferringTask, setTransferringTask] = useState(null);
    const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' or 'analytics'

    useEffect(() => {
        dispatch(fetchTasks());
    }, [dispatch]);

    // Combine all tasks
    const allTasks = [...chores, ...googleTasks];

    const getTasksByMember = (memberName) => {
        return allTasks.filter(task =>
            task.assignedTo === memberName || task.listName === memberName
        );
    };

    const getMemberStats = (memberName) => {
        const tasks = getTasksByMember(memberName);
        const completed = tasks.filter(t => t.completed || t.status === 'completed').length;
        const total = tasks.length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { completed, total, percent };
    };

    const handleCompleteTask = async (task, e) => {
        e?.stopPropagation();
        setCompletingTask(task.id);
        try {
            if (task.googleTaskId) {
                // Use Redux thunk for Google Task completion to trigger sync middleware
                await dispatch(completeGoogleTaskAsync({
                    listId: task.listId,
                    taskId: task.googleTaskId
                }));
            } else {
                await dispatch(toggleChoreAsync(task.id));
            }
            // No need for fetchTasks() - thunks already refetch and middleware syncs dashboard
        } catch (error) {
            console.error('Failed to complete task:', error);
        }
        setCompletingTask(null);
    };

    const handleTransferTask = async (targetListId) => {
        if (!transferringTask) return;
        try {
            await api.transferGoogleTask(
                transferringTask.listId,
                transferringTask.googleTaskId,
                targetListId
            );
            dispatch(fetchTasks()); // Refresh tasks
        } catch (error) {
            console.error('Failed to transfer task:', error);
        } finally {
            setTransferringTask(null);
        }
    };

    // Filter members to show
    const displayMembers = selectedMember
        ? familyMembers.filter(m => m.id === selectedMember)
        : familyMembers;

    // Loading state
    if (loading && chores.length === 0 && googleTasks.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="animate-spin text-white/40" size={48} />
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col gap-3 animate-fade-in">
            {/* Transfer Task Modal */}
            {transferringTask && (
                <TransferTaskModal
                    task={transferringTask}
                    onTransfer={handleTransferTask}
                    onClose={() => setTransferringTask(null)}
                />
            )}

            {/* Header with Tabs */}
            <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold">Tasks</h1>
                <div className="flex bg-white/10 rounded-xl p-1">
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            activeTab === 'tasks'
                                ? "bg-primary text-white"
                                : "text-white/60 hover:text-white"
                        )}
                    >
                        <ListTodo size={18} />
                        Tasks
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            activeTab === 'analytics'
                                ? "bg-primary text-white"
                                : "text-white/60 hover:text-white"
                        )}
                    >
                        <BarChart3 size={18} />
                        Analytics
                    </button>
                </div>
            </div>

            {/* Analytics View */}
            {activeTab === 'analytics' && (
                <Suspense fallback={
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="animate-spin text-white/40" size={48} />
                    </div>
                }>
                    <TaskAnalytics familyMembers={familyMembers} />
                </Suspense>
            )}

            {/* Tasks View */}
            {activeTab === 'tasks' && (
                <>
                    {/* Member Filter Pills - Compact */}
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                        <button
                            onClick={() => setSelectedMember(null)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap touch-target",
                                !selectedMember
                                    ? "bg-primary text-white"
                                    : "bg-white/10 text-white/60 hover:bg-white/20"
                            )}
                        >
                            All
                        </button>
                        {familyMembers.map((member) => {
                            const colors = familyColors[member.color] || familyColors['pastel-blue'];
                            const isSelected = selectedMember === member.id;
                            return (
                                <button
                                    key={member.id}
                                    onClick={() => setSelectedMember(isSelected ? null : member.id)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap touch-target",
                                        isSelected
                                            ? `${colors.bg} text-white`
                                            : `${colors.light} ${colors.text} hover:opacity-80`
                                    )}
                                >
                                    {member.name}
                                </button>
                            );
                        })}
                    </div>

                    {/* Member Cards - Horizontal scroll for all personas to fit on screen */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden gap-3 touch-scroll hide-scrollbar flex">
                {displayMembers.map((member, idx) => {
                    const colors = familyColors[member.color] || familyColors['pastel-blue'];
                    const stats = getMemberStats(member.name);
                    const tasks = getTasksByMember(member.name);
                    const pendingTasks = tasks.filter(t => !t.completed && t.status !== 'completed');
                    const completedTasks = tasks.filter(t => t.completed || t.status === 'completed');

                    return (
                        <div
                            key={member.id}
                            className="card animate-slide-up flex-shrink-0 w-64 flex flex-col"
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            {/* Member Header - Compact */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg",
                                    colors.bg
                                )}>
                                    {member.name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h2 className="text-base font-semibold truncate">{member.name}</h2>
                                        <div className="flex items-center gap-0.5 bg-warning/20 px-2 py-0.5 rounded-full flex-shrink-0">
                                            <Star size={14} className="text-warning fill-warning" />
                                            <span className="font-bold text-warning text-xs">{member.points}</span>
                                        </div>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 progress-bar h-1">
                                            <div
                                                className="progress-bar-fill h-1"
                                                style={{ width: `${stats.percent}%` }}
                                            />
                                        </div>
                                        <span className="text-white/50 text-xs whitespace-nowrap">
                                            {stats.completed}/{stats.total}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Pending Tasks - Compact */}
                            <div className="space-y-1 flex-1 overflow-y-auto">
                                {pendingTasks.length === 0 && completedTasks.length === 0 ? (
                                    <p className="text-white/40 text-center text-xs py-4">No tasks</p>
                                ) : (
                                    <>
                                        {pendingTasks.slice(0, 2).map((task) => {
                                            const isCompleting = completingTask === task.id;
                                            const points = task.points || 1;

                                            return (
                                                <div
                                                    key={task.id}
                                                    className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all group"
                                                >
                                                    {/* Checkbox */}
                                                    <button
                                                        onClick={(e) => handleCompleteTask(task, e)}
                                                        disabled={isCompleting}
                                                        className={cn(
                                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all touch-target flex-shrink-0",
                                                            colors.border,
                                                            "hover:bg-success/20 hover:border-success",
                                                            isCompleting && "animate-pulse border-success bg-success/20"
                                                        )}
                                                    >
                                                        <Check
                                                            size={12}
                                                            className={cn(
                                                                "transition-all",
                                                                isCompleting ? "text-success" : "text-transparent group-hover:text-success"
                                                            )}
                                                        />
                                                    </button>

                                                    {/* Task info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-xs truncate">{task.title}</p>
                                                    </div>

                                                    {/* Transfer button - only for Google Tasks */}
                                                    {task.googleTaskId && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setTransferringTask(task);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded touch-target flex-shrink-0"
                                                            title="Transfer to another list"
                                                        >
                                                            <ArrowRightLeft size={14} className="text-white/60" />
                                                        </button>
                                                    )}

                                                    {/* Points */}
                                                    <div className="text-warning/80 flex-shrink-0">
                                                        <Star size={10} className="fill-current inline" />
                                                        <span className="text-xs font-semibold ml-0.5">+{points}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {pendingTasks.length > 2 && (
                                            <p className="text-center text-white/30 text-xs py-1">
                                                +{pendingTasks.length - 2} more
                                            </p>
                                        )}

                                        {/* Completed Tasks - Show count only */}
                                        {completedTasks.length > 0 && (
                                            <div className="flex items-center justify-center gap-1 py-1 mt-1 border-t border-white/10">
                                                <Check size={12} className="text-success" />
                                                <span className="text-xs text-white/50">{completedTasks.length} completed</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* 100% completion badge - Compact */}
                            {stats.percent === 100 && stats.total > 0 && (
                                <div className="mt-2 flex items-center justify-center gap-1 py-2 bg-success/20 rounded-lg text-success text-xs">
                                    <Trophy size={14} />
                                    <span className="font-semibold">Perfect!</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
                </>
            )}

            {/* Confetti Effect */}
            {confettiVisible && (
                <div className="fixed inset-0 pointer-events-none z-50">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: '-20px',
                                animationDelay: `${Math.random() * 0.5}s`,
                                backgroundColor: ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#3B82F6'][
                                    Math.floor(Math.random() * 5)
                                ],
                                width: '10px',
                                height: '10px',
                                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Tasks;
