import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    CalendarDays,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Loader2,
    Plus,
    Search,
    ShoppingCart,
    Sparkles,
    Trash2,
    UtensilsCrossed,
    X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
    addShoppingListItem,
    deleteShoppingListItem,
    fetchMeals,
    fetchShoppingList,
    generateShoppingList,
    removeMealAsync,
    setMealAsync,
    setWeekStart as setWeekStartAction,
    updateShoppingListItem,
} from '../features/mealsSlice';
import api from '../lib/api';
import { EmptyState, PageHeader, PageShell, SurfacePanel } from '../components/ui/ModuleShell';

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
    {
        key: 'breakfast',
        label: 'Breakfast',
        emoji: '🍳',
        badge: 'bg-amber-500/15 text-amber-300',
        border: 'border-amber-500/20',
    },
    {
        key: 'lunch',
        label: 'Lunch',
        emoji: '🥗',
        badge: 'bg-emerald-500/15 text-emerald-300',
        border: 'border-emerald-500/20',
    },
    {
        key: 'dinner',
        label: 'Dinner',
        emoji: '🍽️',
        badge: 'bg-sky-500/15 text-sky-300',
        border: 'border-sky-500/20',
    },
    {
        key: 'snack',
        label: 'Snack',
        emoji: '🍎',
        badge: 'bg-rose-500/15 text-rose-300',
        border: 'border-rose-500/20',
    },
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
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="module-modal flex max-h-[80vh] max-w-3xl flex-col animate-scale-in"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="module-kicker">Meal assignment</p>
                        <h2 className="text-2xl font-semibold">Choose a recipe</h2>
                        <p className="mt-1 text-sm text-white/55">
                            {mealType} on {new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <button onClick={onClose} className="module-icon-button">
                        <X size={20} />
                    </button>
                </div>

                <div className="relative mt-5">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                    <input
                        type="text"
                        placeholder="Search recipes..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="module-input pl-12"
                    />
                </div>

                <div className="mt-5 flex-1 overflow-y-auto touch-scroll hide-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-white/40" size={32} />
                        </div>
                    ) : filtered.length === 0 ? (
                        <EmptyState
                            title="No recipes found"
                            description="Try a broader search or sync more recipes from Paprika."
                        />
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                            {filtered.map((recipe) => (
                                <button
                                    key={recipe.id}
                                    onClick={() => onSelect(recipe)}
                                    className="module-list-item flex items-center gap-3 text-left"
                                >
                                    {recipe.photoUrl ? (
                                        <img
                                            src={recipe.photoUrl}
                                            alt=""
                                            className="h-16 w-16 rounded-2xl object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-purple-500/30 text-3xl">
                                            {recipe.emoji || '🍽️'}
                                        </div>
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold">{recipe.title}</p>
                                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/45">
                                            {recipe.paprikaSource && (
                                                <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-2.5 py-1 text-orange-300">
                                                    Paprika
                                                </span>
                                            )}
                                            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                                                Tap to add
                                            </span>
                                        </div>
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
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="module-modal flex max-h-[82vh] max-w-3xl flex-col animate-scale-in"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="module-kicker">Generated from meals</p>
                        <h2 className="text-2xl font-semibold">Shopping list</h2>
                        <p className="mt-1 text-sm text-white/55">
                            {shoppingList.uncheckedCount} unchecked of {shoppingList.items.length} total items.
                        </p>
                    </div>
                    <button onClick={onClose} className="module-icon-button">
                        <X size={20} />
                    </button>
                </div>

                <div className="mt-5 flex gap-2">
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
                        className="module-input flex-1"
                    />
                    <button onClick={handleAddItem} className="module-action module-action-primary">
                        <Plus size={18} />
                        Add
                    </button>
                </div>

                <div className="mt-5 flex-1 overflow-y-auto space-y-2 touch-scroll hide-scrollbar">
                    {shoppingList.items.length === 0 ? (
                        <EmptyState
                            icon={ShoppingCart}
                            title="No items yet"
                            description="Generate a list from the current meal plan or add a few staples manually."
                        />
                    ) : (
                        shoppingList.items.map((item) => (
                            <div
                                key={item.id}
                                className={cn('module-list-item flex items-start gap-3', item.checked && 'opacity-55')}
                            >
                                <button
                                    onClick={() => handleToggleItem(item)}
                                    className={cn(
                                        'mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border transition-all',
                                        item.checked
                                            ? 'border-success bg-success text-white'
                                            : 'border-white/15 bg-white/5 text-white/60 hover:border-success hover:text-success'
                                    )}
                                >
                                    <Check size={16} />
                                </button>

                                <div className="min-w-0 flex-1">
                                    <p className={cn('font-semibold', item.checked && 'line-through text-white/45')}>
                                        {item.label}
                                    </p>
                                    <p className="mt-1 text-sm text-white/45">
                                        {item.category || 'General'}
                                        {item.mealDates?.length > 0 ? ` • ${item.mealDates.length} planned day(s)` : ''}
                                    </p>
                                </div>

                                <button
                                    onClick={() => dispatch(deleteShoppingListItem(item.id))}
                                    className="module-icon-button h-10 w-10 text-white/45 hover:text-danger"
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
    const { meals, loading, shoppingList, weekStart: reduxWeekStart } = useSelector((state) => state.meals);
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
    };

    const handleRemoveMeal = (date, mealType) => {
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
    const possibleMeals = 7 * MEAL_TYPES.length;
    const coverage = Math.round((totalMeals / possibleMeals) * 100);

    const mealCountsByType = useMemo(() => (
        MEAL_TYPES.map((mealType) => ({
            ...mealType,
            count: Object.values(meals).reduce((count, dayMeals) => (
                dayMeals[mealType.key] ? count + 1 : count
            ), 0),
        }))
    ), [meals]);

    const plannedTimeline = useMemo(() => (
        weekDays.flatMap((day) => {
            const dateStr = formatDate(day);
            const dayMeals = meals[dateStr] || {};

            return MEAL_TYPES.map((mealType) => {
                const meal = dayMeals[mealType.key];
                if (!meal) return null;

                return {
                    id: `${dateStr}-${mealType.key}`,
                    dateStr,
                    dateLabel: day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                    mealType,
                    meal,
                };
            }).filter(Boolean);
        })
    ), [meals, weekDays]);

    const busiestDay = useMemo(() => (
        weekDays
            .map((day) => {
                const dateStr = formatDate(day);
                const plannedCount = Object.keys(meals[dateStr] || {}).length;
                return {
                    label: day.toLocaleDateString('en-US', { weekday: 'long' }),
                    plannedCount,
                };
            })
            .sort((a, b) => b.plannedCount - a.plannedCount)[0]
    ), [meals, weekDays]);

    if (loading && Object.keys(meals).length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="animate-spin text-white/40" size={48} />
            </div>
        );
    }

    return (
        <PageShell className="animate-fade-in lg:h-full">
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

            <PageHeader
                icon={UtensilsCrossed}
                eyebrow="Weekly menu board"
                title="Meal Planning"
                description="Plan the week like the dashboard plans the day: quick signals, strong hierarchy, and the shopping context close to the board."
                tone="amber"
                stats={[
                    { label: 'Planned', value: totalMeals, meta: `${possibleMeals} available slots` },
                    { label: 'Coverage', value: `${coverage}%`, meta: 'week completion' },
                    { label: 'Shopping', value: shoppingList.items.length, meta: 'generated items' },
                    { label: 'Unchecked', value: shoppingList.uncheckedCount, meta: 'still to buy' },
                ]}
                actions={(
                    <>
                        <div className="module-toolbar">
                            <button onClick={prevWeek} className="module-icon-button">
                                <ChevronLeft size={18} />
                            </button>
                            <span className="module-inline-chip min-w-[150px] justify-center">
                                <CalendarDays size={14} />
                                {weekRange}
                            </span>
                            <button onClick={nextWeek} className="module-icon-button">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                        {!isCurrentWeek && (
                            <button onClick={goToToday} className="module-action">
                                This Week
                            </button>
                        )}
                        <button
                            onClick={handleGenerateShoppingList}
                            className="module-action module-action-success"
                        >
                            <ShoppingCart size={18} />
                            {shoppingList.loading ? 'Refreshing...' : 'Shopping List'}
                        </button>
                    </>
                )}
            />

            <div className="grid flex-1 min-h-0 gap-4 xl:grid-cols-[1.24fr_0.76fr]">
                <SurfacePanel className="flex min-h-0 flex-col">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="module-kicker">Week board</p>
                            <h2 className="text-2xl font-semibold">Plan by day</h2>
                            <p className="mt-1 text-sm text-white/55">
                                Tap any slot to swap in a recipe. Filled slots stay editable without leaving the board.
                            </p>
                        </div>
                        <div className="module-inline-chip">
                            <Sparkles size={14} className="text-primary" />
                            {isCurrentWeek ? 'Current week' : 'Preview week'}
                        </div>
                    </div>

                    <div className="mt-5 flex-1 overflow-y-auto touch-scroll hide-scrollbar">
                        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-7">
                            {weekDays.map((day) => {
                                const dateStr = formatDate(day);
                                const dayMeals = meals[dateStr] || {};
                                const isToday = dateStr === today;
                                const plannedCount = Object.keys(dayMeals).length;

                                return (
                                    <div
                                        key={dateStr}
                                        className={cn(
                                            'relative overflow-hidden rounded-3xl border p-4 transition-all',
                                            isToday
                                                ? 'border-primary/30 bg-gradient-to-br from-primary/18 via-primary/8 to-white/[0.03] shadow-glow'
                                                : 'border-white/10 bg-white/[0.04]'
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                                                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                                </p>
                                                <p className="mt-1 text-2xl font-semibold">
                                                    {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </p>
                                                <p className={cn('mt-1 text-sm', isToday ? 'text-primary' : 'text-white/45')}>
                                                    {isToday ? 'Today' : `${plannedCount} planned`}
                                                </p>
                                            </div>
                                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-white/70">
                                                {plannedCount}/{MEAL_TYPES.length}
                                            </span>
                                        </div>

                                        <div className="mt-4 space-y-2">
                                            {MEAL_TYPES.map((mealType) => {
                                                const meal = dayMeals[mealType.key];

                                                return (
                                                    <div key={mealType.key} className="relative">
                                                        <button
                                                            onClick={() => setRecipePickerContext({ date: dateStr, mealType: mealType.key })}
                                                            className={cn(
                                                                'w-full rounded-2xl border p-3 text-left transition-all',
                                                                meal
                                                                    ? `${mealType.border} ${mealType.badge}`
                                                                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                                                            )}
                                                        >
                                                            <div className="flex items-start gap-3 pr-8">
                                                                <div className={cn(
                                                                    'flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl',
                                                                    meal ? 'bg-white/10 text-white' : mealType.badge
                                                                )}>
                                                                    {meal?.recipePhoto ? (
                                                                        <img
                                                                            src={meal.recipePhoto}
                                                                            alt=""
                                                                            className="h-full w-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <span className="text-2xl">{meal?.recipeEmoji || mealType.emoji}</span>
                                                                    )}
                                                                </div>

                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/55">
                                                                        {mealType.label}
                                                                    </p>
                                                                    <p className="mt-1 truncate font-semibold text-white">
                                                                        {meal?.recipeTitle || 'Add meal'}
                                                                    </p>
                                                                    <p className="mt-1 text-xs text-white/50">
                                                                        {meal ? 'Tap to replace this plan' : 'Pick a recipe for this slot'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </button>

                                                        {meal && (
                                                            <button
                                                                onClick={() => handleRemoveMeal(dateStr, mealType.key)}
                                                                className="module-icon-button absolute right-2 top-2 h-9 w-9 text-white/55 hover:text-danger"
                                                            >
                                                                <X size={14} />
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
                </SurfacePanel>

                <div className="grid min-h-0 gap-4 xl:grid-rows-[auto_auto_minmax(0,1fr)]">
                    <SurfacePanel>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="module-kicker">Coverage by meal</p>
                                <h2 className="text-2xl font-semibold">Planning focus</h2>
                                <p className="mt-1 text-sm text-white/55">
                                    Spot the weak parts of the week before they become last-minute decisions.
                                </p>
                            </div>
                            <span className="module-badge">{possibleMeals - totalMeals} open slots</span>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            {mealCountsByType.map((mealType) => (
                                <div key={mealType.key} className="module-metric">
                                    <div className="flex items-center gap-3">
                                        <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl text-xl', mealType.badge)}>
                                            {mealType.emoji}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{mealType.label}</p>
                                            <p className="text-sm text-white/45">{mealType.count} planned</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="module-note mt-4">
                            {busiestDay?.plannedCount > 0
                                ? `${busiestDay.label} currently has the most planned meals at ${busiestDay.plannedCount}.`
                                : 'Nothing is planned yet this week. Start with dinner anchors and fill breakfast or lunch around them.'}
                        </div>
                    </SurfacePanel>

                    <SurfacePanel>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="module-kicker">Shopping pulse</p>
                                <h2 className="text-2xl font-semibold">List preview</h2>
                                <p className="mt-1 text-sm text-white/55">
                                    Meal-generated items stay persistent and editable until they are checked off.
                                </p>
                            </div>
                            <button onClick={() => setShowShoppingList(true)} className="module-action">
                                Open
                            </button>
                        </div>

                        <div className="mt-5 space-y-2">
                            {shoppingList.items.length === 0 ? (
                                <EmptyState
                                    icon={ShoppingCart}
                                    title="Shopping list is empty"
                                    description="Generate a list from this week’s meals when you are ready to shop."
                                />
                            ) : (
                                shoppingList.items.slice(0, 5).map((item) => (
                                    <div
                                        key={item.id}
                                        className={cn('module-list-item flex items-center gap-3', item.checked && 'opacity-55')}
                                    >
                                        <div className={cn(
                                            'flex h-9 w-9 items-center justify-center rounded-2xl border',
                                            item.checked
                                                ? 'border-success bg-success text-white'
                                                : 'border-white/10 bg-white/5 text-white/45'
                                        )}>
                                            <Check size={14} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={cn('truncate font-medium', item.checked && 'line-through text-white/45')}>
                                                {item.label}
                                            </p>
                                            <p className="text-sm text-white/45">{item.category || 'General'}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </SurfacePanel>

                    <SurfacePanel className="flex min-h-0 flex-col">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="module-kicker">Planned meals</p>
                                <h2 className="text-2xl font-semibold">Upcoming lineup</h2>
                                <p className="mt-1 text-sm text-white/55">
                                    A quick scroll through everything already on the calendar for this week.
                                </p>
                            </div>
                            <span className="module-badge">{plannedTimeline.length} meals</span>
                        </div>

                        <div className="mt-5 flex-1 space-y-3 overflow-y-auto touch-scroll hide-scrollbar">
                            {plannedTimeline.length === 0 ? (
                                <EmptyState
                                    icon={UtensilsCrossed}
                                    title="No meals planned yet"
                                    description="Start with the highest-friction days first, then build the rest of the week around them."
                                />
                            ) : (
                                plannedTimeline.map((entry) => (
                                    <div key={entry.id} className="module-list-item">
                                        <div className="flex items-start gap-3">
                                            <div className={cn(
                                                'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-xl',
                                                entry.mealType.badge
                                            )}>
                                                {entry.meal.recipePhoto ? (
                                                    <img
                                                        src={entry.meal.recipePhoto}
                                                        alt=""
                                                        className="h-full w-full rounded-2xl object-cover"
                                                    />
                                                ) : (
                                                    entry.meal.recipeEmoji || entry.mealType.emoji
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-semibold">{entry.meal.recipeTitle}</p>
                                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/45">
                                                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                                                        {entry.mealType.label}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                                                        <Clock3 size={12} />
                                                        {entry.dateLabel}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </SurfacePanel>
                </div>
            </div>

            {loading && Object.keys(meals).length > 0 && (
                <div className="pointer-events-none fixed inset-x-0 top-6 z-40 flex justify-center">
                    <div className="module-inline-chip bg-black/30">
                        <Loader2 size={14} className="animate-spin" />
                        Refreshing meal plan
                    </div>
                </div>
            )}
        </PageShell>
    );
};

export default MealPlanning;
