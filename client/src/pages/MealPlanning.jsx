import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Search, Loader2, Utensils } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/api';

// Helper to get week start (Monday)
const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

// Format date as YYYY-MM-DD
const formatDate = (date) => date.toISOString().split('T')[0];

// Recipe Picker Modal
const RecipePicker = ({ onSelect, onClose }) => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchRecipes = async () => {
            try {
                const [localRecipes, paprikaData] = await Promise.all([
                    api.getRecipes(),
                    api.getPaprikaRecipes().catch(() => ({ recipes: [] })),
                ]);

                const paprikaRecipes = (paprikaData.recipes || []).map(r => ({
                    id: r.id,
                    title: r.title,
                    emoji: null,
                    photoUrl: r.photoUrl,
                    paprikaSource: true,
                }));

                setRecipes([...localRecipes, ...paprikaRecipes]);
            } catch (error) {
                console.error('Error fetching recipes:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRecipes();
    }, []);

    const filtered = recipes.filter(r =>
        r.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Choose a Recipe</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors touch-target">
                        <X size={24} />
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                    <input
                        type="text"
                        placeholder="Search recipes..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-white/40"
                    />
                </div>

                {/* Recipe List */}
                <div className="flex-1 overflow-y-auto touch-scroll">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-white/40" size={32} />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center text-white/40 py-12">No recipes found</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {filtered.map((recipe) => (
                                <button
                                    key={recipe.id}
                                    onClick={() => onSelect(recipe)}
                                    className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left touch-target"
                                >
                                    {recipe.photoUrl ? (
                                        <img
                                            src={recipe.photoUrl}
                                            alt=""
                                            className="w-14 h-14 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-2xl">
                                            {recipe.emoji || '🍽️'}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{recipe.title}</div>
                                        {recipe.paprikaSource && (
                                            <div className="text-xs text-orange-400">Paprika</div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MealPlanning = () => {
    const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
    const [meals, setMeals] = useState({});
    const [loading, setLoading] = useState(true);
    const [pickerDate, setPickerDate] = useState(null);

    // Generate week days
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
    });

    // Week range for display
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    // Fetch meals for current week
    const fetchMeals = async () => {
        setLoading(true);
        try {
            const data = await api.getMealsForWeek(formatDate(weekStart));
            const mealsMap = {};
            data.forEach(m => {
                mealsMap[m.date] = m;
            });
            setMeals(mealsMap);
        } catch (error) {
            console.error('Error fetching meals:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeals();
    }, [weekStart]);

    // Navigate weeks
    const prevWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() - 7);
        setWeekStart(d);
    };

    const nextWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 7);
        setWeekStart(d);
    };

    const goToToday = () => {
        setWeekStart(getWeekStart(new Date()));
    };

    // Handle meal assignment
    const handleSelectRecipe = async (recipe) => {
        if (!pickerDate) return;

        try {
            await api.setMeal(pickerDate, recipe);
            setPickerDate(null);
            fetchMeals();
        } catch (error) {
            console.error('Error setting meal:', error);
        }
    };

    // Handle meal removal
    const handleRemoveMeal = async (date, e) => {
        e.stopPropagation();
        try {
            await api.removeMeal(date);
            fetchMeals();
        } catch (error) {
            console.error('Error removing meal:', error);
        }
    };

    const today = formatDate(new Date());
    const isCurrentWeek = formatDate(getWeekStart(new Date())) === formatDate(weekStart);

    return (
        <div className="h-full w-full flex flex-col gap-4 animate-fade-in">
            {/* Recipe Picker Modal */}
            {pickerDate && (
                <RecipePicker
                    onSelect={handleSelectRecipe}
                    onClose={() => setPickerDate(null)}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">Meal Planning</h1>
                    <p className="text-white/50 text-sm">{weekRange}</p>
                </div>
                <div className="flex items-center gap-2">
                    {!isCurrentWeek && (
                        <button
                            onClick={goToToday}
                            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary/80 transition-colors touch-target"
                        >
                            This Week
                        </button>
                    )}
                    <button
                        onClick={prevWeek}
                        className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors touch-target"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={nextWeek}
                        className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors touch-target"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Week Grid - Responsive */}
            <div className="flex-1 overflow-y-auto touch-scroll hide-scrollbar">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {weekDays.map((day, idx) => {
                        const dateStr = formatDate(day);
                        const meal = meals[dateStr];
                        const isToday = dateStr === today;

                        return (
                            <div
                                key={dateStr}
                                className={cn(
                                    "card flex flex-col min-h-[180px] animate-slide-up",
                                    isToday && "ring-2 ring-primary"
                                )}
                                style={{ animationDelay: `${idx * 30}ms` }}
                            >
                                {/* Day Header */}
                                <div className={cn(
                                    "text-center mb-3 pb-2 border-b border-white/10",
                                    isToday && "text-primary"
                                )}>
                                    <div className="text-xs font-medium text-white/50">
                                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                    <div className={cn(
                                        "text-xl font-bold",
                                        isToday ? "text-primary" : "text-white"
                                    )}>
                                        {day.getDate()}
                                    </div>
                                </div>

                                {/* Meal Content */}
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    {loading ? (
                                        <Loader2 className="animate-spin text-white/20" size={24} />
                                    ) : meal ? (
                                        <div
                                            className="text-center group relative w-full cursor-pointer"
                                            onClick={() => setPickerDate(dateStr)}
                                        >
                                            {meal.recipe_photo ? (
                                                <img
                                                    src={meal.recipe_photo}
                                                    alt=""
                                                    className="w-full h-20 object-cover rounded-xl mb-2"
                                                />
                                            ) : (
                                                <div className="text-4xl mb-2">
                                                    {meal.recipe_emoji || '🍽️'}
                                                </div>
                                            )}
                                            <div className="text-sm font-medium line-clamp-2">
                                                {meal.recipe_title}
                                            </div>
                                            {/* Remove button */}
                                            <button
                                                onClick={(e) => handleRemoveMeal(dateStr, e)}
                                                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center touch-target"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setPickerDate(dateStr)}
                                            className="w-14 h-14 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center text-white/30 hover:border-primary hover:text-primary transition-colors touch-target"
                                        >
                                            <Plus size={24} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="card">
                <div className="flex items-center justify-around">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-success">
                            {Object.keys(meals).length}
                        </div>
                        <div className="text-xs text-white/50">Meals Planned</div>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="text-center">
                        <div className="text-2xl font-bold text-warning">
                            {7 - Object.keys(meals).length}
                        </div>
                        <div className="text-xs text-white/50">Days Left</div>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="text-center flex flex-col items-center">
                        <Utensils size={24} className="text-primary mb-1" />
                        <div className="text-xs text-white/50">Plan Ahead</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MealPlanning;
