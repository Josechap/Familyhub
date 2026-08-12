import React from 'react';
import { cn } from '../../lib/utils';

const toneIconBg = {
    sky: 'bg-family-blue/12 text-family-blue',
    emerald: 'bg-success/12 text-success',
    amber: 'bg-warning/12 text-warning',
    violet: 'bg-family-purple/12 text-family-purple',
    gold: 'bg-warning/15 text-warning',
};

const CardEmptyState = ({ icon: Icon, tone = 'sky', title, description, compact = false }) => {
    return (
        <div className={cn('flex flex-1 flex-col items-center justify-center text-center', compact ? 'gap-2' : 'gap-3')}>
            {Icon && (
                <div className={cn(
                    'flex items-center justify-center rounded-3xl',
                    compact ? 'h-10 w-10' : 'h-14 w-14',
                    toneIconBg[tone] || toneIconBg.sky
                )}>
                    <Icon size={compact ? 18 : 26} />
                </div>
            )}
            <div>
                <p className={cn('font-medium text-white/70', compact ? 'text-sm' : 'text-base')}>{title}</p>
                {description && (
                    <p className={cn('mt-1 text-white/40', compact ? 'text-xs' : 'text-sm')}>{description}</p>
                )}
            </div>
        </div>
    );
};

export default CardEmptyState;
