import React from 'react';
import { Bell, Shirt, ShoppingCart, ClipboardList, CheckSquare, X } from 'lucide-react';
import { cn } from '../lib/utils';

const cardClass = {
    dashboard: 'bg-white/5 border border-white/10 rounded-2xl p-4',
    screensaver: 'bg-black/45 border border-white/10 rounded-2xl p-4 backdrop-blur-md',
};

const SectionCard = ({ title, icon: Icon, variant, accentClass, children, extra = null }) => (
    <div className={cn(cardClass[variant], 'min-w-0')}>
        <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', accentClass)}>
                    <Icon size={18} />
                </div>
                <h3 className="font-semibold text-sm uppercase tracking-wide text-white/70">{title}</h3>
            </div>
            {extra}
        </div>
        {children}
    </div>
);

const EmptyState = ({ children }) => (
    <p className="text-sm text-white/45">{children}</p>
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
            variant === 'dashboard' ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'
        )}>
            <SectionCard
                title="Announcements"
                icon={Bell}
                variant={variant}
                accentClass="bg-amber-500/20 text-amber-300"
            >
                {announcements.length === 0 ? (
                    <EmptyState>No active announcements.</EmptyState>
                ) : (
                    <div className="space-y-2">
                        {announcements.slice(0, variant === 'dashboard' ? 2 : 3).map((announcement) => (
                            <div key={announcement.id} className="rounded-xl bg-white/5 p-3">
                                <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{announcement.title}</p>
                                        <p className="text-sm text-white/60 line-clamp-2">{announcement.body}</p>
                                        {announcement.memberName && (
                                            <p className="text-xs text-white/40 mt-1">For {announcement.memberName}</p>
                                        )}
                                    </div>
                                    {onDismissAnnouncement && (
                                        <button
                                            onClick={() => onDismissAnnouncement(announcement.id)}
                                            className="p-1 rounded-full hover:bg-white/10 transition-colors"
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
                accentClass="bg-emerald-500/20 text-emerald-300"
            >
                {tasks.length === 0 ? (
                    <EmptyState>No routines due right now.</EmptyState>
                ) : (
                    <div className="space-y-2">
                        {tasks.slice(0, variant === 'dashboard' ? 4 : 5).map((task) => (
                            <div key={task.id} className="flex items-center justify-between gap-3 text-sm">
                                <div className="min-w-0">
                                    <p className="font-medium truncate">{task.title}</p>
                                    <p className="text-white/45">{task.assignedTo || 'Unassigned'}{task.dueTime ? ` • ${task.dueTime}` : ''}</p>
                                </div>
                                <span className="text-emerald-300 font-semibold">{task.points} pts</span>
                            </div>
                        ))}
                    </div>
                )}
            </SectionCard>

            <SectionCard
                title="Shopping"
                icon={ShoppingCart}
                variant={variant}
                accentClass="bg-sky-500/20 text-sky-300"
            >
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <p className="text-3xl font-semibold">{shopping.uncheckedCount || 0}</p>
                        <p className="text-sm text-white/55">items left to buy</p>
                    </div>
                    <p className="text-xs text-white/40 max-w-[160px] text-right">
                        Meal-generated items stay editable until checked off.
                    </p>
                </div>
            </SectionCard>

            <SectionCard
                title="Prep + Clothing"
                icon={ClipboardList}
                variant={variant}
                accentClass="bg-violet-500/20 text-violet-300"
            >
                <div className="space-y-3">
                    {clothing ? (
                        <div className="rounded-xl bg-white/5 p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Shirt size={14} className="text-violet-300" />
                                <span className="text-sm font-medium">{clothing.main}</span>
                            </div>
                            <p className="text-xs text-white/55">{clothing.layers}</p>
                            {clothing.accessories?.length > 0 && (
                                <p className="text-xs text-white/40 mt-1">{clothing.accessories.join(', ')}</p>
                            )}
                        </div>
                    ) : (
                        <EmptyState>Configure weather for clothing guidance.</EmptyState>
                    )}

                    {prepAgenda.length === 0 ? (
                        <EmptyState>No prep checklist for today.</EmptyState>
                    ) : (
                        <div className="space-y-1">
                            {prepAgenda.slice(0, variant === 'dashboard' ? 4 : 6).map((item) => (
                                <p key={item.id} className="text-sm text-white/70 truncate">
                                    {item.label} <span className="text-white/40">for {item.eventTitle}</span>
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            </SectionCard>
        </div>
    );
};

export default TodayStrip;
