import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft, ChevronRight, Plus, X, Search, Loader2, ShoppingCart, Calendar, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import {
    fetchMeals,
    setMealAsync,
    removeMealAsync,
    openRecipePicker,
    closeRecipePicker,
    setWeekStart as setWeekStartAction,
    generateShoppingList,
    toggleShoppingListItem,
} from '../features/mealsSlice';
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

// Meal type configuration
const MEAL_TYPES = [
    { key: 'breakfast', label: 'Breakfast', emoji: '🍳', color: 'text-yellow-400' },
    { key: 'lunch', label: 'Lunch', emoji: '🥗', color: 'text-green-400' },
    { key: 'dinner', label: 'Dinner', emoji: '🍽️', color: 'text-blue-400' },
    { key: 'snack', label: 'Snack', emoji: '🍎', color: 'text-pink-400' },
];

// Recipe Picker Modal
const RecipePicker = ({ date, mealType, onSelect, onClose }) => {
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

    const mealTypeConfig = MEAL_TYPES.find(m => m.key === mealType);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold">Choose a Recipe</h2>
                        <p className="text-sm text-white/50">
                            {mealTypeConfig?.emoji} {mealTypeConfig?.label} on {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                    </div>
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

// Shopping List Modal
const ShoppingListModal = ({ onClose }) => {
    const dispatch = useDispatch();
    const { shoppingList } = useSelector(state => state.meals);

    if (!shoppingList.items || shoppingList.items.length === 0) {
        return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="card w-full max-w-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Shopping List</h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                    <p className="text-white/50 text-center py-8">No items in shopping list</p>
                </div>
            </div>
        );
    }

    const checkedCount = shoppingList.items.filter(i => i.checked).length;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold">Shopping List</h2>
                        <p className="text-sm text-white/50">
                            {shoppingList.mealCount} meals · {shoppingList.items.length} items · {checkedCount} checked
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors touch-target">
                        <X size={24} />
                    </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto touch-scroll space-y-2">
                    {shoppingList.items.map((item) => (
                        <div
                            key={item.id}
                            className={cn(
                                "flex items-start gap-3 p-3 bg-white/5 rounded-xl transition-all",
                                item.checked && "opacity-50"
                            )}
                        >
                            <button
                                onClick={() => dispatch(toggleShoppingListItem(item.id))}
                                className={cn(
                                    "mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors touch-target flex-shrink-0",
                                    item.checked
                                        ? "bg-success border-success"
                                        : "border-white/30 hover:border-success"
                                )}
                            >
                                {item.checked && <Check size={16} />}
                            </button>
                            <div className="flex-1">
                                <div className={cn(
                                    "font-medium",
                                    item.checked && "line-through"
                                )}>
                                    {item.name}
                                </div>
                                <div className="text-xs text-white/50 mt-1">
                                    For: {item.recipes.join(', ')}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const MealPlanning = () => {
    const dispatch = useDispatch();
    const { meals, loading, showRecipePicker, selectedDate, selectedMealType, weekStart: reduxWeekStart } = useSelector(state => state.meals);
    const [showShoppingList, setShowShoppingList] = useState(false);

    // Use stable string for week start, default to current week
    const weekStartStr = reduxWeekStart || formatDate(getWeekStart(new Date()));
    const weekStart = new Date(weekStartStr);

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
    useEffect(() => {
        dispatch(fetchMeals(weekStartStr));
    }, [dispatch, weekStartStr]);

    // Navigate weeks
    const prevWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() - 7);
        dispatch(setWeekStartAction(formatDate(d)));
    };

    const nextWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 7);
        dispatch(setWeekStartAction(formatDate(d)));
    };

    const goToToday = () => {
        const today = getWeekStart(new Date());
        dispatch(setWeekStartAction(formatDate(today)));
    };

    // Handle meal assignment
    const handleSelectRecipe = (recipe) => {
        if (!selectedDate || !selectedMealType) return;
        dispatch(setMealAsync({ date: selectedDate, mealType: selectedMealType, recipe }));
    };

    // Handle meal removal
    const handleRemoveMeal = (date, mealType, e) => {
        e.stopPropagation();
        dispatch(removeMealAsync({ date, mealType }));
    };

    // Generate shopping list
    const handleGenerateShoppingList = () => {
        const start = formatDate(weekStart);
        const end = formatDate(weekEnd);
        dispatch(generateShoppingList({ start, end }));
        setShowShoppingList(true);
    };

    const today = formatDate(new Date());
    const isCurrentWeek = formatDate(getWeekStart(new Date())) === formatDate(weekStart);

    // Calculate stats
    const totalMeals = Object.values(meals).reduce((acc, dayMeals) => {
        return acc + Object.keys(dayMeals).length;
    }, 0);
    const possibleMeals = 7 * 4; // 7 days × 4 meal types

    return (
        <div className="h-full w-full flex flex-col gap-4 animate-fade-in">
            {/* Recipe Picker Modal */}
            {showRecipePicker && selectedDate && selectedMealType && (
                <RecipePicker
                    date={selectedDate}
                    mealType={selectedMealType}
                    onSelect={handleSelectRecipe}
                    onClose={() => dispatch(closeRecipePicker())}
                />
            )}

            {/* Shopping List Modal */}
            {showShoppingList && (
                <ShoppingListModal onClose={() => setShowShoppingList(false)} />
            )}

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">Meal Planning</h1>
                    <p className="text-white/50 text-sm">{weekRange}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleGenerateShoppingList}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-success text-white rounded-xl hover:bg-success/80 transition-colors touch-target"
                    >
                        <ShoppingCart size={18} />
                        Shopping List
                    </button>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                    {weekDays.map((day, idx) => {
                        const dateStr = formatDate(day);
                        const dayMeals = meals[dateStr] || {};
                        const isToday = dateStr === today;

                        return (
                            <div
                                key={dateStr}
                                className={cn(
                                    "card flex flex-col min-h-[280px] animate-slide-up",
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

                                {/* Meal Types */}
                                <div className="flex-1 space-y-2">
                                    {MEAL_TYPES.map((mealType) => {
                                        const meal = dayMeals[mealType.key];

                                        return (
                                            <div key={mealType.key} className="relative">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={cn("text-xs font-medium", mealType.color)}>
                                                        {mealType.emoji} {mealType.label}
                                                    </span>
                                                </div>
                                                {loading ? (
                                                    <div className="h-12 bg-white/5 rounded-lg flex items-center justify-center">
                                                        <Loader2 className="animate-spin text-white/20" size={16} />
                                                    </div>
                                                ) : meal ? (
                                                    <div
                                                        className="relative group bg-white/5 rounded-lg p-2 hover:bg-white/10 transition-colors cursor-pointer"
                                                        onClick={() => dispatch(openRecipePicker({ date: dateStr, mealType: mealType.key }))}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {meal.recipePhoto ? (
                                                                <img
                                                                    src={meal.recipePhoto}
                                                                    alt=""
                                                                    className="w-10 h-10 rounded object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                                                                    {meal.recipeEmoji || '🍽️'}
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs font-medium truncate">
                                                                    {meal.recipeTitle}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => handleRemoveMeal(dateStr, mealType.key, e)}
                                                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => dispatch(openRecipePicker({ date: dateStr, mealType: mealType.key }))}
                                                        className="w-full h-12 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-white/30 hover:border-primary hover:text-primary transition-colors"
                                                    >
                                                        <Plus size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
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
                            {totalMeals}
                        </div>
                        <div className="text-xs text-white/50">Meals Planned</div>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="text-center">
                        <div className="text-2xl font-bold text-warning">
                            {possibleMeals - totalMeals}
                        </div>
                        <div className="text-xs text-white/50">Slots Left</div>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                            {Math.round((totalMeals / possibleMeals) * 100)}%
                        </div>
                        <div className="text-xs text-white/50">Completion</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MealPlanning;
