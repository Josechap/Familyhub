import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Link, Check, Loader2, Unlink, RefreshCw, BookOpen, Edit2, Plus, X, Trash2, Sun, Moon, Monitor, Timer, Image } from 'lucide-react';
import { API_BASE, GOOGLE_AUTH_URL } from '../lib/config';
import {
    fetchSettings,
    updateSettings,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    setThemeMode,
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

// Google Photos Album Picker Component
const GooglePhotosAlbumPicker = () => {
    const dispatch = useDispatch();
    const { googlePhotosAlbumId, googlePhotosAlbumName } = useSelector((state) => state.settings);
    const [status, setStatus] = useState({ connected: false, hasPhotosScope: false, loading: true });
    const [albums, setAlbums] = useState([]);
    const [loadingAlbums, setLoadingAlbums] = useState(false);
    const [showPicker, setShowPicker] = useState(false);

    const fetchAlbums = async () => {
        setLoadingAlbums(true);
        try {
            const res = await fetch(`${API_BASE}/google/photos/albums`);
            if (res.ok) {
                const data = await res.json();
                setAlbums(data);
            }
        } catch {
            console.error('Failed to fetch albums');
        }
        setLoadingAlbums(false);
    };

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch(`${API_BASE}/google/photos/status`);
                const data = await res.json();
                setStatus({ ...data, loading: false });

                if (data.hasPhotosScope) {
                    fetchAlbums();
                }
            } catch {
                setStatus({ connected: false, hasPhotosScope: false, loading: false });
            }
        };
        checkStatus();
    }, []);

    const handleSelectAlbum = (album) => {
        dispatch(updateSettings({
            googlePhotosAlbumId: album.id,
            googlePhotosAlbumName: album.title,
        }));
        setShowPicker(false);
    };

    const handleClearAlbum = () => {
        dispatch(updateSettings({
            googlePhotosAlbumId: null,
            googlePhotosAlbumName: null,
        }));
    };

    if (status.loading) {
        return <Loader2 className="animate-spin text-white/40" size={24} />;
    }

    if (!status.connected) {
        return (
            <p className="text-white/50 text-sm">
                Connect Google in the Integrations section below to enable photo screensaver.
            </p>
        );
    }

    if (!status.hasPhotosScope) {
        return (
            <div className="space-y-3">
                {status.needsApiEnabled ? (
                    <>
                        <p className="text-amber-400 text-sm font-medium">
                            Photos Library API needs to be enabled
                        </p>
                        <p className="text-white/50 text-sm">
                            1. Enable the API in Google Cloud Console<br/>
                            2. Then click "Reconnect Google" below
                        </p>
                        <a
                            href="https://console.developers.google.com/apis/api/photoslibrary.googleapis.com/overview"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors"
                        >
                            Open Google Cloud Console
                        </a>
                    </>
                ) : (
                    <p className="text-white/50 text-sm">
                        Photos permission needed. Go to Google Integration above and click <strong className="text-white">Disconnect</strong>, then <strong className="text-white">Connect to Google</strong> again.
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Current selection */}
            {googlePhotosAlbumId ? (
                <div className="flex items-center justify-between p-3 bg-success/20 rounded-xl border border-success/30">
                    <div>
                        <p className="text-sm font-medium text-success">Selected Album</p>
                        <p className="text-white">{googlePhotosAlbumName}</p>
                    </div>
                    <button
                        onClick={handleClearAlbum}
                        className="p-2 text-white/40 hover:text-red-400 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            ) : (
                <p className="text-white/50 text-sm">No album selected</p>
            )}

            {/* Album picker button */}
            <button
                onClick={() => {
                    setShowPicker(!showPicker);
                    if (!showPicker && albums.length === 0) {
                        fetchAlbums();
                    }
                }}
                className="w-full py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors"
            >
                {showPicker ? 'Hide Albums' : 'Choose Album'}
            </button>

            {/* Album list */}
            {showPicker && (
                <div className="max-h-60 overflow-y-auto space-y-2 p-2 bg-white/5 rounded-xl">
                    {loadingAlbums ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="animate-spin text-white/40" size={24} />
                        </div>
                    ) : albums.length === 0 ? (
                        <p className="text-white/40 text-center py-4 text-sm">No albums found</p>
                    ) : (
                        albums.map((album) => (
                            <button
                                key={album.id}
                                onClick={() => handleSelectAlbum(album)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                                    googlePhotosAlbumId === album.id
                                        ? "bg-primary text-white"
                                        : "bg-white/5 hover:bg-white/10"
                                )}
                            >
                                {album.coverUrl && (
                                    <img
                                        src={`${album.coverUrl}=w64-h64-c`}
                                        alt=""
                                        className="w-10 h-10 rounded-lg object-cover"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{album.title}</p>
                                    <p className="text-xs text-white/50">{album.itemCount} photos</p>
                                </div>
                                {googlePhotosAlbumId === album.id && (
                                    <Check size={18} />
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
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
        loading
    } = useSelector((state) => state.settings);
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
                        Screensaver shows photos from Google Photos with today's calendar overlay.
                    </p>
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
                <GooglePhotosAlbumPicker />
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
