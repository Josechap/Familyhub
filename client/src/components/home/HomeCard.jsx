import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

const toneMap = {
    sky: {
        glow: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.32), transparent 60%)',
        iconBg: 'bg-family-blue/15 text-family-blue ring-1 ring-family-blue/25',
    },
    emerald: {
        glow: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.3), transparent 60%)',
        iconBg: 'bg-success/15 text-success ring-1 ring-success/25',
    },
    amber: {
        glow: 'radial-gradient(circle at top right, rgba(245, 158, 11, 0.3), transparent 60%)',
        iconBg: 'bg-warning/15 text-warning ring-1 ring-warning/25',
    },
    violet: {
        glow: 'radial-gradient(circle at top right, rgba(168, 85, 247, 0.32), transparent 60%)',
        iconBg: 'bg-family-purple/15 text-family-purple ring-1 ring-family-purple/25',
    },
    gold: {
        glow: 'radial-gradient(circle at top right, rgba(245, 158, 11, 0.36), transparent 60%)',
        iconBg: 'bg-warning/20 text-warning ring-1 ring-warning/30',
    },
};

const HomeCard = ({ icon: Icon, kicker, tone = 'sky', badge, onClick, span, align = 'center', children }) => {
    const palette = toneMap[tone] || toneMap.sky;

    return (
        <button
            onClick={onClick}
            className={cn(
                'group relative flex h-full min-h-0 flex-col overflow-hidden rounded-4xl border border-white/10 p-5 text-left transition-all duration-200',
                'hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_24px_48px_rgba(0,0,0,0.32)] active:scale-[0.98]',
                span
            )}
            style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02)), rgba(10,14,22,0.82)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 18px 36px rgba(0,0,0,0.24)',
            }}
        >
            <div
                className="pointer-events-none absolute inset-0 opacity-90 transition-opacity duration-200 group-hover:opacity-100"
                style={{ background: palette.glow }}
            />

            <div className="relative flex min-h-0 flex-1 flex-col">
                <div className="flex flex-shrink-0 items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl', palette.iconBg)}>
                            {Icon && <Icon size={20} />}
                        </div>
                        <p className="module-kicker truncate">{kicker}</p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                        {badge}
                        <ChevronRight size={16} className="text-white/25 transition-transform group-hover:translate-x-1 group-hover:text-white/50" />
                    </div>
                </div>

                <div className={cn(
                    'mt-4 flex min-h-0 flex-1 flex-col',
                    align === 'start' ? 'justify-start' : 'justify-center'
                )}>
                    {children}
                </div>
            </div>
        </button>
    );
};

export default HomeCard;
