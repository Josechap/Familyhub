import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Link, Check, Loader2, Unlink, RefreshCw, BookOpen, Edit2, Plus, X, Trash2 } from 'lucide-react';
import { API_BASE, GOOGLE_AUTH_URL } from '../lib/config';
import {
    fetchSettings,
    updateSettings,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
} from '../features/settingsSlice';
import { cn } from '../lib/utils';

const colorOptions = [
    { name: 'pastel-blue', hex: '#3B82F6' },
    { name: 'pastel-pink', hex: '#EC4899' },
    { name: 'pastel-green', hex: '#22C55E' },
    { name: 'pastel-yellow', hex: '#F59E0B' },
    { name: 'pastel-purple', hex: '#A855F7' },
    { name: 'pastel-orange', hex: '#F97316' },
];

const colorMap = Object.fromEntries(colorOptions.map(c => [c.name, c.hex]));

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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-md animate-scale-in">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">{member ? 'Edit Member' : 'Add Member'}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors touch-target">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-white/40"
                            placeholder="Enter name"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">Color</label>
                        <div className="flex gap-3 flex-wrap">
                            {colorOptions.map((c) => (
                                <button
                                    key={c.name}
                                    onClick={() => setColor(c.name)}
                                    className={cn(
                                        "w-10 h-10 rounded-full transition-all ring-2",
                                        color === c.name ? "ring-white ring-offset-2 ring-offset-dark-card" : "ring-white/20"
                                    )}
                                    style={{ backgroundColor: c.hex }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors touch-target"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/80 transition-colors flex items-center justify-center gap-2 touch-target"
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
            const res = await fetch(`${API_BASE}/google/status`);
            const data = await res.json();
            setStatus({ ...data, loading: false });
        } catch (error) {
            setStatus({ connected: false, loading: false });
        }
    };

    useEffect(() => {
        checkStatus();
        const params = new URLSearchParams(window.location.search);
        if (params.get('google') === 'connected') {
            checkStatus();
            window.history.replaceState({}, '', '/settings');
        }
    }, []);

    const handleConnect = () => {
        window.location.href = GOOGLE_AUTH_URL;
    };

    const handleDisconnect = async () => {
        if (confirm('Disconnect Google account?')) {
            await fetch(`${API_BASE}/google/disconnect`, { method: 'POST' });
            setStatus({ connected: false, email: null, loading: false });
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            await fetch(`${API_BASE}/google/calendar/events`);
        } finally {
            setSyncing(false);
        }
    };

    if (status.loading) {
        return <Loader2 className="animate-spin text-white/40" size={24} />;
    }

    if (status.connected) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-success/20 rounded-xl border border-success/30">
                    <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                        <Check className="text-success" size={20} />
                    </div>
                    <div>
                        <div className="font-medium text-success">Connected</div>
                        <div className="text-sm text-success/80">{status.email}</div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2 touch-target"
                    >
                        <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                        Sync
                    </button>
                    <button
                        onClick={handleDisconnect}
                        className="flex-1 py-3 bg-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 touch-target"
                    >
                        <Unlink size={18} />
                        Disconnect
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={handleConnect}
            className="w-full py-4 bg-white/5 border-2 border-white/10 rounded-xl font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-3 touch-target"
        >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Connect Google
        </button>
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

    const checkStatus = async () => {
        try {
            const res = await fetch(`${API_BASE}/paprika/status`);
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
            const res = await fetch(`${API_BASE}/paprika/connect`, {
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
        if (confirm('Disconnect Paprika?')) {
            await fetch(`${API_BASE}/paprika/disconnect`, { method: 'POST' });
            setStatus({ connected: false, email: null, loading: false });
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            await fetch(`${API_BASE}/paprika/recipes`);
        } finally {
            setSyncing(false);
        }
    };

    if (status.loading) {
        return <Loader2 className="animate-spin text-white/40" size={24} />;
    }

    if (status.connected) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-success/20 rounded-xl border border-success/30">
                    <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                        <Check className="text-success" size={20} />
                    </div>
                    <div>
                        <div className="font-medium text-success">Connected</div>
                        <div className="text-sm text-success/80">{status.email}</div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2 touch-target"
                    >
                        <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                        Sync
                    </button>
                    <button
                        onClick={handleDisconnect}
                        className="flex-1 py-3 bg-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 touch-target"
                    >
                        <Unlink size={18} />
                        Disconnect
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {error && (
                <p className="text-sm text-red-400 bg-red-500/20 p-3 rounded-lg border border-red-500/30">{error}</p>
            )}
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-white/40"
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-white/40"
            />
            <button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 touch-target"
            >
                {connecting ? <Loader2 size={18} className="animate-spin" /> : <Link size={18} />}
                Connect Paprika
            </button>
        </div>
    );
};

const Settings = () => {
    const dispatch = useDispatch();
    const { familyMembers, loading } = useSelector((state) => state.settings);
    const [editingMember, setEditingMember] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        dispatch(fetchSettings());
    }, [dispatch]);

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
        if (confirm('Delete this family member?')) {
            dispatch(deleteFamilyMember(id));
        }
    };

    if (loading && familyMembers.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="animate-spin text-white/40" size={48} />
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col gap-4 animate-fade-in overflow-y-auto touch-scroll">
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

            <h1 className="text-2xl font-semibold">Settings</h1>

            {/* Family Members Section */}
            <div className="card">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <User size={20} className="text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold">Family Members</h2>
                </div>

                <div className="space-y-3 mb-4">
                    {familyMembers.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl group">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                                style={{ backgroundColor: colorMap[member.color] || '#3B82F6' }}
                            >
                                {member.name[0]}
                            </div>
                            <div className="flex-1">
                                <div className="font-medium">{member.name}</div>
                                <div className="text-xs text-white/50">{member.points} pts</div>
                            </div>
                            <button
                                onClick={() => setEditingMember(member)}
                                className="p-2 text-white/40 hover:text-white transition-colors opacity-0 group-hover:opacity-100 touch-target"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => handleDeleteMember(member.id)}
                                className="p-2 text-white/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 touch-target"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-white/60 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 touch-target"
                >
                    <Plus size={20} />
                    Add Member
                </button>
            </div>

            {/* Integrations Section */}
            <div className="card">
                <h2 className="text-lg font-semibold mb-4">Integrations</h2>

                <div className="space-y-6">
                    {/* Google */}
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            </svg>
                            <span className="font-medium">Google Calendar</span>
                        </div>
                        <GoogleIntegration />
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* Paprika */}
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <BookOpen size={20} className="text-orange-400" />
                            <span className="font-medium">Paprika Recipes</span>
                        </div>
                        <PaprikaIntegration />
                    </div>
                </div>
            </div>

            {/* Quick tip */}
            <div className="card bg-white/5">
                <p className="text-sm text-white/50">
                    💡 Connect your Google account to sync calendar events and tasks. Connect Paprika to sync your recipes.
                </p>
            </div>
        </div>
    );
};

export default Settings;
