import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Calendar } from 'lucide-react';
import { API_BASE } from '../lib/config';
import api from '../lib/api';

const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;

    // In dev, API_BASE includes the full URL (e.g., http://localhost:3001/api)
    // We need the origin part (http://localhost:3001) to prepend to the relative URL (/api/photos/...)
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
    const { screensaverPhotoInterval, localPhotosPath } = useSelector((state) => state.settings);
    const { upcomingEvents } = useSelector((state) => state.dashboard);

    const [photos, setPhotos] = useState([]);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [nextPhotoIndex, setNextPhotoIndex] = useState(1);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);

    // Update clock every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Fetch local photos
    useEffect(() => {
        let isMounted = true;

        const fetchPhotos = async () => {
            try {
                const localPhotos = await api.getLocalPhotos();
                if (!isMounted) return;

                if (localPhotos?.length > 0) {
                    // Shuffle photos
                    const shuffled = [...localPhotos].sort(() => Math.random() - 0.5);
                    setPhotos(shuffled);
                }
            } catch {
                console.error('Failed to fetch photos');
            }
            if (isMounted) {
                setLoading(false);
            }
        };

        fetchPhotos();

        return () => {
            isMounted = false;
        };
    }, []);

    // Photo rotation
    useEffect(() => {
        if (photos.length < 2) return;

        const interval = setInterval(() => {
            setIsTransitioning(true);

            setTimeout(() => {
                setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
                setNextPhotoIndex((prev) => (prev + 1) % photos.length);
                setIsTransitioning(false);
            }, 500); // Match transition duration
        }, screensaverPhotoInterval * 1000);

        return () => clearInterval(interval);
    }, [photos.length, screensaverPhotoInterval]);

    // Handle dismiss
    const handleDismiss = useCallback((e) => {
        e.stopPropagation();
        onDismiss?.();
    }, [onDismiss]);

    // Format time
    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    // Format date
    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
        });
    };

    // Get today's events
    const todayEvents = upcomingEvents?.slice(0, 5) || [];

    const currentPhoto = photos[currentPhotoIndex];
    const nextPhoto = photos[nextPhotoIndex];

    return (
        <div
            className="fixed inset-0 z-50 bg-black cursor-pointer"
            onClick={handleDismiss}
            onTouchStart={handleDismiss}
        >
            {/* Photo background */}
            {photos.length > 0 ? (
                <>
                    {/* Current photo */}
                    <div
                        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'
                            }`}
                        style={{
                            backgroundImage: `url(${getImageUrl(currentPhoto?.url)})`,
                        }}
                    />
                    {/* Next photo (for crossfade) */}
                    <div
                        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${isTransitioning ? 'opacity-100' : 'opacity-0'
                            }`}
                        style={{
                            backgroundImage: `url(${getImageUrl(nextPhoto?.url)})`,
                        }}
                    />
                </>
            ) : (
                // Fallback gradient when no photos
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
            )}

            {/* Overlay gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

            {/* Calendar widget - bottom left */}
            <div className="absolute bottom-8 left-8 max-w-sm">
                <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    {/* Time */}
                    <div className="text-5xl font-light text-white mb-1">
                        {formatTime(currentTime)}
                    </div>

                    {/* Date */}
                    <div className="text-lg text-white/70 mb-4">
                        {formatDate(currentTime)}
                    </div>

                    {/* Divider */}
                    {todayEvents.length > 0 && (
                        <>
                            <div className="h-px bg-white/20 mb-4" />

                            {/* Today's events */}
                            <div className="space-y-3">
                                {todayEvents.map((event, idx) => (
                                    <div key={event.id || idx} className="flex items-start gap-3">
                                        <div className="w-1 h-full min-h-[24px] rounded-full bg-primary" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium truncate">
                                                {event.title}
                                            </p>
                                            <p className="text-white/50 text-sm">
                                                {event.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {todayEvents.length === 0 && (
                        <div className="flex items-center gap-2 text-white/50">
                            <Calendar size={16} />
                            <span className="text-sm">No events today</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Loading indicator */}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
            )}

            {/* No photos configured message */}
            {!loading && photos.length === 0 && (
                <div className="absolute top-8 right-8 bg-black/60 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/10">
                    <p className="text-white/60 text-sm">
                        Configure local photos in Settings
                    </p>
                </div>
            )}

            {/* Tap to dismiss hint */}
            <div className="absolute bottom-8 right-8 text-white/30 text-sm">
                Tap anywhere to dismiss
            </div>
        </div>
    );
};

export default Screensaver;

