import React from 'react';
import { Home, Calendar, CheckSquare, ChefHat, Settings } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
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
        { id: 'settings', icon: Settings, path: '/settings', label: 'Settings' },
    ];

    const handleNav = (id, path) => {
        dispatch(setActiveTab(id));
        navigate(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10">
            <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNav(item.id, item.path)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-2xl transition-all duration-200 touch-target no-select",
                                isActive
                                    ? "text-primary"
                                    : "text-white/50 hover:text-white/80 active:scale-95"
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-xl transition-all duration-200",
                                isActive && "bg-primary/20"
                            )}>
                                <Icon
                                    size={24}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className="transition-all duration-200"
                                />
                            </div>
                            <span className={cn(
                                "text-xs font-medium transition-all duration-200",
                                isActive ? "opacity-100" : "opacity-0 h-0"
                            )}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
