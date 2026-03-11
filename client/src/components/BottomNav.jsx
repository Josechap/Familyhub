import React from 'react';
import { Home, Calendar, CheckSquare, ChefHat, Settings, UtensilsCrossed } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { setActiveTab } from '../features/appSlice';
import { cn } from '../lib/utils';

const BottomNav = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { id: 'dashboard', icon: Home, path: '/', label: 'Home' },
        { id: 'calendar', icon: Calendar, path: '/calendar', label: 'Calendar' },
        { id: 'tasks', icon: CheckSquare, path: '/tasks', label: 'Tasks' },
        { id: 'recipes', icon: ChefHat, path: '/recipes', label: 'Recipes' },
        { id: 'meals', icon: UtensilsCrossed, path: '/meals', label: 'Meals' },
        { id: 'settings', icon: Settings, path: '/settings', label: 'Settings' },
    ];

    const handleNav = (id, path) => {
        dispatch(setActiveTab(id));
        navigate(path);
    };

    return (
        <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3">
            <div
                className="mx-auto max-w-2xl rounded-[2rem] glass px-2 py-2 shadow-[0_24px_60px_rgba(0,0,0,0.32)]"
                style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
            >
                <div className="grid grid-cols-6 gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNav(item.id, item.path)}
                                className={cn(
                                    "flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 transition-all duration-200 touch-target no-select",
                                    isActive
                                        ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                                        : "text-white/50 hover:bg-white/5 hover:text-white/80 active:scale-95"
                                )}
                            >
                                <div className={cn(
                                    "rounded-xl p-2 transition-all duration-200",
                                    isActive ? "bg-primary/20 text-primary" : ""
                                )}>
                                    <Icon
                                        size={22}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className="transition-all duration-200"
                                    />
                                </div>
                                <span className={cn(
                                    "text-[11px] font-medium leading-none transition-all duration-200",
                                    isActive ? "opacity-100" : "opacity-60"
                                )}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};

export default BottomNav;
