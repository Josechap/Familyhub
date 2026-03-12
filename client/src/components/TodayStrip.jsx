import React from 'react';
import { Bell, Shirt, ShoppingCart, ClipboardList, CheckSquare, X } from 'lucide-react';
import { cn } from '../lib/utils';

const cardClass = {
    dashboard: 'rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025)),rgba(10,14,22,0.72)] p-4 shadow-[0_16px_34px_rgba(0,0,0,0.22)]',
    screensaver: 'rounded-3xl border border-white/10 bg-black/45 p-4 backdrop-blur-md',
};

const SectionCard = ({ title, icon, variant, accentClass, children, extra = null }) => {
    const Icon = icon;

    return (
        <section className={cn(cardClass[variant], 'min-w-0')}>
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10', accentClass)}>
                            <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/40">{title}</p>
                        </div>
                    </div>
                </div>
                {extra}
            </div>
            {children}
        </section>
    );
};

const EmptyState = ({ children }) => (
    <p className="text-sm leading-6 text-white/45">{children}</p>
);

const TodayStrip = ({
    announcements = [],
    tasks = [],
    shopping = { uncheckedCount: 0 },
    clothing = null,
    prepAgenda = [],
    variant = 'dashboard',
    onDismissAnnouncement,
}) => {
    return (
        <div className={cn(
            'grid gap-3',
            variant === 'dashboard' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'
        )}>
            <SectionCard
                title="Announcements"
                icon={Bell}
                variant={variant}
                accentClass="bg-amber-500/18 text-amber-300"
                extra={announcements.length > 0 ? <span className="module-badge">{announcements.length}</span> : null}
            >
                {announcements.length === 0 ? (
                    <EmptyState>No active announcements.</EmptyState>
                ) : (
                    <div className="space-y-2.5">
                        {announcements.slice(0, variant === 'dashboard' ? 2 : 3).map((announcement) => (
                            <div key={announcement.id} className="module-list-item px-3 py-3">
                                <div className="flex items-start gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold">{announcement.title}</p>
                                        <p className="mt-1 line-clamp-2 text-sm text-white/58">{announcement.body}</p>
                                        {announcement.memberName && (
                                            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-white/35">For {announcement.memberName}</p>
                                        )}
                                    </div>
                                    {onDismissAnnouncement && (
                                        <button
                                            onClick={() => onDismissAnnouncement(announcement.id)}
                                            className="module-icon-button h-8 w-8 rounded-xl text-white/45"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SectionCard>

            <SectionCard
                title="Routines"
                icon={CheckSquare}
                variant={variant}
                accentClass="bg-emerald-500/18 text-emerald-300"
                extra={tasks.length > 0 ? <span className="module-badge">{tasks.length}</span> : null}
            >
                {tasks.length === 0 ? (
                    <EmptyState>No routines due right now.</EmptyState>
                ) : (
                    <div className="space-y-2">
                        {tasks.slice(0, variant === 'dashboard' ? 4 : 5).map((task) => (
                            <div key={task.id} className="module-list-item px-3 py-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold">{task.title}</p>
                                        <p className="mt-1 text-sm text-white/48">
                                            {task.assignedTo || 'Unassigned'}
                                            {task.dueTime ? ` • ${task.dueTime}` : ''}
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                                        {task.points} pts
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SectionCard>

            <SectionCard
                title="Shopping"
                icon={ShoppingCart}
                variant={variant}
                accentClass="bg-sky-500/18 text-sky-300"
            >
                <div className="flex h-full flex-col justify-between gap-4">
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <p className="text-4xl font-semibold tracking-tight">{shopping.uncheckedCount || 0}</p>
                            <p className="mt-1 text-sm text-white/55">items left to buy</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
                            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/35">Status</p>
                            <p className="mt-1 text-sm font-medium text-sky-300">
                                {(shopping.uncheckedCount || 0) > 0 ? 'Needs a pass' : 'All clear'}
                            </p>
                        </div>
                    </div>

                    <p className="text-sm leading-6 text-white/48">
                        Meal-generated items stay editable until they are checked off in the weekly shopping list.
                    </p>
                </div>
            </SectionCard>

            <SectionCard
                title="Prep + Clothing"
                icon={ClipboardList}
                variant={variant}
                accentClass="bg-violet-500/18 text-violet-300"
            >
                <div className="space-y-3">
                    {clothing ? (
                        <div className="module-list-item px-3 py-3">
                            <div className="mb-1 flex items-center gap-2">
                                <Shirt size={14} className="text-violet-300" />
                                <span className="text-sm font-semibold">{clothing.main}</span>
                            </div>
                            <p className="text-sm text-white/55">{clothing.layers}</p>
                            {clothing.accessories?.length > 0 && (
                                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-white/35">
                                    {clothing.accessories.join(' • ')}
                                </p>
                            )}
                        </div>
                    ) : (
                        <EmptyState>Configure weather for clothing guidance.</EmptyState>
                    )}

                    {prepAgenda.length === 0 ? (
                        <EmptyState>No prep checklist for today.</EmptyState>
                    ) : (
                        <div className="space-y-2">
                            {prepAgenda.slice(0, variant === 'dashboard' ? 4 : 6).map((item) => (
                                <div key={item.id} className="module-list-item px-3 py-2.5">
                                    <p className="truncate text-sm font-medium text-white/80">{item.label}</p>
                                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/35">
                                        {item.eventTitle}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SectionCard>
        </div>
    );
};

export default TodayStrip;
