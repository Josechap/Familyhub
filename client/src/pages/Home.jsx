import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Waves } from 'lucide-react';
import { useClock } from '../hooks/useClock';
import { fetchDashboardData } from '../features/dashboardSlice';
import { fetchSettings } from '../features/settingsSlice';
import { fetchSonosDevices, fetchSonosState } from '../features/sonosSlice';
import { PageShell } from '../components/ui/ModuleShell';
import MusicPlayerModal from '../components/modals/MusicPlayerModal';
import CalendarCard from '../components/home/CalendarCard';
import WeatherCard from '../components/home/WeatherCard';
import MusicCard from '../components/home/MusicCard';
import LeaderboardCard from '../components/home/LeaderboardCard';

const Home = () => {
    const dispatch = useDispatch();
    const { time, date, hours } = useClock();
    const { activeDeviceIp } = useSelector((state) => state.sonos);
    const [showMusicPlayer, setShowMusicPlayer] = useState(false);

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
    }, [dispatch]);

    useEffect(() => {
        if (!activeDeviceIp) return;
        dispatch(fetchSonosState(activeDeviceIp));
        const interval = setInterval(() => {
            dispatch(fetchSonosState(activeDeviceIp));
        }, 5000);
        return () => clearInterval(interval);
    }, [dispatch, activeDeviceIp]);

    return (
        <PageShell className="animate-fade-in lg:min-h-full">
            <div className="flex min-h-0 flex-1 flex-col gap-4 lg:min-h-full">
                <div className="flex-shrink-0">
                    <div className="module-inline-chip w-fit">
                        <Waves size={14} className="text-primary" />
                        {getGreeting()}
                    </div>
                    <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">{time}</h1>
                    <p className="mt-1 text-base text-white/58">{date}</p>
                </div>

                <div className="grid flex-1 min-h-0 grid-cols-1 gap-4 sm:grid-cols-3">
                    <CalendarCard />
                    <LeaderboardCard />
                    <div className="grid min-h-0 grid-rows-2 gap-4">
                        <WeatherCard />
                        <MusicCard onOpen={() => setShowMusicPlayer(true)} />
                    </div>
                </div>
            </div>

            {showMusicPlayer && (
                <MusicPlayerModal onClose={() => setShowMusicPlayer(false)} />
            )}
        </PageShell>
    );
};

export default Home;
