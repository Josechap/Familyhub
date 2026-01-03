import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Search, Loader2 } from 'lucide-react';
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

// Format date for display
const formatDisplayDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

// Recipe Picker Modal
const RecipePicker = ({ onSelect, onClose }) => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchRecipes = async () => {
            try {
                // Fetch both local and Paprika recipes
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between">
                    <h2 className="text-xl font-serif">Choose a Recipe</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search recipes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-blue"
                        />
                    </div>
                </div>

                {/* Recipe List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-gray-400" size={32} />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center text-gray-400 py-12">No recipes found</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {filtered.map((recipe) => (
                                <button
                                    key={recipe.id}
                                    onClick={() => onSelect(recipe)}
                                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
                                >
                                    {recipe.photoUrl ? (
                                        <img
                                            src={recipe.photoUrl}
                                            alt=""
                                            className="w-14 h-14 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-pastel-blue to-pastel-purple flex items-center justify-center text-2xl">
                                            {recipe.emoji || '🍽️'}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{recipe.title}</div>
                                        {recipe.paprikaSource && (
                                            <div className="text-xs text-orange-500">Paprika</div>
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
    const handleRemoveMeal = async (date) => {
        try {
            await api.removeMeal(date);
            fetchMeals();
        } catch (error) {
            console.error('Error removing meal:', error);
        }
    };

    const today = formatDate(new Date());

    return (
        <div className="h-full w-full flex flex-col">
            {/* Recipe Picker Modal */}
            {pickerDate && (
                <RecipePicker
                    onSelect={handleSelectRecipe}
                    onClose={() => setPickerDate(null)}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-serif">Meal Planning</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToToday}
                        className="px-4 py-2 text-sm font-medium bg-white rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Today
                    </button>
                    <button
                        onClick={prevWeek}
                        className="p-2 bg-white rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={nextWeek}
                        className="p-2 bg-white rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Week Grid */}
            <div className="flex-1 grid grid-cols-7 gap-4">
                {weekDays.map((day) => {
                    const dateStr = formatDate(day);
                    const meal = meals[dateStr];
                    const isToday = dateStr === today;

                    return (
                        <div
                            key={dateStr}
                            className={cn(
                                "bg-white rounded-3xl p-4 flex flex-col",
                                isToday && "ring-2 ring-pastel-blue"
                            )}
                        >
                            {/* Day Header */}
                            <div className={cn(
                                "text-center mb-4 pb-3 border-b",
                                isToday && "text-pastel-blue"
                            )}>
                                <div className="text-sm font-medium text-gray-500">
                                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                                <div className={cn(
                                    "text-2xl font-bold",
                                    isToday ? "text-pastel-blue" : "text-editorial-text"
                                )}>
                                    {day.getDate()}
                                </div>
                            </div>

                            {/* Meal Content */}
                            <div className="flex-1 flex flex-col items-center justify-center">
                                {loading ? (
                                    <Loader2 className="animate-spin text-gray-300" size={24} />
                                ) : meal ? (
                                    <div className="text-center group relative w-full">
                                        {meal.recipe_photo ? (
                                            <img
                                                src={meal.recipe_photo}
                                                alt=""
                                                className="w-full h-24 object-cover rounded-xl mb-2"
                                            />
                                        ) : (
                                            <div className="text-5xl mb-2">
                                                {meal.recipe_emoji || '🍽️'}
                                            </div>
                                        )}
                                        <div className="text-sm font-medium line-clamp-2">
                                            {meal.recipe_title}
                                        </div>
                                        {/* Remove button */}
                                        <button
                                            onClick={() => handleRemoveMeal(dateStr)}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setPickerDate(dateStr)}
                                        className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-pastel-blue hover:text-pastel-blue transition-colors"
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
    );
};

export default MealPlanning;
