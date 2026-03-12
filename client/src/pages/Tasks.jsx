import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    ArrowRightLeft,
    CalendarDays,
    Check,
    CheckSquare,
    Clock3,
    History,
    Inbox,
    Loader2,
    Plus,
    Sparkles,
    Trash2,
    Trophy,
    Users,
    X,
} from 'lucide-react';
import {
    completeGoogleTaskAsync,
    createTaskAsync,
    deleteTaskAsync,
    fetchTasks,
    toggleChoreAsync,
} from '../features/tasksSlice';
import { cn } from '../lib/utils';
import api from '../lib/api';
import { EmptyState, PageHeader, PageShell, SurfacePanel } from '../components/ui/ModuleShell';

const TaskAnalytics = React.lazy(() => import('../components/TaskAnalytics'));

const familyColors = {
    'pastel-blue': { bg: 'bg-family-blue', light: 'bg-family-blue/15', text: 'text-family-blue' },
    'pastel-pink': { bg: 'bg-family-pink', light: 'bg-family-pink/15', text: 'text-family-pink' },
    'pastel-green': { bg: 'bg-family-green', light: 'bg-family-green/15', text: 'text-family-green' },
    'pastel-purple': { bg: 'bg-family-purple', light: 'bg-family-purple/15', text: 'text-family-purple' },
    'pastel-yellow': { bg: 'bg-family-orange', light: 'bg-family-orange/15', text: 'text-family-orange' },
    'pastel-orange': { bg: 'bg-family-orange', light: 'bg-family-orange/15', text: 'text-family-orange' },
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

const formatScheduleLabel = (scheduleType) => {
    if (!scheduleType) return 'Flexible';
    return scheduleType.replace(/_/g, ' ');
};

const getTaskMember = (task, familyMembers) => {
    const byId = familyMembers.find((member) => String(member.id) === String(task.assignedMemberId));
    if (byId) return byId;
    return familyMembers.find((member) => member.name === task.assignedTo) || null;
};

const getMemberPalette = (member) => {
    if (!member) return { bg: 'bg-white/10', light: 'bg-white/10', text: 'text-white/70' };
    return familyColors[member.color] || familyColors['pastel-blue'];
};

const groupHistoryEntries = (entries) => entries.reduce((acc, item) => {
    const dateKey = item.completed_at?.split('T')[0] || item.completed_at?.split(' ')[0] || 'Unknown';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
}, {});

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
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="module-modal max-w-md animate-scale-in"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                        <p className="module-kicker">Google Tasks</p>
                        <h3 className="text-2xl font-semibold">Transfer task</h3>
                        <p className="text-sm text-white/55">
                            Move <span className="font-medium text-white">{task.title}</span> into a different list.
                        </p>
                    </div>
                    <button onClick={onClose} className="module-icon-button">
                        <X size={20} />
                    </button>
                </div>

                <div className="mt-5 space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="animate-spin text-white/40" size={32} />
                        </div>
                    ) : taskLists.length === 0 ? (
                        <EmptyState
                            icon={Inbox}
                            title="No other task lists"
                            description="Create another Google Tasks list first, then transfer this item."
                        />
                    ) : (
                        <div className="space-y-2">
                            {taskLists.map((list) => (
                                <button
                                    key={list.id}
                                    onClick={() => setSelectedList(list.id)}
                                    className={cn(
                                        'module-list-item w-full text-left',
                                        selectedList === list.id && 'border-primary/30 bg-primary/10'
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-medium">{list.title}</p>
                                            <p className="text-sm text-white/45">Tap to move this task here</p>
                                        </div>
                                        {selectedList === list.id && (
                                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-white">
                                                <Check size={18} />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-6 flex gap-3">
                    <button onClick={onClose} className="module-action flex-1">
                        Cancel
                    </button>
                    <button
                        onClick={() => onTransfer(selectedList)}
                        disabled={!selectedList}
                        className="module-action module-action-primary flex-1 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ArrowRightLeft size={18} />
                        Move Task
                    </button>
                </div>
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
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="module-modal max-w-lg animate-scale-in"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                        <p className="module-kicker">Routine builder</p>
                        <h3 className="text-2xl font-semibold">New family routine</h3>
                        <p className="text-sm text-white/55">
                            Set the owner, cadence, and points so it lands in the daily task flow correctly.
                        </p>
                    </div>
                    <button onClick={onClose} className="module-icon-button">
                        <X size={20} />
                    </button>
                </div>

                <div className="mt-5 space-y-4">
                    <input
                        type="text"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Routine title"
                        className="module-input"
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                        <select
                            value={assignedMemberId}
                            onChange={(event) => setAssignedMemberId(event.target.value)}
                            className="module-select"
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
                            className="module-input"
                            placeholder="Points"
                        />
                    </div>

                    <div className="module-toolbar grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {[
                            { id: 'daily', label: 'Daily' },
                            { id: 'weekly', label: 'Weekly' },
                            { id: 'specific_days', label: 'Specific days' },
                        ].map((option) => (
                            <button
                                key={option.id}
                                onClick={() => setScheduleType(option.id)}
                                className={cn(
                                    'module-pill w-full',
                                    scheduleType === option.id && 'module-pill-active'
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    {scheduleType === 'specific_days' && (
                        <div className="module-toolbar justify-between gap-2">
                            {dayOptions.map((day) => (
                                <button
                                    key={day.id}
                                    onClick={() => handleToggleDay(day.id)}
                                    className={cn(
                                        'module-pill h-11 w-11 rounded-full px-0',
                                        daysOfWeek.includes(day.id) && 'module-pill-active'
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
                        className="module-input"
                    />
                </div>

                <div className="mt-6 flex gap-3">
                    <button onClick={onClose} className="module-action flex-1">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title.trim()}
                        className="module-action module-action-primary flex-1 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Plus size={18} />
                        Save Routine
                    </button>
                </div>
            </div>
        </div>
    );
};

const TaskRow = ({ task, familyMembers, onToggle, onDelete }) => {
    const member = getTaskMember(task, familyMembers);
    const palette = getMemberPalette(member);

    return (
        <div className={cn('module-list-item group flex items-start gap-4', task.completed && 'opacity-60')}>
            <button
                onClick={() => onToggle(task)}
                className={cn(
                    'mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border transition-all',
                    task.completed
                        ? 'border-success bg-success text-white'
                        : 'border-white/15 bg-white/5 text-white/60 hover:border-success hover:text-success'
                )}
            >
                <Check size={18} />
            </button>

            <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className={cn(
                    'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 text-sm font-semibold text-white',
                    member ? palette.bg : 'bg-white/10'
                )}>
                    {member ? member.name[0] : <Users size={16} />}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className={cn('truncate text-base font-semibold', task.completed && 'line-through text-white/45')}>
                                {task.title}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/45">
                                <span className={cn(
                                    'inline-flex items-center rounded-full border px-2.5 py-1',
                                    member ? `${palette.light} ${palette.text} border-white/5` : 'border-white/10 bg-white/5 text-white/70'
                                )}>
                                    {task.assignedTo || 'Unassigned'}
                                </span>
                                {task.dueTime && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                                        <Clock3 size={12} />
                                        {task.dueTime}
                                    </span>
                                )}
                                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 capitalize">
                                    {formatScheduleLabel(task.scheduleType)}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-2">
                            <span className="rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-sm font-semibold text-warning">
                                {task.points} pts
                            </span>
                            {onDelete && (
                                <button
                                    onClick={() => onDelete(task.id)}
                                    className="module-icon-button h-10 w-10 text-white/45 hover:text-danger"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GoogleTaskRow = ({ task, onComplete, onTransfer }) => (
    <div className="module-list-item">
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="truncate text-base font-semibold">{task.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/45">
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                        {task.assignedTo || task.listName}
                    </span>
                    {task.dueDate && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                            <Clock3 size={12} />
                            due {task.dueDate}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
                <button
                    onClick={() => onComplete(task)}
                    className="module-icon-button h-10 w-10 border-success/30 bg-success/15 text-success"
                >
                    <Check size={16} />
                </button>
                <button
                    onClick={() => onTransfer(task)}
                    className="module-icon-button h-10 w-10"
                >
                    <ArrowRightLeft size={16} />
                </button>
            </div>
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
            ? chores.filter((task) => String(task.assignedMemberId) === String(selectedMember))
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
            ? googleTasks.filter((task) => String(task.assignedMemberId) === String(selectedMember))
            : googleTasks;

        return activeTab === 'history' ? [] : scoped;
    }, [googleTasks, activeTab, selectedMember]);

    const scopedHistory = useMemo(() => (
        selectedMember
            ? history.filter((entry) => String(entry.member_id) === String(selectedMember))
            : history
    ), [history, selectedMember]);

    const memberSnapshots = useMemo(() => (
        familyMembers
            .map((member) => ({
                member,
                dueToday: chores.filter((task) => String(task.assignedMemberId) === String(member.id) && task.dueToday).length,
                dueWeek: chores.filter((task) => String(task.assignedMemberId) === String(member.id) && task.dueThisWeek).length,
                recentCompletions: history.filter((entry) => String(entry.member_id) === String(member.id)).length,
                points: member.points,
            }))
            .sort((a, b) => b.points - a.points || b.recentCompletions - a.recentCompletions)
    ), [familyMembers, chores, history]);

    const dueTodayCount = chores.filter((task) => task.dueToday).length;
    const dueWeekCount = chores.filter((task) => task.dueThisWeek).length;
    const selectedMemberRecord = familyMembers.find((member) => String(member.id) === String(selectedMember)) || null;
    const topMember = memberSnapshots[0];
    const historyByDate = useMemo(() => groupHistoryEntries(scopedHistory), [scopedHistory]);
    const sortedHistoryDates = useMemo(() => Object.keys(historyByDate).sort().reverse(), [historyByDate]);

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
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="animate-spin text-white/40" size={48} />
            </div>
        );
    }

    return (
        <PageShell className="h-full animate-fade-in">
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

            <PageHeader
                icon={CheckSquare}
                eyebrow="Family operations"
                title="Tasks"
                description="Run the home from one board: routines, Google tasks, and completion history stay visible without losing the dashboard energy."
                tone="emerald"
                stats={[
                    { label: 'Due today', value: dueTodayCount, meta: 'local routines' },
                    { label: 'This week', value: dueWeekCount, meta: 'scheduled ahead' },
                    { label: 'Google inbox', value: googleTasks.length, meta: 'external tasks' },
                    { label: 'History', value: history.length, meta: 'recent completions' },
                ]}
                actions={(
                    <button
                        onClick={() => setShowRoutineModal(true)}
                        className="module-action module-action-primary"
                    >
                        <Plus size={18} />
                        New Routine
                    </button>
                )}
            />

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="module-toolbar">
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
                                className={cn('module-pill', activeTab === tab.id && 'module-pill-active')}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="module-inline-chip">
                    <Sparkles size={14} className="text-primary" />
                    {selectedMemberRecord
                        ? `${selectedMemberRecord.name} in focus`
                        : 'All family members in view'}
                </div>
            </div>

            <div className="module-toolbar overflow-x-auto hide-scrollbar">
                <button
                    onClick={() => setSelectedMember(null)}
                    className={cn('module-pill whitespace-nowrap', !selectedMember && 'module-pill-active')}
                >
                    Everyone
                </button>
                {familyMembers.map((member) => {
                    const palette = getMemberPalette(member);
                    const isSelected = String(selectedMember) === String(member.id);

                    return (
                        <button
                            key={member.id}
                            onClick={() => setSelectedMember(isSelected ? null : member.id)}
                            className={cn(
                                'module-pill whitespace-nowrap',
                                isSelected ? 'module-pill-active' : `${palette.light} ${palette.text}`
                            )}
                        >
                            <span className={cn('h-2.5 w-2.5 rounded-full', palette.bg)} />
                            {member.name}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'history' ? (
                <div className="grid flex-1 min-h-0 gap-4 xl:grid-cols-[1.02fr_0.98fr]">
                    <SurfacePanel className="flex min-h-0 flex-col">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="module-kicker">Archive</p>
                                <h2 className="text-2xl font-semibold">Completion history</h2>
                                <p className="mt-1 text-sm text-white/55">
                                    Recent wins, grouped by day and filterable by person.
                                </p>
                            </div>
                            <span className="module-badge">{scopedHistory.length} entries</span>
                        </div>

                        <div className="mt-5 flex-1 space-y-5 overflow-y-auto touch-scroll hide-scrollbar">
                            {sortedHistoryDates.length === 0 ? (
                                <EmptyState
                                    icon={History}
                                    title="No completions yet"
                                    description="Once routines or Google tasks are completed, the log will start building here."
                                />
                            ) : (
                                sortedHistoryDates.map((date) => {
                                    const dayEntries = historyByDate[date];
                                    const displayDate = new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        month: 'short',
                                        day: 'numeric',
                                    });
                                    const totalPoints = dayEntries.reduce((sum, entry) => sum + (entry.points_earned || 0), 0);

                                    return (
                                        <div key={date} className="space-y-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-base font-semibold">{displayDate}</p>
                                                    <p className="text-sm text-white/45">{dayEntries.length} completions logged</p>
                                                </div>
                                                <span className="rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-sm font-semibold text-warning">
                                                    +{totalPoints} pts
                                                </span>
                                            </div>

                                            <div className="space-y-2">
                                                {dayEntries.map((entry) => {
                                                    const entryMember = familyMembers.find((member) => String(member.id) === String(entry.member_id)) || null;
                                                    const palette = getMemberPalette(entryMember);

                                                    return (
                                                        <div key={entry.id} className="module-list-item">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <p className="truncate font-medium">{entry.task_title}</p>
                                                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/45">
                                                                        <span className={cn(
                                                                            'inline-flex items-center rounded-full border px-2.5 py-1',
                                                                            entryMember ? `${palette.light} ${palette.text} border-white/5` : 'border-white/10 bg-white/5 text-white/70'
                                                                        )}>
                                                                            {entry.member_name}
                                                                        </span>
                                                                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 capitalize">
                                                                            {entry.task_source}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right text-sm text-white/45">
                                                                    <p>{new Date(entry.completed_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                                                                    <p className="text-warning">{entry.points_earned} pts</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </SurfacePanel>

                    <div className="min-h-0 overflow-y-auto touch-scroll hide-scrollbar">
                        <Suspense
                            fallback={(
                                <div className="card flex h-full items-center justify-center">
                                    <Loader2 className="animate-spin text-white/40" size={32} />
                                </div>
                            )}
                        >
                            <TaskAnalytics familyMembers={familyMembers} />
                        </Suspense>
                    </div>
                </div>
            ) : (
                <div className="grid flex-1 min-h-0 gap-4 xl:grid-cols-[1.12fr_0.88fr]">
                    <SurfacePanel className="flex min-h-0 flex-col">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="module-kicker">Local routines</p>
                                <h2 className="text-2xl font-semibold">
                                    {activeTab === 'today' ? 'Due today' : 'Due this week'}
                                </h2>
                                <p className="mt-1 text-sm text-white/55">
                                    Family-owned recurring tasks that drive points and the scoreboard.
                                </p>
                            </div>
                            <span className="module-badge">{filteredLocalTasks.length} routines</span>
                        </div>

                        <div className="mt-5 flex-1 space-y-3 overflow-y-auto touch-scroll hide-scrollbar">
                            {filteredLocalTasks.length === 0 ? (
                                <EmptyState
                                    icon={CheckSquare}
                                    title="No routines in this view"
                                    description="Switch the timeframe, clear the member filter, or add a new routine to start filling this board."
                                />
                            ) : (
                                filteredLocalTasks.map((task) => (
                                    <TaskRow
                                        key={task.id}
                                        task={task}
                                        familyMembers={familyMembers}
                                        onToggle={handleCompleteTask}
                                        onDelete={(taskId) => dispatch(deleteTaskAsync(taskId))}
                                    />
                                ))
                            )}
                        </div>
                    </SurfacePanel>

                    <div className="grid min-h-0 gap-4 xl:grid-rows-[auto_minmax(0,1fr)]">
                        <SurfacePanel>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="module-kicker">Momentum</p>
                                    <h2 className="text-2xl font-semibold">Family pulse</h2>
                                    <p className="mt-1 text-sm text-white/55">
                                        Quick snapshot of who is carrying the most points and workload right now.
                                    </p>
                                </div>
                                {topMember && (
                                    <div className="flex items-center gap-2 rounded-full border border-warning/20 bg-warning/10 px-3 py-1.5 text-warning">
                                        <Trophy size={16} />
                                        <span className="text-sm font-semibold">{topMember.member.name}</span>
                                    </div>
                                )}
                            </div>

                            {memberSnapshots.length === 0 ? (
                                <EmptyState
                                    icon={Users}
                                    title="No family members configured"
                                    description="Add members in Settings so routines and points can map correctly."
                                    className="mt-5"
                                />
                            ) : (
                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                    {memberSnapshots.slice(0, 4).map((snapshot, index) => {
                                        const palette = getMemberPalette(snapshot.member);

                                        return (
                                            <div
                                                key={snapshot.member.id}
                                                className={cn(
                                                    'module-metric',
                                                    index === 0 && 'border-warning/30 bg-warning/10'
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            'flex h-12 w-12 items-center justify-center rounded-2xl text-white font-semibold',
                                                            palette.bg
                                                        )}>
                                                            {snapshot.member.name[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold">{snapshot.member.name}</p>
                                                            <p className="text-sm text-white/45">{snapshot.points} total points</p>
                                                        </div>
                                                    </div>
                                                    {index === 0 && (
                                                        <div className="rounded-2xl bg-warning/20 p-2 text-warning">
                                                            <Trophy size={16} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-4 grid grid-cols-3 gap-3">
                                                    <div>
                                                        <p className="text-xl font-semibold">{snapshot.dueToday}</p>
                                                        <p className="text-xs uppercase tracking-[0.18em] text-white/35">Today</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xl font-semibold">{snapshot.dueWeek}</p>
                                                        <p className="text-xs uppercase tracking-[0.18em] text-white/35">Week</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xl font-semibold">{snapshot.recentCompletions}</p>
                                                        <p className="text-xs uppercase tracking-[0.18em] text-white/35">Recent</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </SurfacePanel>

                        <SurfacePanel className="flex min-h-0 flex-col">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="module-kicker">Google tasks</p>
                                    <h2 className="text-2xl font-semibold">External inbox</h2>
                                    <p className="mt-1 text-sm text-white/55">
                                        Task lists mapped from Google stay separate, but still actionable from here.
                                    </p>
                                </div>
                                <span className="module-badge">{filteredGoogleTasks.length} tasks</span>
                            </div>

                            <div className="mt-5 flex-1 space-y-3 overflow-y-auto touch-scroll hide-scrollbar">
                                {filteredGoogleTasks.length === 0 ? (
                                    <EmptyState
                                        icon={Inbox}
                                        title="No Google tasks in this view"
                                        description="Connect or sync Google Tasks from Settings, or clear the member filter to widen the list."
                                    />
                                ) : (
                                    filteredGoogleTasks.map((task) => (
                                        <GoogleTaskRow
                                            key={task.id}
                                            task={task}
                                            onComplete={handleCompleteTask}
                                            onTransfer={setTransferringTask}
                                        />
                                    ))
                                )}
                            </div>
                        </SurfacePanel>
                    </div>
                </div>
            )}

            {loading && (chores.length > 0 || googleTasks.length > 0) && (
                <div className="pointer-events-none fixed inset-x-0 top-6 z-40 flex justify-center">
                    <div className="module-inline-chip bg-black/30">
                        <Loader2 size={14} className="animate-spin" />
                        Syncing task state
                    </div>
                </div>
            )}
        </PageShell>
    );
};

export default Tasks;
