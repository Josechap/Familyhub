import React from 'react';
import { useSelector } from 'react-redux';
import { Music } from 'lucide-react';
import HomeCard from './HomeCard';
import CardEmptyState from './CardEmptyState';

const MusicCard = ({ onOpen }) => {
    const { playerState } = useSelector((state) => state.sonos);
    const isPlaying = playerState.state === 'PLAYING' || playerState.state === 'TRANSITIONING';

    return (
        <HomeCard
            icon={Music}
            kicker="Music"
            tone="violet"
            onClick={onOpen}
            badge={isPlaying && (
                <span className="flex items-center gap-1.5 rounded-full border border-family-purple/30 bg-family-purple/15 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-family-purple">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-family-purple opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-family-purple" />
                    </span>
                    Live
                </span>
            )}
        >
            {isPlaying && playerState.track ? (
                <>
                    <p className="truncate text-lg font-semibold">{playerState.track.title || 'Unknown track'}</p>
                    <p className="mt-1 truncate text-sm text-white/55">{playerState.track.artist || 'Unknown artist'}</p>
                </>
            ) : (
                <CardEmptyState
                    icon={Music}
                    tone="violet"
                    title="Nothing playing"
                    description="Tap to browse"
                    compact
                />
            )}
        </HomeCard>
    );
};

export default MusicCard;
