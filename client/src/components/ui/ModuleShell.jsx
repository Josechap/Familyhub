import React from 'react';
import { cn } from '../../lib/utils';

const toneMap = {
    indigo: {
        glow: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.28), transparent 55%), radial-gradient(circle at bottom left, rgba(245, 158, 11, 0.12), transparent 45%)',
        badge: 'bg-primary/15 text-primary ring-1 ring-primary/30',
    },
    sky: {
        glow: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.26), transparent 55%), radial-gradient(circle at bottom left, rgba(34, 211, 238, 0.12), transparent 45%)',
        badge: 'bg-family-blue/15 text-family-blue ring-1 ring-family-blue/30',
    },
    emerald: {
        glow: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.24), transparent 55%), radial-gradient(circle at bottom left, rgba(245, 158, 11, 0.12), transparent 45%)',
        badge: 'bg-success/15 text-success ring-1 ring-success/30',
    },
    amber: {
        glow: 'radial-gradient(circle at top right, rgba(245, 158, 11, 0.26), transparent 55%), radial-gradient(circle at bottom left, rgba(239, 68, 68, 0.12), transparent 45%)',
        badge: 'bg-warning/15 text-warning ring-1 ring-warning/30',
    },
    rose: {
        glow: 'radial-gradient(circle at top right, rgba(236, 72, 153, 0.25), transparent 55%), radial-gradient(circle at bottom left, rgba(99, 102, 241, 0.14), transparent 45%)',
        badge: 'bg-family-pink/15 text-family-pink ring-1 ring-family-pink/30',
    },
    slate: {
        glow: 'radial-gradient(circle at top right, rgba(148, 163, 184, 0.18), transparent 55%), radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.12), transparent 45%)',
        badge: 'bg-white/10 text-white ring-1 ring-white/10',
    },
};

export const PageShell = ({ children, className }) => {
    return (
        <div className={cn('page-shell', className)}>
            <div className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-primary/12 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-family-purple/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="relative flex min-h-0 flex-col gap-4 sm:gap-5 lg:h-full">
                {children}
            </div>
        </div>
    );
};

export const SurfacePanel = ({ children, className }) => {
    return (
        <div className={cn('module-panel', className)}>
            {children}
        </div>
    );
};

export const PageHeader = ({
    icon: Icon,
    eyebrow,
    title,
    description,
    stats = [],
    actions,
    tone = 'indigo',
    className,
}) => {
    const palette = toneMap[tone] || toneMap.indigo;

    return (
        <header className={cn('module-hero', className)}>
            <div
                className="pointer-events-none absolute inset-0 opacity-90"
                style={{ background: palette.glow }}
            />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        {Icon && (
                            <div className={cn(
                                'flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg shadow-black/20',
                                palette.badge
                            )}>
                                <Icon size={26} />
                            </div>
                        )}

                        <div className="space-y-2">
                            {eyebrow && <p className="module-kicker">{eyebrow}</p>}

                            <div className="space-y-1">
                                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
                                {description && (
                                    <p className="max-w-2xl text-sm text-white/65 sm:text-base">
                                        {description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {stats.length > 0 && (
                        <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap">
                            {stats.map((stat, index) => (
                                <div key={stat.label || index} className="module-stat">
                                    <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/35">
                                        {stat.label}
                                    </p>
                                    <div className="mt-2 flex items-end gap-2">
                                        <span className="text-2xl font-semibold leading-none">
                                            {stat.value}
                                        </span>
                                        {stat.meta && (
                                            <span className="text-sm text-white/45">{stat.meta}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {actions && (
                    <div className="flex flex-wrap gap-2 lg:max-w-lg lg:justify-end">
                        {actions}
                    </div>
                )}
            </div>
        </header>
    );
};

export const EmptyState = ({ icon: Icon, title, description, action, className }) => {
    return (
        <div className={cn('module-empty', className)}>
            {Icon && (
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white/35">
                    <Icon size={30} />
                </div>
            )}
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && <p className="mt-2 max-w-md text-sm text-white/45">{description}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
};
