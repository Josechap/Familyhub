import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Check, Star, Trophy, Sparkles, Loader2, X, Calendar, Plus, Trash2, Edit3 } from 'lucide-react';
import { fetchTasks, toggleChoreAsync, hideConfetti } from '../features/tasksSlice';
import { cn } from '../lib/utils';
import api from '../lib/api';

// Color mapping
const colorMap = {
    'pastel-blue': '#A7C7E7',
    'pastel-pink': '#F4C2C2',
    'pastel-green': '#C1E1C1',
    'pastel-yellow': '#FFFACD',
    'pastel-purple': '#E6E6FA',
};

// Task Modal Component
const TaskModal = ({ task, onClose, onRefresh, isNew = false, defaultListId = null, familyMembers = [] }) => {
    const [title, setTitle] = useState(task?.title || '');
    const [dueDate, setDueDate] = useState(task?.dueDate || '');
    const [notes, setNotes] = useState(task?.notes || '');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [transferring, setTransferring] = useState(false);
    const [transferTarget, setTransferTarget] = useState('');

    const handleComplete = async () => {
        if (!task) return;
        setSaving(true);
        try {
            await api.completeGoogleTask(task.listId, task.googleTaskId);
            onRefresh();
            onClose();
        } catch (error) {
            console.error('Failed to complete task:', error);
        }
        setSaving(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (isNew) {
                await api.createGoogleTask(defaultListId, { title, dueDate, notes });
            } else {
                await api.updateGoogleTask(task.listId, task.googleTaskId, { title, dueDate, notes });
            }
            onRefresh();
            onClose();
        } catch (error) {
            console.error('Failed to save task:', error);
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!task || !confirm('Delete this task?')) return;
        setDeleting(true);
        try {
            await api.deleteGoogleTask(task.listId, task.googleTaskId);
            onRefresh();
            onClose();
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
        setDeleting(false);
    };

    const handleTransfer = async () => {
        if (!task || !transferTarget) return;
        setTransferring(true);
        try {
            // Find list ID for the target member
            // We need to find the list ID that maps to this member.
            // This is a bit tricky since we only have the member ID/Name here.
            // Ideally we should pass available lists to the modal.
            // For now, let's assume we can find it from the task list mapping in the store or similar.
            // Actually, let's look at how we map members.
            // We can iterate over familyMembers and find the one that matches transferTarget.
            // But we need the Google Task List ID. 
            // We should probably pass the available task lists to the modal.
            // Let's assume we pass `googleTaskLists` to the modal.

            await api.transferGoogleTask(task.listId, task.googleTaskId, transferTarget);
            onRefresh();
            onClose();
        } catch (error) {
            console.error('Failed to transfer task:', error);
        }
        setTransferring(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8" onClick={onClose}>
            <div
                className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <h2 className="text-xl font-serif font-bold text-editorial-text">
                        {isNew ? 'New Task' : 'Edit Task'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task title..."
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-blue border border-gray-200"
                        />
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            <Calendar size={14} className="inline mr-1" />
                            Due Date
                        </label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-blue border border-gray-200"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes..."
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-blue border border-gray-200 resize-none"
                        />
                    </div>

                    {/* List info */}
                    {!isNew && task?.listName && (
                        <div className="text-sm text-gray-500">
                            List: <span className="font-medium">{task.listName}</span>
                        </div>
                    )}

                    {/* Transfer */}
                    {!isNew && (
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Transfer to</label>
                            <select
                                value={transferTarget}
                                onChange={(e) => setTransferTarget(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-blue border border-gray-200"
                            >
                                <option value="">Select member...</option>
                                {familyMembers.map(m => {
                                    // We need to find the list ID for this member.
                                    // This requires passing the map of memberId -> listId or similar.
                                    // Or we can just pass the listId if we have it.
                                    // Let's assume we pass `availableLists` prop which contains { id, title, memberId }.
                                    return (
                                        <option key={m.id} value={m.defaultListId}>{m.name}</option>
                                    );
                                })}
                            </select>
                            {transferTarget && (
                                <button
                                    onClick={handleTransfer}
                                    disabled={transferring}
                                    className="mt-2 w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                                >
                                    {transferring ? 'Transferring...' : 'Transfer Task'}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                    {!isNew && (
                        <>
                            <button
                                onClick={handleComplete}
                                disabled={saving}
                                className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <Check size={18} />
                                Complete
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving || !title.trim()}
                        className={cn(
                            "py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2",
                            isNew ? "flex-1 bg-editorial-text text-white hover:bg-gray-800" : "bg-gray-100 hover:bg-gray-200"
                        )}
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Edit3 size={18} />}
                        {isNew ? 'Create' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
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
    const { chores, familyMembers, googleTasks, showConfetti, loading } = useSelector((state) => state.tasks);
    const [selectedTask, setSelectedTask] = useState(null);
    const [newTaskListId, setNewTaskListId] = useState(null);

    // Fetch data on mount
    useEffect(() => {
        dispatch(fetchTasks());
    }, [dispatch]);

    const handleRefresh = () => {
        dispatch(fetchTasks());
    };

    const handleCompleteGoogleTask = async (task, e) => {
        e.stopPropagation(); // Prevent modal from opening
        try {
            await api.completeGoogleTask(task.listId, task.googleTaskId);
            handleRefresh();
        } catch (error) {
            console.error('Failed to complete task:', error);
        }
    };

    // Sort members by points (descending) for leaderboard
    const leaderboard = [...familyMembers].sort((a, b) => b.points - a.points);

    // Group chores by assignee, including Google Tasks
    const choresByMember = familyMembers.map(member => {
        const memberChores = chores.filter(c => c.assignedTo === member.name);

        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const todayStr = today.toLocaleDateString('en-CA'); // YYYY-MM-DD format

        const memberGoogleTasks = googleTasks.filter(t =>
            (t.assignedTo === member.name || t.listName === member.name) &&
            t.dueDate && t.dueDate <= todayStr
        );

        return {
            ...member,
            chores: memberChores,
            googleTasks: memberGoogleTasks,
            pending: memberChores.filter(c => !c.completed).length + memberGoogleTasks.length,
            completed: memberChores.filter(c => c.completed).length,
        };
    });

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

                            {/* Google Tasks */}
                            {member.googleTasks && member.googleTasks.length > 0 && (
                                <>
                                    <div className="flex items-center gap-2 py-1">
                                        <div className="flex-1 h-px bg-blue-200" />
                                        <span className="text-xs text-blue-400">Google Tasks</span>
                                        <div className="flex-1 h-px bg-blue-200" />
                                    </div>
                                    {member.googleTasks.filter(t => t.title).map((task) => (
                                        <div
                                            key={task.id}
                                            onClick={() => setSelectedTask(task)}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors group"
                                        >
                                            <div
                                                onClick={(e) => handleCompleteGoogleTask(task, e)}
                                                className="w-8 h-8 rounded-full border-2 border-blue-300 flex items-center justify-center hover:border-green-400 hover:bg-green-50 transition-colors"
                                            >
                                                <Check className="text-transparent group-hover:text-green-400 transition-colors" size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-editorial-text truncate">{task.title}</div>
                                                {task.dueDate && (
                                                    <div className="text-xs text-gray-500">{task.dueDate}</div>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm('Mark as not completed? This will remove the task without awarding points.')) {
                                                        api.deleteGoogleTask(task.listId, task.googleTaskId).then(handleRefresh);
                                                    }
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </>
                            )}

                            {/* Add Task Button */}
                            {member.googleTasks && (
                                <button
                                    onClick={() => {
                                        const listId = member.googleTasks[0]?.listId || googleTasks.find(t => t.listName === member.name)?.listId;
                                        if (listId) setNewTaskListId(listId);
                                    }}
                                    className="w-full py-2 mt-2 border-2 border-dashed border-blue-200 rounded-xl text-blue-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    <Plus size={16} />
                                    Add Task
                                </button>
                            )}

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

            {/* Task Modal - Edit existing task */}
            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onRefresh={handleRefresh}
                    familyMembers={familyMembers.map(m => ({
                        ...m,
                        defaultListId: googleTasks.find(t => t.assignedTo === m.name)?.listId
                    }))}
                />
            )}

            {/* Task Modal - Create new task */}
            {newTaskListId && (
                <TaskModal
                    task={null}
                    isNew={true}
                    defaultListId={newTaskListId}
                    onClose={() => setNewTaskListId(null)}
                    onRefresh={handleRefresh}
                    familyMembers={familyMembers.map(m => ({
                        ...m,
                        defaultListId: googleTasks.find(t => t.assignedTo === m.name)?.listId
                    }))}
                />
            )}
        </div>
    );
};

export default Tasks;
