import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Palette, Moon, Clock, Target, Cloud, Trash2, Edit2, Plus, X, Check, Loader2, Link, Unlink, RefreshCw, BookOpen } from 'lucide-react';
import {
    fetchSettings,
    updateSettings,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
} from '../features/settingsSlice';
import { cn } from '../lib/utils';

// Available colors
const colorOptions = [
    { name: 'pastel-blue', hex: '#A7C7E7' },
    { name: 'pastel-pink', hex: '#F4C2C2' },
    { name: 'pastel-green', hex: '#C1E1C1' },
    { name: 'pastel-yellow', hex: '#FFFACD' },
    { name: 'pastel-purple', hex: '#E6E6FA' },
    { name: 'pastel-orange', hex: '#FFDAB9' },
];

const colorMap = Object.fromEntries(colorOptions.map(c => [c.name, c.hex]));

// Toggle component
const Toggle = ({ enabled, onChange }) => (
    <button
        onClick={() => onChange(!enabled)}
        className={cn(
            "relative w-12 h-6 rounded-full transition-colors",
            enabled ? "bg-pastel-green" : "bg-gray-300"
        )}
    >
        <div
            className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform",
                enabled ? "translate-x-7" : "translate-x-1"
            )}
        />
    </button>
);

// Family member row
const FamilyMemberRow = ({ member, onEdit, onDelete }) => (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
        <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white"
            style={{ backgroundColor: colorMap[member.color] || '#A7C7E7' }}
        >
            {member.name[0]}
        </div>
        <div className="flex-1">
            <div className="font-medium">{member.name}</div>
            <div className="text-sm text-gray-500">{member.points} pts</div>
        </div>
        <button
            onClick={() => onEdit(member)}
            className="p-2 text-gray-400 hover:text-editorial-text transition-colors"
        >
            <Edit2 size={18} />
        </button>
        <button
            onClick={() => onDelete(member.id)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
        >
            <Trash2 size={18} />
        </button>
    </div>
);

// Add/Edit member modal
const MemberModal = ({ member, onSave, onClose }) => {
    const [name, setName] = useState(member?.name || '');
    const [color, setColor] = useState(member?.color || 'pastel-blue');

    const handleSave = () => {
        if (name.trim()) {
            onSave({ id: member?.id, name: name.trim(), color });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-serif">{member ? 'Edit Member' : 'Add Member'}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-blue"
                            placeholder="Enter name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Color</label>
                        <div className="flex gap-3 flex-wrap">
                            {colorOptions.map((c) => (
                                <button
                                    key={c.name}
                                    onClick={() => setColor(c.name)}
                                    className={cn(
                                        "w-10 h-10 rounded-full transition-all",
                                        color === c.name && "ring-2 ring-offset-2 ring-editorial-text"
                                    )}
                                    style={{ backgroundColor: c.hex }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 bg-editorial-text text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <Check size={18} />
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

// Google Integration Component
const GoogleIntegration = () => {
    const [status, setStatus] = useState({ connected: false, email: null, loading: true });
    const [syncing, setSyncing] = useState(false);

    const checkStatus = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/google/status');
            const data = await res.json();
            setStatus({ ...data, loading: false });
        } catch (error) {
            setStatus({ connected: false, loading: false });
        }
    };

    useEffect(() => {
        checkStatus();
        // Check for OAuth redirect result
        const params = new URLSearchParams(window.location.search);
        if (params.get('google') === 'connected') {
            checkStatus();
            window.history.replaceState({}, '', '/settings');
        }
    }, []);

    const handleConnect = () => {
        window.location.href = 'http://localhost:3001/api/google/auth';
    };

    const handleDisconnect = async () => {
        if (confirm('Disconnect Google account? Calendar events from Google will no longer appear.')) {
            await fetch('http://localhost:3001/api/google/disconnect', { method: 'POST' });
            setStatus({ connected: false, email: null, loading: false });
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            await fetch('http://localhost:3001/api/google/calendar/events');
            // Could dispatch an action here to refresh calendar
        } finally {
            setSyncing(false);
        }
    };

    if (status.loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
        );
    }

    if (status.connected) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="text-green-600" size={20} />
                    </div>
                    <div className="flex-1">
                        <div className="font-medium text-green-800">Connected</div>
                        <div className="text-sm text-green-600">{status.email}</div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex-1 py-3 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                        Sync Now
                    </button>
                    <button
                        onClick={handleDisconnect}
                        className="py-3 px-4 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
                    >
                        <Unlink size={18} />
                        Disconnect
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-500">
                Connect your Google account to sync calendar events and tasks.
            </p>
            <button
                onClick={handleConnect}
                className="w-full py-3 bg-white border-2 border-gray-200 rounded-xl font-medium hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-3"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Connect Google Account
            </button>
        </div>
    );
};

// Paprika Integration Component
const PaprikaIntegration = () => {
    const [status, setStatus] = useState({ connected: false, email: null, loading: true });
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [recipeCount, setRecipeCount] = useState(0);

    const checkStatus = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/paprika/status');
            const data = await res.json();
            setStatus({ ...data, loading: false });
        } catch (err) {
            setStatus({ connected: false, loading: false });
        }
    };

    useEffect(() => {
        checkStatus();
    }, []);

    const handleConnect = async () => {
        if (!email || !password) {
            setError('Email and password required');
            return;
        }
        setConnecting(true);
        setError('');
        try {
            const res = await fetch('http://localhost:3001/api/paprika/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to connect');
            } else {
                checkStatus();
                setEmail('');
                setPassword('');
            }
        } catch (err) {
            setError('Connection failed');
        }
        setConnecting(false);
    };

    const handleDisconnect = async () => {
        if (confirm('Disconnect Paprika? Your recipes will no longer sync.')) {
            await fetch('http://localhost:3001/api/paprika/disconnect', { method: 'POST' });
            setStatus({ connected: false, email: null, loading: false });
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch('http://localhost:3001/api/paprika/recipes');
            const data = await res.json();
            setRecipeCount(data.fetched || 0);
        } finally {
            setSyncing(false);
        }
    };

    if (status.loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
        );
    }

    if (status.connected) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="text-green-600" size={20} />
                    </div>
                    <div className="flex-1">
                        <div className="font-medium text-green-800">Connected</div>
                        <div className="text-sm text-green-600">{status.email}</div>
                    </div>
                </div>
                {recipeCount > 0 && (
                    <p className="text-sm text-gray-500">{recipeCount} recipes synced</p>
                )}
                <div className="flex gap-3">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex-1 py-3 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                        Sync Recipes
                    </button>
                    <button
                        onClick={handleDisconnect}
                        className="py-3 px-4 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
                    >
                        <Unlink size={18} />
                        Disconnect
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-500">
                Connect your Paprika account to sync your recipes.
            </p>
            {error && (
                <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>
            )}
            <input
                type="email"
                placeholder="Paprika email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 border border-gray-200"
            />
            <input
                type="password"
                placeholder="Paprika password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 border border-gray-200"
            />
            <button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
            >
                {connecting ? <Loader2 size={18} className="animate-spin" /> : <Link size={18} />}
                Connect Paprika
            </button>
        </div>
    );
};

// Task List Mapping Component
const TaskListMapping = ({ familyMembers }) => {
    const [taskLists, setTaskLists] = useState([]);
    const [mappings, setMappings] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch task lists
                const listsRes = await fetch('http://localhost:3001/api/google/tasks/lists');
                if (listsRes.ok) {
                    const lists = await listsRes.json();
                    setTaskLists(lists);

                    // Auto-map based on name matching
                    const autoMappings = {};
                    lists.forEach(list => {
                        const matchedMember = familyMembers.find(m =>
                            list.title.toLowerCase().includes(m.name.toLowerCase()) ||
                            m.name.toLowerCase().includes(list.title.toLowerCase())
                        );
                        if (matchedMember) {
                            autoMappings[list.id] = matchedMember.id;
                        }
                    });
                    setMappings(autoMappings);
                }
            } catch (error) {
                console.error('Failed to fetch task lists:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [familyMembers]);

    const handleMappingChange = (listId, memberId) => {
        setMappings(prev => ({
            ...prev,
            [listId]: memberId || null,
        }));
        // Save to settings
        fetch('http://localhost:3001/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [`taskListMapping_${listId}`]: memberId || '' }),
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
        );
    }

    if (taskLists.length === 0) {
        return (
            <p className="text-sm text-gray-500">
                No Google Task lists found. Connect Google to see your task lists.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">
                Map each Google Task list to a family member.
            </p>
            {taskLists.map(list => (
                <div key={list.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1 font-medium">{list.title}</div>
                    <select
                        value={mappings[list.id] || ''}
                        onChange={(e) => handleMappingChange(list.id, e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pastel-blue"
                    >
                        <option value="">Not assigned</option>
                        {familyMembers.map(member => (
                            <option key={member.id} value={member.id}>
                                {member.name}
                            </option>
                        ))}
                    </select>
                </div>
            ))}
        </div>
    );
};

// Calendar Event Mapping Component
const CalendarEventMapping = ({ familyMembers }) => {
    const [events, setEvents] = useState([]);
    const [mappings, setMappings] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch calendar events
                const eventsRes = await fetch('http://localhost:3001/api/google/calendar/events');
                if (eventsRes.ok) {
                    const eventsData = await eventsRes.json();
                    setEvents(eventsData);

                    // Load existing mappings from events
                    const existingMappings = {};
                    eventsData.forEach(event => {
                        if (event.member && event.member !== 'Family') {
                            existingMappings[event.googleEventId] = event.member;
                        }
                    });
                    setMappings(existingMappings);
                }
            } catch (error) {
                console.error('Failed to fetch calendar events:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleMappingChange = async (eventId, memberName) => {
        setMappings(prev => ({
            ...prev,
            [eventId]: memberName || null,
        }));
        // Save to settings
        await fetch('http://localhost:3001/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [`calendarEventMapping_${eventId}`]: memberName || '' }),
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <p className="text-sm text-gray-500">
                No upcoming calendar events. Connect Google to see your events.
            </p>
        );
    }

    // Group events by date
    const eventsByDate = events.reduce((acc, event) => {
        if (!acc[event.date]) acc[event.date] = [];
        acc[event.date].push(event);
        return acc;
    }, {});

    return (
        <div className="space-y-3 max-h-64 overflow-y-auto">
            <p className="text-sm text-gray-500 mb-4">
                Assign events to family members (or use [Name] prefix in event title).
            </p>
            {Object.entries(eventsByDate).slice(0, 7).map(([date, dateEvents]) => (
                <div key={date} className="space-y-2">
                    <div className="text-xs text-gray-400 uppercase font-medium">
                        {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    {dateEvents.map(event => (
                        <div key={event.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{event.title}</div>
                            </div>
                            <select
                                value={mappings[event.googleEventId] || event.member || ''}
                                onChange={(e) => handleMappingChange(event.googleEventId, e.target.value)}
                                className="px-2 py-1 text-sm bg-white border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-pastel-blue"
                            >
                                <option value="">Family</option>
                                {familyMembers.map(member => (
                                    <option key={member.id} value={member.name}>
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

const Settings = () => {
    const dispatch = useDispatch();
    const { darkMode, use24Hour, weeklyGoal, weatherApiKey, location, familyMembers, loading } = useSelector((state) => state.settings);
    const [editingMember, setEditingMember] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [localWeeklyGoal, setLocalWeeklyGoal] = useState(weeklyGoal);

    useEffect(() => {
        dispatch(fetchSettings());
    }, [dispatch]);

    useEffect(() => {
        setLocalWeeklyGoal(weeklyGoal);
    }, [weeklyGoal]);

    const handleToggleDarkMode = () => {
        dispatch(updateSettings({ darkMode: !darkMode }));
    };

    const handleToggle24Hour = () => {
        dispatch(updateSettings({ use24Hour: !use24Hour }));
    };

    const handleWeeklyGoalBlur = () => {
        if (localWeeklyGoal !== weeklyGoal) {
            dispatch(updateSettings({ weeklyGoal: localWeeklyGoal }));
        }
    };

    const handleSaveMember = (data) => {
        if (data.id) {
            dispatch(updateFamilyMember(data));
        } else {
            dispatch(addFamilyMember(data));
        }
        setEditingMember(null);
        setShowAddModal(false);
    };

    const handleDeleteMember = (id) => {
        if (confirm('Delete this family member? Their chores and events will also be removed.')) {
            dispatch(deleteFamilyMember(id));
        }
    };

    if (loading && familyMembers.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-400" size={48} />
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col overflow-y-auto">
            {/* Modals */}
            {(editingMember || showAddModal) && (
                <MemberModal
                    member={editingMember}
                    onSave={handleSaveMember}
                    onClose={() => {
                        setEditingMember(null);
                        setShowAddModal(false);
                    }}
                />
            )}

            <h1 className="text-3xl mb-6 font-serif">Settings</h1>

            <div className="grid grid-cols-2 gap-6">
                {/* Family Members */}
                <div className="bg-white rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <User className="text-pastel-blue" size={24} />
                        <h2 className="text-xl font-serif">Family Members</h2>
                    </div>

                    <div className="space-y-3 mb-4">
                        {familyMembers.map((member) => (
                            <FamilyMemberRow
                                key={member.id}
                                member={member}
                                onEdit={setEditingMember}
                                onDelete={handleDeleteMember}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-pastel-blue hover:text-pastel-blue transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={20} />
                        Add Family Member
                    </button>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Google Integration */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <Link className="text-blue-500" size={24} />
                            <h2 className="text-xl font-serif">Google Calendar</h2>
                        </div>
                        <GoogleIntegration />
                    </div>

                    {/* Task List Mapping */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <Check className="text-pastel-green" size={24} />
                            <h2 className="text-xl font-serif">Task Lists</h2>
                        </div>
                        <TaskListMapping familyMembers={familyMembers} />
                    </div>

                    {/* Calendar Event Mapping */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <Clock className="text-pastel-purple" size={24} />
                            <h2 className="text-xl font-serif">Event Assignments</h2>
                        </div>
                        <CalendarEventMapping familyMembers={familyMembers} />
                    </div>

                    {/* Paprika Recipes */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <BookOpen className="text-orange-500" size={24} />
                            <h2 className="text-xl font-serif">Paprika Recipes</h2>
                        </div>
                        <PaprikaIntegration />
                    </div>

                    {/* Display Settings */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <Palette className="text-pastel-pink" size={24} />
                            <h2 className="text-xl font-serif">Display</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <Moon size={20} className="text-gray-400" />
                                    <span>Dark Mode</span>
                                </div>
                                <Toggle enabled={darkMode} onChange={handleToggleDarkMode} />
                            </div>

                            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <Clock size={20} className="text-gray-400" />
                                    <span>24-Hour Clock</span>
                                </div>
                                <Toggle enabled={use24Hour} onChange={handleToggle24Hour} />
                            </div>

                            <div className="flex items-center justify-between py-3">
                                <div className="flex items-center gap-3">
                                    <Target size={20} className="text-gray-400" />
                                    <span>Weekly Goal</span>
                                </div>
                                <input
                                    type="number"
                                    value={localWeeklyGoal}
                                    onChange={(e) => setLocalWeeklyGoal(parseInt(e.target.value) || 0)}
                                    onBlur={handleWeeklyGoalBlur}
                                    className="w-24 px-3 py-2 bg-gray-50 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-pastel-blue"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Weather Integrations */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <Cloud className="text-pastel-green" size={24} />
                            <h2 className="text-xl font-serif">Weather</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-500 mb-2">API Key</label>
                                <input
                                    type="text"
                                    placeholder="OpenWeatherMap API key"
                                    defaultValue={weatherApiKey}
                                    onBlur={(e) => dispatch(updateSettings({ weatherApiKey: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-blue"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-500 mb-2">Location</label>
                                <input
                                    type="text"
                                    placeholder="City, Country"
                                    defaultValue={location}
                                    onBlur={(e) => dispatch(updateSettings({ location: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-blue"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
