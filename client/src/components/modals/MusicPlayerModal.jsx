import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Music2, Pause, Play, SkipBack, SkipForward, Volume2, X } from 'lucide-react';
import {
    setActiveDevice,
    sonosNext,
    sonosPause,
    sonosPlay,
    sonosPrevious,
    sonosVolume,
} from '../../features/sonosSlice';

const MusicPlayerModal = ({ onClose }) => {
    const dispatch = useDispatch();
    const { devices, activeDeviceIp, playerState } = useSelector((state) => state.sonos);
    const coordinators = devices.filter((device) => device.isCoordinator);
    const displayDevices = coordinators.length > 0 ? coordinators : devices;
    const isPlaying = playerState.state === 'PLAYING' || playerState.state === 'TRANSITIONING';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="module-modal max-w-md animate-scale-in"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <p className="module-kicker">Music</p>
                    <button onClick={onClose} aria-label="Close" className="module-icon-button">
                        <X size={20} />
                    </button>
                </div>

                {devices.length === 0 ? (
                    <div className="mt-5 flex flex-col items-center justify-center gap-2 py-8 text-center text-white/45">
                        <Music2 size={28} className="opacity-50" />
                        <p className="text-sm">No Sonos speakers found</p>
                    </div>
                ) : (
                    <>
                        <select
                            value={activeDeviceIp || ''}
                            onChange={(event) => dispatch(setActiveDevice(event.target.value))}
                            className="module-select mt-5"
                        >
                            {displayDevices.map((device) => (
                                <option key={device.ip} value={device.ip}>
                                    {device.name}{device.group && device.group !== device.name ? ` (${device.group})` : ''}
                                </option>
                            ))}
                        </select>

                        <div className="mt-6 flex flex-col items-center gap-4 text-center">
                            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                                {playerState.track?.art ? (
                                    <img src={playerState.track.art} alt="Album art" className="h-full w-full object-cover" />
                                ) : (
                                    <Music2 size={32} className="text-white/30" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-lg font-semibold">{playerState.track?.title || 'Not playing'}</p>
                                <p className="truncate text-sm text-white/55">{playerState.track?.artist || 'Select music to play'}</p>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-center gap-5">
                            <button
                                onClick={() => activeDeviceIp && dispatch(sonosPrevious(activeDeviceIp))}
                                disabled={!activeDeviceIp}
                                aria-label="Previous track"
                                className="module-icon-button h-12 w-12 disabled:opacity-40"
                            >
                                <SkipBack size={20} />
                            </button>
                            <button
                                onClick={() => activeDeviceIp && dispatch(isPlaying ? sonosPause(activeDeviceIp) : sonosPlay(activeDeviceIp))}
                                disabled={!activeDeviceIp}
                                aria-label={isPlaying ? 'Pause' : 'Play'}
                                className="module-action module-action-primary h-14 w-14 rounded-full p-0 disabled:opacity-40"
                            >
                                {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
                            </button>
                            <button
                                onClick={() => activeDeviceIp && dispatch(sonosNext(activeDeviceIp))}
                                disabled={!activeDeviceIp}
                                aria-label="Next track"
                                className="module-icon-button h-12 w-12 disabled:opacity-40"
                            >
                                <SkipForward size={20} />
                            </button>
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            <Volume2 size={16} className="flex-shrink-0 text-white/45" />
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={playerState.volume ?? 0}
                                onChange={(event) => activeDeviceIp && dispatch(sonosVolume({ ip: activeDeviceIp, level: parseInt(event.target.value, 10) }))}
                                disabled={!activeDeviceIp}
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-40"
                            />
                            <span className="w-8 flex-shrink-0 text-right text-sm text-white/45">{playerState.volume ?? 0}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MusicPlayerModal;
