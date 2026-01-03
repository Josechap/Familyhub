import React from 'react';
import { Calendar, CheckSquare, Utensils, UtensilsCrossed, Settings, Home } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setActiveTab } from '../features/appSlice';
import { cn } from '../lib/utils';

const Sidebar = () => {
    const activeTab = useSelector((state) => state.app.activeTab);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const navItems = [
        { id: 'calendar', icon: Calendar, path: '/calendar' },
        { id: 'tasks', icon: CheckSquare, path: '/tasks' },
        { id: 'recipes', icon: Utensils, path: '/recipes' },
        { id: 'meals', icon: UtensilsCrossed, path: '/meals' },
    ];

    const handleNav = (id, path) => {
        dispatch(setActiveTab(id));
        navigate(path);
    };

    return (
        <div className="w-[80px] h-screen bg-white border-r border-gray-200 flex flex-col items-center py-6 fixed left-0 top-0 z-50">
            {/* Logo / Home */}
            <button
                onClick={() => handleNav('dashboard', '/')}
                className="mb-10 p-3 rounded-xl hover:bg-gray-100 transition-colors"
            >
                <div className="w-10 h-10 bg-pastel-blue rounded-full flex items-center justify-center text-white font-bold text-xl">
                    F
                </div>
            </button>

            {/* Main Nav */}
            <div className="flex-1 flex flex-col gap-6 w-full px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNav(item.id, item.path)}
                            className={cn(
                                "w-full aspect-square flex items-center justify-center rounded-2xl transition-all duration-300",
                                isActive
                                    ? "bg-editorial-text text-white shadow-lg scale-105"
                                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                            )}
                        >
                            <Icon size={28} strokeWidth={isActive ? 2.5 : 2} />
                        </button>
                    );
                })}
            </div>

            {/* Settings */}
            <button
                onClick={() => handleNav('settings', '/settings')}
                className={cn(
                    "w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-300 mt-auto",
                    activeTab === 'settings'
                        ? "bg-editorial-text text-white shadow-lg"
                        : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                )}
            >
                <Settings size={28} />
            </button>
        </div>
    );
};

export default Sidebar;
