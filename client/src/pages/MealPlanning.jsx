import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    ChevronLeft,
    ChevronRight,
    X,
    Search,
    Loader2,
    ShoppingCart,
    Plus,
    Trash2,
    Check,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
    fetchMeals,
    setMealAsync,
    removeMealAsync,
    closeRecipePicker,
    setWeekStart as setWeekStartAction,
    generateShoppingList,
    fetchShoppingList,
    updateShoppingListItem,
    addShoppingListItem,
    deleteShoppingListItem,
} from '../features/mealsSlice';
import api from '../lib/api';

const getWeekStart = (date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    current.setDate(diff);
    current.setHours(0, 0, 0, 0);
    return current;
};

const formatDate = (date) => date.toISOString().split('T')[0];

const MEAL_TYPES = [
    { key: 'breakfast', label: 'Breakfast', emoji: '🍳' },
    { key: 'lunch', label: 'Lunch', emoji: '🥗' },
    { key: 'dinner', label: 'Dinner', emoji: '🍽️' },
    { key: 'snack', label: 'Snack', emoji: '🍎' },
];

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

                const paprikaRecipes = (paprikaData.recipes || []).map((recipe) => ({
                    id: recipe.id,
                    title: recipe.title,
                    emoji: null,
                    photoUrl: recipe.photoUrl,
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

    const filtered = recipes.filter((recipe) =>
        recipe.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-scale-in">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold">Choose a Recipe</h2>
                        <p className="text-sm text-white/50">
                            {mealType} on {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors touch-target">
                        <X size={24} />
                    </button>
                </div>

                <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                    <input
                        type="text"
                        placeholder="Search recipes..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-white/40"
                    />
                </div>

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
                                        <img src={recipe.photoUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />
                                    ) : (
                                        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-2xl">
                                            {recipe.emoji || '🍽️'}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{recipe.title}</div>
                                        {recipe.paprikaSource && <div className="text-xs text-orange-400">Paprika</div>}
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

const ShoppingListModal = ({ onClose }) => {
    const dispatch = useDispatch();
    const { shoppingList } = useSelector((state) => state.meals);
    const [draftLabel, setDraftLabel] = useState('');

    const handleToggleItem = (item) => {
        dispatch(updateShoppingListItem({
            id: item.id,
            updates: { checked: !item.checked },
        }));
    };

    const handleAddItem = () => {
        const label = draftLabel.trim();
        if (!label) return;
        dispatch(addShoppingListItem({ label }));
        setDraftLabel('');
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-scale-in">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold">Shopping List</h2>
                        <p className="text-sm text-white/50">
                            {shoppingList.uncheckedCount} unchecked of {shoppingList.items.length}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors touch-target">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={draftLabel}
                        onChange={(event) => setDraftLabel(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                handleAddItem();
                            }
                        }}
                        placeholder="Add an item"
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-white/40"
                    />
                    <button
                        onClick={handleAddItem}
                        className="px-4 py-3 rounded-xl bg-primary text-white hover:bg-primary/80 transition-colors"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto touch-scroll space-y-2">
                    {shoppingList.items.length === 0 ? (
                        <p className="text-white/50 text-center py-8">No items in shopping list</p>
                    ) : (
                        shoppingList.items.map((item) => (
                            <div
                                key={item.id}
                                className={cn(
                                    'flex items-start gap-3 p-3 bg-white/5 rounded-xl transition-all',
                                    item.checked && 'opacity-50'
                                )}
                            >
                                <button
                                    onClick={() => handleToggleItem(item)}
                                    className={cn(
                                        'mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors touch-target flex-shrink-0',
                                        item.checked
                                            ? 'bg-success border-success'
                                            : 'border-white/30 hover:border-success'
                                    )}
                                >
                                    {item.checked && <Check size={16} />}
                                </button>
                                <div className="flex-1">
                                    <div className={cn('font-medium', item.checked && 'line-through')}>
                                        {item.label}
                                    </div>
                                    <div className="text-xs text-white/50 mt-1">
                                        {item.category} {item.mealDates?.length > 0 ? `• ${item.mealDates.length} planned day(s)` : ''}
                                    </div>
                                </div>
                                <button
                                    onClick={() => dispatch(deleteShoppingListItem(item.id))}
                                    className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const MealPlanning = () => {
    const dispatch = useDispatch();
    const {
        meals,
        loading,
        shoppingList,
        showRecipePicker,
        selectedDate,
        selectedMealType,
        weekStart: reduxWeekStart,
    } = useSelector((state) => state.meals);
    const [showShoppingList, setShowShoppingList] = useState(false);
    const [recipePickerContext, setRecipePickerContext] = useState(null);

    const weekStartStr = reduxWeekStart || formatDate(getWeekStart(new Date()));
    const weekStart = new Date(weekStartStr);
    const weekDays = Array.from({ length: 7 }, (_, index) => {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + index);
        return day;
    });
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    useEffect(() => {
        dispatch(fetchMeals(weekStartStr));
    }, [dispatch, weekStartStr]);

    useEffect(() => {
        dispatch(fetchShoppingList());
    }, [dispatch]);

    const prevWeek = () => {
        const next = new Date(weekStart);
        next.setDate(next.getDate() - 7);
        dispatch(setWeekStartAction(formatDate(next)));
    };

    const nextWeek = () => {
        const next = new Date(weekStart);
        next.setDate(next.getDate() + 7);
        dispatch(setWeekStartAction(formatDate(next)));
    };

    const goToToday = () => {
        dispatch(setWeekStartAction(formatDate(getWeekStart(new Date()))));
    };

    const handleSelectRecipe = (recipe) => {
        if (!recipePickerContext) return;
        dispatch(setMealAsync({
            date: recipePickerContext.date,
            mealType: recipePickerContext.mealType,
            recipe,
        }));
        setRecipePickerContext(null);
        dispatch(closeRecipePicker());
    };

    const handleRemoveMeal = (date, mealType, event) => {
        event.stopPropagation();
        dispatch(removeMealAsync({ date, mealType }));
    };

    const handleGenerateShoppingList = async () => {
        await dispatch(generateShoppingList({
            start: formatDate(weekStart),
            end: formatDate(weekEnd),
        }));
        setShowShoppingList(true);
    };

    const today = formatDate(new Date());
    const isCurrentWeek = formatDate(getWeekStart(new Date())) === formatDate(weekStart);
    const totalMeals = Object.values(meals).reduce((count, dayMeals) => count + Object.keys(dayMeals).length, 0);
    const possibleMeals = 7 * 4;

    return (
        <div className="h-full w-full flex flex-col gap-4 animate-fade-in">
            {recipePickerContext && (
                <RecipePicker
                    date={recipePickerContext.date}
                    mealType={recipePickerContext.mealType}
                    onSelect={handleSelectRecipe}
                    onClose={() => setRecipePickerContext(null)}
                />
            )}

            {showShoppingList && (
                <ShoppingListModal onClose={() => setShowShoppingList(false)} />
            )}

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
                        {shoppingList.uncheckedCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">
                                {shoppingList.uncheckedCount}
                            </span>
                        )}
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="card">
                    <p className="text-sm text-white/50">Meals planned</p>
                    <p className="text-3xl font-semibold mt-1">{totalMeals}</p>
                </div>
                <div className="card">
                    <p className="text-sm text-white/50">Coverage</p>
                    <p className="text-3xl font-semibold mt-1">{Math.round((totalMeals / possibleMeals) * 100)}%</p>
                </div>
                <div className="card">
                    <p className="text-sm text-white/50">Shopping items</p>
                    <p className="text-3xl font-semibold mt-1">{shoppingList.items.length}</p>
                </div>
                <div className="card">
                    <p className="text-sm text-white/50">Unchecked</p>
                    <p className="text-3xl font-semibold mt-1">{shoppingList.uncheckedCount}</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto touch-scroll hide-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                    {weekDays.map((day) => {
                        const dateStr = formatDate(day);
                        const dayMeals = meals[dateStr] || {};
                        const isToday = dateStr === today;

                        return (
                            <div
                                key={dateStr}
                                className={cn(
                                    'card min-h-[280px] flex flex-col',
                                    isToday && 'ring-2 ring-primary/60'
                                )}
                            >
                                <div className="mb-3">
                                    <p className="text-sm text-white/50">{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                    <p className="text-xl font-semibold">{day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                </div>

                                <div className="space-y-2 flex-1">
                                    {MEAL_TYPES.map((mealType) => {
                                        const meal = dayMeals[mealType.key];
                                        return (
                                            <button
                                                key={mealType.key}
                                                onClick={() => setRecipePickerContext({ date: dateStr, mealType: mealType.key })}
                                                className="w-full p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-white/40 uppercase tracking-wide">
                                                            {mealType.emoji} {mealType.label}
                                                        </p>
                                                        <p className="font-medium truncate mt-1">
                                                            {meal?.recipeTitle || 'Add meal'}
                                                        </p>
                                                    </div>
                                                    {meal && (
                                                        <button
                                                            onClick={(event) => handleRemoveMeal(dateStr, mealType.key, event)}
                                                            className="p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {loading && (
                <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
                    <Loader2 className="animate-spin text-white/30" size={40} />
                </div>
            )}
        </div>
    );
};

export default MealPlanning;
