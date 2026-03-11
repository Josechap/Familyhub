import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Plus,
    X,
    Loader2,
    CheckSquare,
    CalendarDays,
    History,
    Trash2,
    ArrowRightLeft,
    Check,
} from 'lucide-react';
import {
    fetchTasks,
    toggleChoreAsync,
    completeGoogleTaskAsync,
    createTaskAsync,
    deleteTaskAsync,
} from '../features/tasksSlice';
import { cn } from '../lib/utils';
import api from '../lib/api';

const TaskAnalytics = React.lazy(() => import('../components/TaskAnalytics'));

const familyColors = {
    'pastel-blue': { bg: 'bg-family-blue', light: 'bg-family-blue/20', text: 'text-family-blue' },
    'pastel-pink': { bg: 'bg-family-pink', light: 'bg-family-pink/20', text: 'text-family-pink' },
    'pastel-green': { bg: 'bg-family-green', light: 'bg-family-green/20', text: 'text-family-green' },
    'pastel-purple': { bg: 'bg-family-purple', light: 'bg-family-purple/20', text: 'text-family-purple' },
    'pastel-yellow': { bg: 'bg-family-orange', light: 'bg-family-orange/20', text: 'text-family-orange' },
    'pastel-orange': { bg: 'bg-family-orange', light: 'bg-family-orange/20', text: 'text-family-orange' },
};

const dayOptions = [
    { id: 'mon', label: 'M' },
    { id: 'tue', label: 'T' },
    { id: 'wed', label: 'W' },
    { id: 'thu', label: 'T' },
    { id: 'fri', label: 'F' },
    { id: 'sat', label: 'S' },
    { id: 'sun', label: 'S' },
];

const TransferTaskModal = ({ task, onTransfer, onClose }) => {
    const [taskLists, setTaskLists] = useState([]);
    const [selectedList, setSelectedList] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLists = async () => {
            try {
                const lists = await api.getGoogleTaskLists();
                setTaskLists(lists.filter((list) => list.id !== task.listId));
            } catch (error) {
                console.error('Failed to fetch task lists:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLists();
    }, [task.listId]);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-md animate-scale-in">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Transfer Google Task</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors touch-target">
                        <X size={24} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="animate-spin text-white/40" size={32} />
                    </div>
                ) : (
                    <>
                        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                            {taskLists.map((list) => (
                                <button
                                    key={list.id}
                                    onClick={() => setSelectedList(list.id)}
                                    className={cn(
                                        'w-full p-3 rounded-xl text-left transition-all',
                                        selectedList === list.id
                                            ? 'bg-primary text-white'
                                            : 'bg-white/5 hover:bg-white/10'
                                    )}
                                >
                                    {list.title}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => onTransfer(selectedList)}
                            disabled={!selectedList}
                            className={cn(
                                'w-full py-3 rounded-xl font-medium transition-colors touch-target',
                                selectedList
                                    ? 'bg-primary text-white hover:bg-primary/80'
                                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                            )}
                        >
                            Move Task
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const RoutineModal = ({ familyMembers, onSave, onClose }) => {
    const [title, setTitle] = useState('');
    const [points, setPoints] = useState(1);
    const [assignedMemberId, setAssignedMemberId] = useState(familyMembers[0]?.id || '');
    const [scheduleType, setScheduleType] = useState('daily');
    const [daysOfWeek, setDaysOfWeek] = useState(['mon', 'wed', 'fri']);
    const [dueTime, setDueTime] = useState('18:00');

    const handleToggleDay = (dayId) => {
        setDaysOfWeek((current) => (
            current.includes(dayId)
                ? current.filter((item) => item !== dayId)
                : [...current, dayId]
        ));
    };

    const handleSave = () => {
        onSave({
            title,
            points: Number(points) || 1,
            assignedMemberId,
            assignedTo: familyMembers.find((member) => member.id === assignedMemberId)?.name,
            recurring: scheduleType === 'daily' || scheduleType === 'weekly' ? scheduleType : 'specific_days',
            scheduleType,
            daysOfWeek,
            dueTime,
            active: true,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-lg animate-scale-in">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">New Routine</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors touch-target">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <input
                        type="text"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Routine title"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-white/40"
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <select
                            value={assignedMemberId}
                            onChange={(event) => setAssignedMemberId(event.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none"
                        >
                            {familyMembers.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.name}
                                </option>
                            ))}
                        </select>

                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={points}
                            onChange={(event) => setPoints(event.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: 'daily', label: 'Daily' },
                            { id: 'weekly', label: 'Weekly' },
                            { id: 'specific_days', label: 'Specific Days' },
                        ].map((option) => (
                            <button
                                key={option.id}
                                onClick={() => setScheduleType(option.id)}
                                className={cn(
                                    'py-3 rounded-xl text-sm font-medium transition-colors',
                                    scheduleType === option.id
                                        ? 'bg-primary text-white'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    {scheduleType === 'specific_days' && (
                        <div className="flex gap-2">
                            {dayOptions.map((day) => (
                                <button
                                    key={day.id}
                                    onClick={() => handleToggleDay(day.id)}
                                    className={cn(
                                        'w-10 h-10 rounded-full text-sm transition-colors',
                                        daysOfWeek.includes(day.id)
                                            ? 'bg-primary text-white'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                    )}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                    )}

                    <input
                        type="time"
                        value={dueTime}
                        onChange={(event) => setDueTime(event.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white"
                    />
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors touch-target"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title.trim()}
                        className={cn(
                            'flex-1 py-3 rounded-xl font-medium transition-colors touch-target',
                            title.trim()
                                ? 'bg-primary text-white hover:bg-primary/80'
                                : 'bg-white/10 text-white/40 cursor-not-allowed'
                        )}
                    >
                        Save Routine
                    </button>
                </div>
            </div>
        </div>
    );
};

const TaskRow = ({ task, onToggle, onDelete }) => (
    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
        <button
            onClick={() => onToggle(task)}
            className={cn(
                'mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors touch-target flex-shrink-0',
                task.completed
                    ? 'bg-success border-success'
                    : 'border-white/30 hover:border-success'
            )}
        >
            {task.completed && <Check size={16} />}
        </button>

        <div className="flex-1 min-w-0">
            <p className={cn('font-medium', task.completed && 'line-through text-white/50')}>
                {task.title}
            </p>
            <p className="text-sm text-white/45">
                {task.assignedTo || 'Unassigned'}
                {task.dueTime ? ` • ${task.dueTime}` : ''}
                {task.scheduleType ? ` • ${task.scheduleType.replace('_', ' ')}` : ''}
            </p>
        </div>

        <div className="flex items-center gap-2">
            <span className="text-sm text-warning font-semibold">{task.points} pts</span>
            {onDelete && (
                <button
                    onClick={() => onDelete(task.id)}
                    className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            )}
        </div>
    </div>
);

const Tasks = () => {
    const dispatch = useDispatch();
    const { chores, familyMembers, googleTasks, history, loading } = useSelector((state) => state.tasks);
    const [selectedMember, setSelectedMember] = useState(null);
    const [activeTab, setActiveTab] = useState('today');
    const [showRoutineModal, setShowRoutineModal] = useState(false);
    const [transferringTask, setTransferringTask] = useState(null);

    useEffect(() => {
        dispatch(fetchTasks());
    }, [dispatch]);

    const filteredLocalTasks = useMemo(() => {
        const scoped = selectedMember
            ? chores.filter((task) => task.assignedMemberId === selectedMember)
            : chores;

        if (activeTab === 'today') {
            return scoped.filter((task) => task.dueToday);
        }

        if (activeTab === 'week') {
            return scoped.filter((task) => task.dueThisWeek);
        }

        return scoped;
    }, [chores, activeTab, selectedMember]);

    const filteredGoogleTasks = useMemo(() => {
        const scoped = selectedMember
            ? googleTasks.filter((task) => task.assignedMemberId === selectedMember)
            : googleTasks;

        return scoped.filter((task) => activeTab !== 'history');
    }, [googleTasks, activeTab, selectedMember]);

    const scopedHistory = useMemo(() => (
        selectedMember
            ? history.filter((entry) => String(entry.member_id) === String(selectedMember))
            : history
    ), [history, selectedMember]);

    const handleCompleteTask = async (task) => {
        try {
            if (task.googleTaskId) {
                await dispatch(completeGoogleTaskAsync({
                    listId: task.listId,
                    taskId: task.googleTaskId,
                }));
            } else {
                await dispatch(toggleChoreAsync(task.id));
            }
        } catch (error) {
            console.error('Failed to complete task:', error);
        }
    };

    const handleTransferTask = async (targetListId) => {
        if (!transferringTask) return;
        try {
            await api.transferGoogleTask(
                transferringTask.listId,
                transferringTask.googleTaskId,
                targetListId
            );
            await dispatch(fetchTasks());
        } catch (error) {
            console.error('Failed to transfer task:', error);
        } finally {
            setTransferringTask(null);
        }
    };

    if (loading && chores.length === 0 && googleTasks.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="animate-spin text-white/40" size={48} />
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col gap-4 animate-fade-in">
            {showRoutineModal && (
                <RoutineModal
                    familyMembers={familyMembers}
                    onSave={async (payload) => {
                        await dispatch(createTaskAsync(payload));
                        setShowRoutineModal(false);
                    }}
                    onClose={() => setShowRoutineModal(false)}
                />
            )}

            {transferringTask && (
                <TransferTaskModal
                    task={transferringTask}
                    onTransfer={handleTransferTask}
                    onClose={() => setTransferringTask(null)}
                />
            )}

            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-semibold">Tasks</h1>
                    <p className="text-white/50">Routine-driven family ops with Google tasks kept separate.</p>
                </div>

                <button
                    onClick={() => setShowRoutineModal(true)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary text-white hover:bg-primary/80 transition-colors"
                >
                    <Plus size={18} />
                    New Routine
                </button>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex bg-white/10 rounded-xl p-1.5">
                    {[
                        { id: 'today', label: 'Today', icon: CheckSquare },
                        { id: 'week', label: 'Week', icon: CalendarDays },
                        { id: 'history', label: 'History', icon: History },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2.5 rounded-lg text-base font-medium transition-all',
                                    activeTab === tab.id
                                        ? 'bg-primary text-white'
                                        : 'text-white/60 hover:text-white'
                                )}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                    <button
                        onClick={() => setSelectedMember(null)}
                        className={cn(
                            'px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap touch-target',
                            !selectedMember
                                ? 'bg-primary text-white'
                                : 'bg-white/10 text-white/60 hover:bg-white/20'
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
                                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap touch-target',
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
            </div>

            {activeTab === 'history' ? (
                <div className="grid grid-cols-1 xl:grid-cols-[1.1fr,0.9fr] gap-4 flex-1 overflow-hidden">
                    <div className="card overflow-y-auto">
                        <h2 className="text-xl font-semibold mb-4">Completion History</h2>
                        <div className="space-y-2">
                            {scopedHistory.length === 0 ? (
                                <p className="text-white/40">No completions yet.</p>
                            ) : (
                                scopedHistory.map((entry) => (
                                    <div key={entry.id} className="p-3 bg-white/5 rounded-xl">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">{entry.task_title}</p>
                                                <p className="text-sm text-white/45">
                                                    {entry.member_name} • {entry.task_source}
                                                </p>
                                            </div>
                                            <div className="text-right text-sm text-white/50">
                                                <p>{entry.points_earned} pts</p>
                                                <p>{new Date(entry.completed_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <Suspense fallback={<div className="card flex items-center justify-center"><Loader2 className="animate-spin text-white/40" size={32} /></div>}>
                        <TaskAnalytics familyMembers={familyMembers} />
                    </Suspense>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-[1.2fr,0.8fr] gap-4 flex-1 overflow-hidden">
                    <div className="card overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">
                                {activeTab === 'today' ? 'Due Today' : 'Due This Week'}
                            </h2>
                            <span className="text-sm text-white/45">{filteredLocalTasks.length} routines</span>
                        </div>

                        <div className="space-y-2">
                            {filteredLocalTasks.length === 0 ? (
                                <p className="text-white/40">No routines in this view.</p>
                            ) : (
                                filteredLocalTasks.map((task) => (
                                    <TaskRow
                                        key={task.id}
                                        task={task}
                                        onToggle={handleCompleteTask}
                                        onDelete={(taskId) => dispatch(deleteTaskAsync(taskId))}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    <div className="card overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Google Tasks</h2>
                            <span className="text-sm text-white/45">{filteredGoogleTasks.length} tasks</span>
                        </div>

                        <div className="space-y-2">
                            {filteredGoogleTasks.length === 0 ? (
                                <p className="text-white/40">No Google tasks mapped to this view.</p>
                            ) : (
                                filteredGoogleTasks.map((task) => (
                                    <div key={task.id} className="p-3 bg-white/5 rounded-xl">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">{task.title}</p>
                                                <p className="text-sm text-white/45">
                                                    {task.assignedTo || task.listName}
                                                    {task.dueDate ? ` • due ${task.dueDate}` : ''}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleCompleteTask(task)}
                                                    className="p-2 rounded-full bg-success/20 text-success hover:bg-success/30 transition-colors"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setTransferringTask(task)}
                                                    className="p-2 rounded-full bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
                                                >
                                                    <ArrowRightLeft size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
