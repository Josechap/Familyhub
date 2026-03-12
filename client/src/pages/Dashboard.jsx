import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useClock } from '../hooks/useClock';
import { cn } from '../lib/utils';
import {
    fetchDashboardData,
    setScoreboard,
    dismissAnnouncementLocal,
} from '../features/dashboardSlice';
import { fetchSettings } from '../features/settingsSlice';
import { fetchSonosDevices, fetchSonosState } from '../features/sonosSlice';
import { fetchNestDevices } from '../features/nestSlice';
import {
    Calendar,
    CheckSquare,
    ChevronRight,
    CloudSun,
    Crown,
    Music,
    ShoppingCart,
    Sparkles,
    Star,
    Trophy,
    Utensils,
    Waves,
} from 'lucide-react';
import api from '../lib/api';
import TodayStrip from '../components/TodayStrip';
import NestCard from '../components/NestCard';
import NestDetailView from '../components/NestDetailView';
import EventModal from '../components/modals/EventModal';
import MealModal from '../components/modals/MealModal';
import { API_BASE } from '../lib/config';
import { EmptyState, PageShell, SurfacePanel } from '../components/ui/ModuleShell';

const familyColors = {
    'pastel-blue': 'bg-family-blue',
    'pastel-pink': 'bg-family-pink',
    'pastel-green': 'bg-family-green',
    'pastel-purple': 'bg-family-purple',
    'pastel-yellow': 'bg-family-orange',
    'pastel-orange': 'bg-family-orange',
};

const mealCards = [
    {
        key: 'breakfast',
        label: 'Breakfast',
        emoji: '🍳',
        accent: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
    },
    {
        key: 'lunch',
        label: 'Lunch',
        emoji: '🥗',
        accent: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
    },
    {
        key: 'dinner',
        label: 'Dinner',
        emoji: '🍽️',
        accent: 'bg-sky-500/15 text-sky-300 border-sky-500/20',
    },
    {
        key: 'snack',
        label: 'Snack',
        emoji: '🍎',
        accent: 'bg-rose-500/15 text-rose-300 border-rose-500/20',
    },
];

const playlistSuggestions = [
    { name: 'Morning Reset', mood: 'Warm-up the house' },
    { name: 'Dinner Prep', mood: 'Calm background mix' },
    { name: 'Focus Block', mood: 'Low-distraction energy' },
    { name: 'Family Wind Down', mood: 'Easy evening handoff' },
];

const getMemberColor = (memberName, familyMembers) => {
    const member = familyMembers.find((item) => item.name === memberName);
    if (!member) return 'bg-white/30';
    return familyColors[member.color] || 'bg-family-blue';
};

const formatEventDate = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (dateStr === today) return 'Today';
    if (dateStr === tomorrowStr) return 'Tomorrow';

    const date = new Date(`${dateStr}T12:00:00`);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const Dashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { time, date, hours } = useClock();
    const {
        weather,
        clothing,
        upcomingEvents,
        todayTasks,
        todayMeals,
        announcements,
        prepAgenda,
        shopping,
    } = useSelector((state) => state.dashboard);
    const familyMembers = useSelector((state) => state.settings.familyMembers);
    const { playerState, activeDeviceIp } = useSelector((state) => state.sonos);
    const { connected: nestConnected } = useSelector((state) => state.nest);
    const [weeklyStats, setWeeklyStats] = useState({ stats: [] });
    const [showNestDetail, setShowNestDetail] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedMeal, setSelectedMeal] = useState(null);

    const handleAssignEvent = async (eventId, memberName) => {
        await fetch(`${API_BASE}/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [`calendarEventMapping_${eventId}`]: memberName || '' }),
        });
        dispatch(fetchDashboardData());
    };

    const handleDismissAnnouncement = async (announcementId) => {
        try {
            await api.dismissAnnouncement(announcementId);
            dispatch(dismissAnnouncementLocal(announcementId));
        } catch (error) {
            console.error('Failed to dismiss announcement:', error);
        }
    };

    const getGreeting = () => {
        if (hours < 5) return 'Good night';
        if (hours < 12) return 'Good morning';
        if (hours < 17) return 'Good afternoon';
        if (hours < 21) return 'Good evening';
        return 'Good night';
    };

    useEffect(() => {
        dispatch(fetchDashboardData());
        dispatch(fetchSettings());
        dispatch(fetchSonosDevices());
        dispatch(fetchNestDevices());
        api.getWeeklyTaskStats().then(setWeeklyStats).catch(console.error);
    }, [dispatch]);

    useEffect(() => {
        if (!activeDeviceIp) return;
        dispatch(fetchSonosState(activeDeviceIp));
        const interval = setInterval(() => {
            dispatch(fetchSonosState(activeDeviceIp));
        }, 5000);
        return () => clearInterval(interval);
    }, [dispatch, activeDeviceIp]);

    useEffect(() => {
        if (familyMembers.length > 0) {
            const sorted = [...familyMembers].sort((a, b) => b.points - a.points);
            dispatch(setScoreboard(sorted));
        }
    }, [dispatch, familyMembers]);

    const getMemberWeeklyStats = (memberId) => {
        const memberStats = weeklyStats.stats?.find((item) => item.id === memberId);
        return memberStats || { weeklyTasksCompleted: 0, weeklyPointsEarned: 0, totalPoints: 0 };
    };

    const sortedMembers = [...familyMembers].sort((a, b) => {
        const aStats = getMemberWeeklyStats(a.id);
        const bStats = getMemberWeeklyStats(b.id);
        return bStats.weeklyTasksCompleted - aStats.weeklyTasksCompleted;
    });
    const maxWeeklyTasks = Math.max(...sortedMembers.map((member) => getMemberWeeklyStats(member.id).weeklyTasksCompleted), 1);
    const mealsPlannedCount = mealCards.filter((meal) => todayMeals?.[meal.key]).length;
    const topPerformer = sortedMembers[0];
    const heroMetrics = [
        { label: 'Upcoming events', value: upcomingEvents.length, icon: Calendar },
        { label: 'Routines due', value: todayTasks.length, icon: CheckSquare },
        { label: 'Meals planned', value: mealsPlannedCount, icon: Utensils },
        { label: 'Shopping left', value: shopping?.uncheckedCount || 0, icon: ShoppingCart },
    ];

    return (
        <PageShell className="animate-fade-in lg:h-full">
            <div className="flex min-h-0 flex-col gap-4 lg:h-full">
                <div className="grid gap-4 xl:grid-cols-[1.14fr_0.86fr]">
                    <section className="module-hero">
                        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                            <div className="space-y-4">
                                <div className="module-inline-chip w-fit">
                                    <Waves size={14} className="text-primary" />
                                    {getGreeting()}
                                </div>

                                <div>
                                    <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">{time}</h1>
                                    <p className="mt-2 text-base text-white/58 sm:text-lg">{date}</p>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="module-note">
                                        <p className="text-[0.72rem] uppercase tracking-[0.18em] text-white/35">Today focus</p>
                                        <p className="mt-2 text-base font-medium text-white/82">
                                            {upcomingEvents.length > 0
                                                ? `You have ${upcomingEvents.length} event${upcomingEvents.length === 1 ? '' : 's'} queued.`
                                                : 'No calendar pressure right now.'}
                                        </p>
                                        <p className="mt-2 text-sm text-white/52">
                                            {mealsPlannedCount}/4 meals are planned and {todayTasks.length} routines are in motion.
                                        </p>
                                    </div>

                                    <div className="module-note">
                                        <p className="text-[0.72rem] uppercase tracking-[0.18em] text-white/35">Weather</p>
                                        {weather ? (
                                            <div className="mt-2 flex items-center gap-3">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
                                                    {weather.icon}
                                                </div>
                                                <div>
                                                    <p className="text-xl font-semibold text-white">{weather.temp}°F</p>
                                                    <p className="text-sm text-white/55">{weather.condition}</p>
                                                    {clothing?.main && (
                                                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/35">
                                                            Wear: {clothing.main}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-2 flex items-center gap-2 text-sm text-white/52">
                                                <CloudSun size={16} />
                                                Configure weather in Settings for live conditions.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => navigate('/calendar')}
                                        className="module-action module-action-primary"
                                    >
                                        <Calendar size={18} />
                                        Open Calendar
                                    </button>
                                    <button
                                        onClick={() => navigate('/meals')}
                                        className="module-action"
                                    >
                                        <Utensils size={18} />
                                        Open Meals
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                                {heroMetrics.map((metric) => {
                                    const Icon = metric.icon;

                                    return (
                                        <div key={metric.label} className="module-metric">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/35">{metric.label}</p>
                                                    <p className="mt-3 text-3xl font-semibold tracking-tight">{metric.value}</p>
                                                </div>
                                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/72">
                                                    <Icon size={18} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    <SurfacePanel>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="module-kicker">Family pulse</p>
                                <h2 className="text-2xl font-semibold">Weekly momentum</h2>
                                <p className="mt-1 text-sm text-white/55">
                                    A quick snapshot of who is carrying the most completions this week.
                                </p>
                            </div>
                            {topPerformer && (
                                <div className="flex items-center gap-2 rounded-full border border-warning/20 bg-warning/10 px-3 py-1.5 text-warning">
                                    <Crown size={14} />
                                    <span className="text-sm font-semibold">{topPerformer.name.split(' ')[0]}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-5 space-y-3">
                            {sortedMembers.length === 0 ? (
                                <EmptyState
                                    icon={Sparkles}
                                    title="No family members yet"
                                    description="Add family members in Settings to unlock points and weekly momentum."
                                />
                            ) : (
                                sortedMembers.slice(0, 4).map((member, index) => {
                                    const weekly = getMemberWeeklyStats(member.id);
                                    const colorClass = familyColors[member.color] || 'bg-family-blue';
                                    const taskProgress = Math.max((weekly.weeklyTasksCompleted / maxWeeklyTasks) * 100, 6);

                                    return (
                                        <button
                                            key={member.id}
                                            onClick={() => navigate('/tasks')}
                                            className={cn(
                                                'module-list-item w-full text-left',
                                                index === 0 && 'border-warning/25 bg-warning/10'
                                            )}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-lg font-semibold text-white',
                                                    colorClass
                                                )}>
                                                    {member.name[0]}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="truncate font-semibold">{member.name}</p>
                                                        {index === 0 && (
                                                            <span className="rounded-full border border-warning/25 bg-warning/10 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.14em] text-warning">
                                                                Leader
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/52">
                                                        <span className="text-emerald-300">{weekly.weeklyTasksCompleted} tasks</span>
                                                        <span className="inline-flex items-center gap-1 text-warning">
                                                            <Star size={12} className="fill-warning" />
                                                            {member.points} pts
                                                        </span>
                                                    </div>
                                                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400"
                                                            style={{ width: `${taskProgress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </SurfacePanel>
                </div>

                <TodayStrip
                    announcements={announcements}
                    tasks={todayTasks}
                    shopping={shopping}
                    clothing={clothing}
                    prepAgenda={prepAgenda}
                    onDismissAnnouncement={handleDismissAnnouncement}
                />

                <div className="grid flex-1 min-h-0 gap-4 xl:grid-cols-[1.14fr_0.86fr]">
                    <div className="grid min-h-0 gap-4 xl:grid-rows-[minmax(0,1fr)_auto]">
                        <SurfacePanel className="flex min-h-0 flex-col">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="module-kicker">Calendar agenda</p>
                                    <h2 className="text-2xl font-semibold">Upcoming events</h2>
                                    <p className="mt-1 text-sm text-white/55">
                                        Tap an event to inspect details or reassign it to someone else.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('/calendar')}
                                    className="module-action"
                                >
                                    Open
                                </button>
                            </div>

                            <div className="module-note mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                                <div>
                                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/35">Today focus</p>
                                    <p className="mt-1 text-sm text-white/65">
                                        {upcomingEvents.length > 0
                                            ? `First on deck: ${upcomingEvents[0].title}`
                                            : 'No events are scheduled right now.'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/35">Meals planned</p>
                                    <p className="mt-1 text-sm font-semibold text-white/82">{mealsPlannedCount}/4</p>
                                </div>
                            </div>

                            <div className="mt-5 flex-1 space-y-3 overflow-y-auto touch-scroll hide-scrollbar">
                                {upcomingEvents.length === 0 ? (
                                    <EmptyState
                                        icon={Calendar}
                                        title="No upcoming events"
                                        description="The board is clear for now. Open Calendar to pull in new plans or assign existing ones."
                                    />
                                ) : (
                                    upcomingEvents.map((event, idx) => (
                                        <button
                                            key={event.id || idx}
                                            onClick={() => setSelectedEvent(event)}
                                            className={cn(
                                                'module-list-item group w-full text-left',
                                                event.isToday && 'border-primary/25 bg-primary/10'
                                            )}
                                        >
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                                                <div className="flex items-center gap-3 sm:flex-shrink-0">
                                                    <div className={cn(
                                                        'h-3.5 w-3.5 flex-shrink-0 rounded-full',
                                                        getMemberColor(event.member, familyMembers)
                                                    )} />

                                                    <div className={cn(
                                                        'rounded-2xl border px-3 py-2 text-center text-sm font-semibold sm:min-w-24',
                                                        event.isToday
                                                            ? 'border-primary/20 bg-primary/15 text-primary'
                                                            : 'border-white/10 bg-white/5 text-white/62'
                                                    )}>
                                                        {formatEventDate(event.date)}
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="truncate text-lg font-semibold">{event.title}</p>
                                                        {event.isToday && (
                                                            <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.14em] text-primary">
                                                                Today
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-sm text-white/52">{event.time}</p>
                                                    {event.prepMatches?.length > 0 && (
                                                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-violet-300">
                                                            Prep ready: {event.prepMatches[0].title}
                                                        </p>
                                                    )}
                                                </div>

                                                <ChevronRight size={18} className="hidden flex-shrink-0 text-white/35 transition-transform group-hover:translate-x-1 sm:mt-2 sm:block" />
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </SurfacePanel>

                        <div className="grid gap-4 lg:grid-cols-[1fr_0.72fr]">
                            <SurfacePanel>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="module-kicker">Meal board</p>
                                        <h2 className="text-2xl font-semibold">Today&apos;s meals</h2>
                                    </div>
                                    <button
                                        onClick={() => navigate('/meals')}
                                        className="module-action"
                                    >
                                        Edit
                                    </button>
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                    {mealCards.map((meal) => {
                                        const mealData = todayMeals?.[meal.key];

                                        return (
                                            <button
                                                key={meal.key}
                                                onClick={() => (
                                                    mealData
                                                        ? setSelectedMeal({ meal: mealData, type: meal.key })
                                                        : navigate('/meals')
                                                )}
                                                className={cn(
                                                    'rounded-3xl border p-4 text-left transition-all',
                                                    mealData
                                                        ? `${meal.accent} shadow-[0_14px_30px_rgba(0,0,0,0.16)]`
                                                        : 'border-white/10 bg-white/5 hover:bg-white/8'
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/45">{meal.label}</p>
                                                        <p className="mt-3 text-2xl">{mealData?.recipeEmoji || meal.emoji}</p>
                                                        <p className="mt-3 truncate text-base font-semibold text-white">
                                                            {mealData?.recipeTitle || 'Add meal'}
                                                        </p>
                                                        <p className="mt-1 text-sm text-white/52">
                                                            {mealData ? 'Tap for recipe details' : 'Choose a recipe for this slot'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </SurfacePanel>

                            <button
                                onClick={() => navigate('/meals')}
                                className="module-panel flex flex-col justify-between text-left"
                            >
                                <div>
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-sky-500/15 text-sky-300">
                                        <ShoppingCart size={20} />
                                    </div>
                                    <p className="mt-4 text-[0.72rem] uppercase tracking-[0.18em] text-white/35">Shopping pulse</p>
                                    <p className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{shopping?.uncheckedCount || 0}</p>
                                    <p className="mt-2 text-sm text-white/55">Unchecked shopping items still open.</p>
                                </div>

                                <p className="mt-6 text-sm text-white/48">
                                    Open Meals to review generated items and make manual edits.
                                </p>
                            </button>
                        </div>
                    </div>

                    <div className={cn(
                        'grid min-h-0 gap-4',
                        nestConnected ? 'xl:grid-rows-[auto_auto_minmax(0,1fr)]' : 'xl:grid-rows-[auto_minmax(0,1fr)]'
                    )}>
                        {nestConnected && (
                            <NestCard onOpenDetail={() => setShowNestDetail(true)} />
                        )}

                        <SurfacePanel>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="module-kicker">Music</p>
                                    <h2 className="text-2xl font-semibold">Listening now</h2>
                                    <p className="mt-1 text-sm text-white/55">
                                        A lighter view of current playback so it doesn&apos;t overpower the rest of the dashboard.
                                    </p>
                                </div>
                                {playerState?.state && (
                                    <span className="module-badge">{playerState.state.toLowerCase()}</span>
                                )}
                            </div>

                            {playerState?.track && playerState.state === 'PLAYING' ? (
                                <div className="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/5 sm:h-24 sm:w-24">
                                        {playerState.track.art ? (
                                            <img src={playerState.track.art} alt="Album art" className="h-full w-full object-cover" />
                                        ) : (
                                            <Music size={34} className="text-white/30" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xl font-semibold">{playerState.track.title || 'Unknown track'}</p>
                                        <p className="mt-1 truncate text-base text-white/55">{playerState.track.artist || 'Unknown artist'}</p>
                                        <p className="mt-3 text-sm text-white/45">
                                            Playback is active on the connected Sonos device.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                                    {playlistSuggestions.map((playlist) => (
                                        <div key={playlist.name} className="module-list-item px-3 py-3">
                                            <p className="font-semibold">{playlist.name}</p>
                                            <p className="mt-1 text-sm text-white/48">{playlist.mood}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </SurfacePanel>

                        <SurfacePanel className="flex min-h-0 flex-col">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="module-kicker">Scoreboard</p>
                                    <h2 className="text-2xl font-semibold">Weekly standings</h2>
                                    <p className="mt-1 text-sm text-white/55">
                                        Points and completions at a glance, without the old visual noise.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 rounded-full border border-warning/20 bg-warning/10 px-3 py-1.5 text-warning">
                                    <Trophy size={16} />
                                    <span className="text-sm font-semibold">Live</span>
                                </div>
                            </div>

                            <div className="mt-5 flex-1 space-y-3 overflow-y-auto touch-scroll hide-scrollbar">
                                {sortedMembers.length === 0 ? (
                                    <EmptyState
                                        icon={Trophy}
                                        title="No standings yet"
                                        description="Add family members and complete routines to see the board fill in."
                                    />
                                ) : (
                                    sortedMembers.slice(0, 6).map((member, idx) => {
                                        const weekly = getMemberWeeklyStats(member.id);
                                        const colorClass = familyColors[member.color] || 'bg-family-blue';
                                        const isLeader = idx === 0 && weekly.weeklyTasksCompleted > 0;
                                        const taskProgress = Math.max((weekly.weeklyTasksCompleted / maxWeeklyTasks) * 100, 6);

                                        return (
                                            <button
                                                key={member.id}
                                                onClick={() => navigate('/tasks')}
                                                className={cn(
                                                    'module-list-item w-full text-left',
                                                    isLeader && 'border-warning/25 bg-warning/10'
                                                )}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={cn(
                                                        'relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-lg font-semibold text-white',
                                                        colorClass
                                                    )}>
                                                        {member.name[0]}
                                                        {isLeader && (
                                                            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-warning text-white">
                                                                <Trophy size={11} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="truncate font-semibold">{member.name}</p>
                                                            {idx < 3 && (
                                                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.14em] text-white/45">
                                                                    #{idx + 1}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                                                            <span className="font-semibold text-emerald-300">{weekly.weeklyTasksCompleted} tasks</span>
                                                            <span className="inline-flex items-center gap-1 font-semibold text-warning">
                                                                <Star size={12} className="fill-warning" />
                                                                {member.points} pts
                                                            </span>
                                                        </div>

                                                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400"
                                                                style={{ width: `${taskProgress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </SurfacePanel>
                    </div>
                </div>
            </div>

            {showNestDetail && nestConnected && (
                <NestDetailView onClose={() => setShowNestDetail(false)} />
            )}

            {selectedEvent && (
                <EventModal
                    event={selectedEvent}
                    familyMembers={familyMembers}
                    onClose={() => setSelectedEvent(null)}
                    onAssign={handleAssignEvent}
                />
            )}

            {selectedMeal && (
                <MealModal
                    meal={selectedMeal.meal}
                    mealType={selectedMeal.type}
                    onClose={() => setSelectedMeal(null)}
                />
            )}
        </PageShell>
    );
};

export default Dashboard;
