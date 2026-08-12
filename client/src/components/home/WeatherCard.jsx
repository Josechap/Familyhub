import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { CloudSun } from 'lucide-react';
import HomeCard from './HomeCard';
import CardEmptyState from './CardEmptyState';

const WeatherCard = () => {
    const navigate = useNavigate();
    const { weather, clothing } = useSelector((state) => state.dashboard);

    return (
        <HomeCard icon={CloudSun} kicker="Weather" tone="amber" onClick={() => navigate('/settings')}>
            {weather ? (
                <>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl leading-none">{weather.icon}</span>
                        <p className="text-3xl font-semibold tracking-tight">{weather.temp}&deg;F</p>
                    </div>
                    <p className="mt-1 text-sm text-white/55">{weather.condition}</p>
                    {clothing?.main && (
                        <p className="mt-3 truncate text-xs uppercase tracking-[0.16em] text-white/40">
                            Wear: {clothing.main}
                        </p>
                    )}
                </>
            ) : (
                <CardEmptyState
                    icon={CloudSun}
                    tone="amber"
                    title="Weather not set up"
                    description="Add it in Settings"
                    compact
                />
            )}
        </HomeCard>
    );
};

export default WeatherCard;
