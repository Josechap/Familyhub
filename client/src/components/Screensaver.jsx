import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Calendar } from 'lucide-react';
import { API_BASE } from '../lib/config';
import api from '../lib/api';
import TodayStrip from './TodayStrip';

const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;

    if (API_BASE.startsWith('http')) {
        try {
            const urlObj = new URL(API_BASE);
            return `${urlObj.origin}${url}`;
        } catch {
            return url;
        }
    }

    return url;
};

const Screensaver = ({ onDismiss }) => {
    const { screensaverPhotoInterval } = useSelector((state) => state.settings);
    const [photos, setPhotos] = useState([]);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [nextPhotoIndex, setNextPhotoIndex] = useState(1);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [todayData, setTodayData] = useState({
        todayEvents: [],
        announcements: [],
        dueRoutines: [],
        shopping: { uncheckedCount: 0 },
        clothing: null,
        prepAgenda: [],
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                const [localPhotos, dashboardToday] = await Promise.all([
                    api.getLocalPhotos(),
                    api.getDashboardToday(),
                ]);

                if (!isMounted) return;

                if (localPhotos?.length > 0) {
                    setPhotos([...localPhotos].sort(() => Math.random() - 0.5));
                }

                setTodayData({
                    todayEvents: dashboardToday.todayEvents || [],
                    announcements: dashboardToday.announcements || [],
                    dueRoutines: dashboardToday.dueRoutines || [],
                    shopping: dashboardToday.shopping || { uncheckedCount: 0 },
                    clothing: dashboardToday.clothing || null,
                    prepAgenda: dashboardToday.prepAgenda || [],
                });
            } catch {
                console.error('Failed to fetch screensaver data');
            }

            if (isMounted) {
                setLoading(false);
            }
        };

        fetchData();
        const refreshInterval = setInterval(fetchData, 5 * 60 * 1000);

        return () => {
            isMounted = false;
            clearInterval(refreshInterval);
        };
    }, []);

    useEffect(() => {
        if (photos.length < 2) return;

        const interval = setInterval(() => {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
                setNextPhotoIndex((prev) => (prev + 1) % photos.length);
                setIsTransitioning(false);
            }, 500);
        }, screensaverPhotoInterval * 1000);

        return () => clearInterval(interval);
    }, [photos.length, screensaverPhotoInterval]);

    const handleDismiss = useCallback((e) => {
        e.stopPropagation();
        onDismiss?.();
    }, [onDismiss]);

    const formatTime = (value) => value.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    const formatDate = (value) => value.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    const currentPhoto = photos[currentPhotoIndex];
    const nextPhoto = photos[nextPhotoIndex];
    const todayEvents = todayData.todayEvents?.slice(0, 5) || [];

    return (
        <div
            className="fixed inset-0 z-50 bg-black cursor-pointer"
            onClick={handleDismiss}
            onTouchStart={handleDismiss}
        >
            {photos.length > 0 ? (
                <>
                    <div
                        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
                        style={{ backgroundImage: `url(${getImageUrl(currentPhoto?.url)})` }}
                    />
                    <div
                        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
                        style={{ backgroundImage: `url(${getImageUrl(nextPhoto?.url)})` }}
                    />
                </>
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/30" />

            <div className="absolute top-8 left-8 right-8">
                <TodayStrip
                    announcements={todayData.announcements}
                    tasks={todayData.dueRoutines}
                    shopping={todayData.shopping}
                    clothing={todayData.clothing}
                    prepAgenda={todayData.prepAgenda}
                    variant="screensaver"
                />
            </div>

            <div className="absolute bottom-8 left-8 max-w-sm">
                <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <div className="text-5xl font-light text-white mb-1">
                        {formatTime(currentTime)}
                    </div>

                    <div className="text-lg text-white/70 mb-4">
                        {formatDate(currentTime)}
                    </div>

                    {todayEvents.length > 0 ? (
                        <>
                            <div className="h-px bg-white/20 mb-4" />
                            <div className="space-y-3">
                                {todayEvents.map((event, idx) => (
                                    <div key={event.id || idx} className="flex items-start gap-3">
                                        <div className="w-1 h-full min-h-[24px] rounded-full bg-primary" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium truncate">{event.title}</p>
                                            <p className="text-white/50 text-sm">{event.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 text-white/50">
                            <Calendar size={16} />
                            <span className="text-sm">No events today</span>
                        </div>
                    )}
                </div>
            </div>

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
            )}

            {!loading && photos.length === 0 && (
                <div className="absolute top-8 right-8 bg-black/60 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/10">
                    <p className="text-white/60 text-sm">Configure local photos in Settings</p>
                </div>
            )}

            <div className="absolute bottom-8 right-8 text-white/30 text-sm">
                Tap anywhere to dismiss
            </div>
        </div>
    );
};

export default Screensaver;
