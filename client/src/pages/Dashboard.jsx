import React from 'react';
import { useSelector } from 'react-redux';
import { useClock } from '../hooks/useClock';
import { cn } from '../lib/utils';

const Dashboard = () => {
    const { time, date, hours } = useClock();
    const { greeting, weather, upcomingEvents, dinner, scoreboard, clothing } = useSelector((state) => state.dashboard);

    // Dynamic greeting based on time
    const dynamicGreeting = hours < 12 ? 'Good Morning' : hours < 18 ? 'Good Afternoon' : 'Good Evening';

    return (
        <div className="h-full w-full">
            <h1 className="text-3xl mb-6">Today</h1>
            <div className="grid grid-cols-3 grid-rows-2 gap-6 h-[calc(100%-4rem)]">
                {/* Zone A: Context */}
                <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-center">
                    <h2 className="text-xl text-gray-400 mb-2">{dynamicGreeting}</h2>
                    <div className="text-6xl font-bold text-editorial-text">{time}</div>
                    <div className="text-lg text-gray-500 mt-1">{date}</div>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-4xl">{weather.icon}</span>
                        <span className="text-2xl font-medium">{weather.temp}°C</span>
                    </div>
                </div>

                {/* Clothing Recommendation */}
                <div className="bg-pastel-yellow/30 rounded-3xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
                    <h2 className="text-xl font-serif mb-2">Wear This</h2>
                    <div className="text-6xl mb-2">{clothing?.icon || '👕'}</div>
                    <div className="text-2xl font-bold text-editorial-text">{clothing?.recommendation || 'T-Shirt'}</div>
                </div>

                {/* Zone B: Timeline (Spans 2 rows) */}
                <div className="bg-white rounded-3xl p-6 shadow-sm row-span-2 col-start-3 overflow-y-auto">
                    <h2 className="text-xl font-serif mb-4">Up Next</h2>
                    <div className="space-y-4">
                        {upcomingEvents.map((event) => (
                            <div key={event.id} className={cn(
                                "p-4 rounded-xl border-l-4",
                                event.color === 'pastel-blue' && "bg-pastel-blue/20 border-pastel-blue",
                                event.color === 'pastel-pink' && "bg-pastel-pink/20 border-pastel-pink",
                                event.color === 'pastel-green' && "bg-pastel-green/20 border-pastel-green",
                                event.color === 'pastel-yellow' && "bg-pastel-yellow/20 border-pastel-yellow",
                                event.color === 'pastel-purple' && "bg-pastel-purple/20 border-pastel-purple",
                            )}>
                                <div className="font-bold">{event.title}</div>
                                <div className="text-sm text-gray-600">{event.time}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Zone C: Dinner Hero */}
                <div className="bg-pastel-green/30 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:bg-pastel-green/40 transition-colors">
                    <div>
                        <h2 className="text-xl font-serif mb-1">Tonight's Dinner</h2>
                        <div className="text-3xl font-bold text-editorial-text">{dinner.title}</div>
                    </div>
                    <div className="absolute right-[-20px] bottom-[-20px] opacity-20 group-hover:opacity-30 transition-opacity">
                        <span className="text-9xl">{dinner.emoji}</span>
                    </div>
                </div>

                {/* Zone D: Scoreboard */}
                <div className="bg-white rounded-3xl p-6 shadow-sm">
                    <h2 className="text-xl font-serif mb-4">Leaderboard</h2>
                    <div className="space-y-3">
                        {scoreboard.map((member, index) => (
                            <div key={member.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-8 h-8 rounded-full", `bg-${member.color}`)}></div>
                                    <span className="font-bold">{member.name}</span>
                                </div>
                                <span className={cn("font-bold", index === 0 ? "text-yellow-500" : "text-gray-400")}>
                                    ⭐ {member.points}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
