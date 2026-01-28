import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Link, Check, Loader2, Unlink, RefreshCw, BookOpen, Edit2, Plus, X, Trash2, Sun, Moon, Monitor, Timer, Image, Play, AlertTriangle } from 'lucide-react';
import { API_BASE, GOOGLE_AUTH_URL } from '../lib/config';
import api from '../lib/api';
import {
    fetchSettings,
    updateSettings,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    setThemeMode,
} from '../features/settingsSlice';
import { setScreensaverActive } from '../features/appSlice';
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
        } catch {
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

// Local Photos Configuration Component
const LocalPhotosConfig = () => {
    const dispatch = useDispatch();
    const { localPhotosPath } = useSelector((state) => state.settings);
    const [config, setConfig] = useState({ path: null, photoCount: 0, isValid: false, loading: true });
    const [inputPath, setInputPath] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch(`${API_BASE}/photos/config`);
                const data = await res.json();
                setConfig({ ...data, loading: false });
                setInputPath(data.path || '');
            } catch {
                setConfig({ path: null, photoCount: 0, isValid: false, loading: false });
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        if (!inputPath.trim()) {
            setError('Please enter a folder path');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE}/photos/config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: inputPath.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to save');
            } else {
                setConfig({ ...data, loading: false });
                dispatch(updateSettings({ localPhotosPath: data.path }));
            }
        } catch {
            setError('Failed to save configuration');
        }
        setSaving(false);
    };

    const handleClear = async () => {
        setSaving(true);
        try {
            await fetch(`${API_BASE}/photos/config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: null }),
            });
            setConfig({ path: null, photoCount: 0, isValid: false, loading: false });
            setInputPath('');
            dispatch(updateSettings({ localPhotosPath: null }));
        } catch {
            setError('Failed to clear configuration');
        }
        setSaving(false);
    };

    if (config.loading) {
        return <Loader2 className="animate-spin text-white/40" size={24} />;
    }

    return (
        <div className="space-y-4">
            {/* Current configuration */}
            {config.isValid && config.path ? (
                <div className="flex items-center justify-between p-3 bg-success/20 rounded-xl border border-success/30">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-success">Photos Folder Configured</p>
                        <p className="text-white text-sm truncate">{config.path}</p>
                        <p className="text-success/80 text-xs">{config.photoCount} photos found</p>
                    </div>
                    <button
                        onClick={handleClear}
                        disabled={saving}
                        className="p-2 text-white/40 hover:text-red-400 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            ) : (
                <>
                    <p className="text-white/50 text-sm">
                        Enter the path to a folder containing photos for the screensaver.
                    </p>

                    {error && (
                        <p className="text-sm text-red-400 bg-red-500/20 p-3 rounded-lg border border-red-500/30">
                            {error}
                        </p>
                    )}

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputPath}
                            onChange={(e) => setInputPath(e.target.value)}
                            placeholder="/path/to/photos"
                            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-white/40 text-sm"
                        />
                        <button
                            onClick={handleSave}
                            disabled={saving || !inputPath.trim()}
                            className="px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            Save
                        </button>
                    </div>
                </>
            )}

            <p className="text-xs text-white/40">
                Supported formats: JPG, PNG, GIF, WebP, HEIC. Photos will be shuffled randomly.
            </p>
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

    const checkStatus = async () => {
        try {
            const res = await fetch(`${API_BASE}/paprika/status`);
            const data = await res.json();
            setStatus({ ...data, loading: false });
        } catch {
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
        } catch {
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
    const {
        familyMembers,
        themeMode,
        idleReturnTimeout,
        screensaverTimeout,
        screensaverPhotoInterval,
        weatherApiKey,
        location,
        loading
    } = useSelector((state) => state.settings);
    const [editingMember, setEditingMember] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [resetting, setResetting] = useState(false);

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

    const handleThemeChange = (mode) => {
        dispatch(setThemeMode(mode));
        dispatch(updateSettings({ themeMode: mode }));
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

            {/* Appearance Section */}
            <div className="card">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Sun size={20} className="text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold">Appearance</h2>
                </div>

                <div className="space-y-3">
                    <p className="text-sm text-white/60 mb-4">Choose your preferred theme</p>

                    <div className="grid grid-cols-3 gap-3">
                        {/* Auto Mode */}
                        <button
                            onClick={() => handleThemeChange('auto')}
                            className={cn(
                                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all touch-target",
                                themeMode === 'auto'
                                    ? "border-primary bg-primary/10"
                                    : "border-white/10 bg-white/5 hover:border-white/20"
                            )}
                        >
                            <Monitor size={24} className={themeMode === 'auto' ? 'text-primary' : 'text-white/60'} />
                            <span className="text-sm font-medium">Auto</span>
                            <span className="text-xs text-white/40 text-center">System</span>
                        </button>

                        {/* Light Mode */}
                        <button
                            onClick={() => handleThemeChange('light')}
                            className={cn(
                                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all touch-target",
                                themeMode === 'light'
                                    ? "border-primary bg-primary/10"
                                    : "border-white/10 bg-white/5 hover:border-white/20"
                            )}
                        >
                            <Sun size={24} className={themeMode === 'light' ? 'text-primary' : 'text-white/60'} />
                            <span className="text-sm font-medium">Light</span>
                            <span className="text-xs text-white/40">Always on</span>
                        </button>

                        {/* Dark Mode */}
                        <button
                            onClick={() => handleThemeChange('dark')}
                            className={cn(
                                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all touch-target",
                                themeMode === 'dark'
                                    ? "border-primary bg-primary/10"
                                    : "border-white/10 bg-white/5 hover:border-white/20"
                            )}
                        >
                            <Moon size={24} className={themeMode === 'dark' ? 'text-primary' : 'text-white/60'} />
                            <span className="text-sm font-medium">Dark</span>
                            <span className="text-xs text-white/40">Always on</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Weather Settings Section */}
            <div className="card">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <Sun size={20} className="text-yellow-400" />
                    </div>
                    <h2 className="text-lg font-semibold">Weather</h2>
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-white/60">
                        Configure weather to see current conditions and clothing recommendations on the dashboard.
                    </p>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">City or ZIP Code</label>
                        <input
                            type="text"
                            placeholder="e.g., Austin, TX or 78701"
                            defaultValue={location || ''}
                            onBlur={(e) => dispatch(updateSettings({ location: e.target.value }))}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-white/40"
                        />
                    </div>

                    {/* API Key */}
                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">
                            OpenWeatherMap API Key
                            <a
                                href="https://openweathermap.org/api"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary text-xs ml-2 hover:underline"
                            >
                                (Get free key)
                            </a>
                        </label>
                        <input
                            type="password"
                            placeholder="Enter your API key"
                            defaultValue={weatherApiKey || ''}
                            onBlur={(e) => dispatch(updateSettings({ weatherApiKey: e.target.value }))}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-white/40"
                        />
                    </div>

                    <p className="text-xs text-white/40">
                        💡 Weather data powers the "What to Wear" recommendations based on temperature and conditions.
                    </p>
                </div>
            </div>

            {/* Display Settings Section */}
            <div className="card">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Timer size={20} className="text-cyan-400" />
                    </div>
                    <h2 className="text-lg font-semibold">Display & Screensaver</h2>
                </div>

                <div className="space-y-6">
                    {/* Idle Return Timeout */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">Return to Dashboard after idle</label>
                            <span className="text-sm text-primary font-semibold">{idleReturnTimeout} min</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            value={idleReturnTimeout}
                            onChange={(e) => dispatch(updateSettings({ idleReturnTimeout: parseInt(e.target.value, 10) }))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-xs text-white/40 mt-1">
                            <span>1 min</span>
                            <span>30 min</span>
                        </div>
                    </div>

                    {/* Screensaver Timeout */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">Screensaver after idle</label>
                            <span className="text-sm text-primary font-semibold">{screensaverTimeout} min</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="60"
                            step="5"
                            value={screensaverTimeout}
                            onChange={(e) => dispatch(updateSettings({ screensaverTimeout: parseInt(e.target.value, 10) }))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-xs text-white/40 mt-1">
                            <span>5 min</span>
                            <span>60 min</span>
                        </div>
                    </div>

                    {/* Photo Interval */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">Photo transition interval</label>
                            <span className="text-sm text-primary font-semibold">{screensaverPhotoInterval} sec</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="120"
                            step="10"
                            value={screensaverPhotoInterval}
                            onChange={(e) => dispatch(updateSettings({ screensaverPhotoInterval: parseInt(e.target.value, 10) }))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-xs text-white/40 mt-1">
                            <span>10 sec</span>
                            <span>2 min</span>
                        </div>
                    </div>

                    <p className="text-xs text-white/40">
                        Screensaver shows photos from a local folder with today's calendar overlay.
                    </p>

                    {/* Test Screensaver Button */}
                    <button
                        onClick={() => dispatch(setScreensaverActive(true))}
                        className="w-full py-3 bg-cyan-500/20 text-cyan-400 rounded-xl font-medium hover:bg-cyan-500/30 transition-colors flex items-center justify-center gap-2 touch-target"
                    >
                        <Play size={18} />
                        Test Screensaver
                    </button>
                </div>
            </div>

            {/* Google Photos Section */}
            <div className="card">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                        <Image size={20} className="text-pink-400" />
                    </div>
                    <h2 className="text-lg font-semibold">Screensaver Photos</h2>
                </div>
                <LocalPhotosConfig />
            </div>

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

            {/* Danger Zone */}
            <div className="card border-2 border-red-500/30">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle size={20} className="text-red-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="font-medium text-white mb-1">Reset Database</h3>
                        <p className="text-sm text-white/50 mb-3">
                            This will permanently delete all family members, local tasks, calendar events, recipes, meal plans, and task history. Google Calendar and Paprika data will NOT be affected (they sync from external sources). Settings and integrations will be preserved.
                        </p>
                        <button
                            onClick={async () => {
                                const confirmed = confirm(
                                    '⚠️ Are you sure you want to reset the database?\n\nThis will delete:\n• All family members\n• All local tasks and points\n• All calendar events\n• All recipes\n• All meal plans\n• All task completion history\n\nThis action cannot be undone!'
                                );
                                if (!confirmed) return;

                                const doubleConfirm = prompt('Type "RESET" to confirm:');
                                if (doubleConfirm !== 'RESET') {
                                    alert('Reset cancelled.');
                                    return;
                                }

                                setResetting(true);
                                try {
                                    await api.resetDatabase();
                                    alert('Database reset successfully! The page will now reload.');
                                    window.location.reload();
                                } catch (error) {
                                    alert('Failed to reset database: ' + error.message);
                                } finally {
                                    setResetting(false);
                                }
                            }}
                            disabled={resetting}
                            className="py-3 px-6 bg-red-500/20 text-red-400 border border-red-500/40 rounded-xl font-medium hover:bg-red-500/30 transition-colors flex items-center gap-2 touch-target"
                        >
                            {resetting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                            {resetting ? 'Resetting...' : 'Reset Database'}
                        </button>
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

