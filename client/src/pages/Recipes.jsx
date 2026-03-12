import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Calendar,
    ChefHat,
    ChevronLeft,
    ChevronRight,
    Clock,
    Flame,
    Heart,
    Loader2,
    Play,
    Search,
    Sparkles,
    Users,
    X,
} from 'lucide-react';
import {
    exitCookingMode,
    fetchRecipes,
    goToStep,
    nextStep,
    prevStep,
    selectRecipe,
    setFilterCategory,
    setSearchQuery,
    startCookingMode,
    toggleFavoriteAsync,
} from '../features/recipesSlice';
import { setMealAsync } from '../features/mealsSlice';
import { cn } from '../lib/utils';
import { EmptyState, PageHeader, PageShell, SurfacePanel } from '../components/ui/ModuleShell';

const CookingMode = ({ recipe, currentStep, onNext, onPrev, onGoTo, onExit }) => {
    const step = recipe.steps[currentStep];
    const progress = ((currentStep + 1) / recipe.steps.length) * 100;

    return (
        <div className="fixed inset-0 z-50 flex max-h-screen flex-col bg-dark-bg p-3 sm:p-4 md:p-6">
            <div className="mb-3 flex flex-shrink-0 items-center justify-between">
                <button
                    onClick={onExit}
                    className="touch-target rounded-xl p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                >
                    <div className="flex items-center gap-1">
                        <X size={20} />
                        <span className="hidden text-sm font-medium sm:inline">Exit</span>
                    </div>
                </button>
                <div className="mx-2 flex-1 text-center">
                    <div className="truncate text-sm font-semibold sm:text-base md:text-lg">{recipe.title}</div>
                    <div className="text-xs text-white/50">Step {currentStep + 1} of {recipe.steps.length}</div>
                </div>
                <div className="w-10 sm:w-16" />
            </div>

            <div className="progress-bar mb-3 flex-shrink-0 sm:mb-4">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 sm:px-4 md:px-8">
                <div className="mx-auto flex h-full max-w-4xl items-center justify-center py-4 text-center">
                    <p className="break-words text-lg font-semibold leading-relaxed text-white sm:text-2xl md:text-3xl lg:text-4xl">
                        {step}
                    </p>
                </div>
            </div>

            <div className="mt-3 flex flex-shrink-0 items-center justify-between gap-2 sm:gap-4">
                <button
                    onClick={onPrev}
                    disabled={currentStep === 0}
                    className={cn(
                        'touch-target rounded-xl px-3 py-3 text-sm font-medium transition-all sm:px-4 md:px-6 sm:text-base',
                        currentStep === 0
                            ? 'cursor-not-allowed text-white/20'
                            : 'bg-white/10 text-white hover:bg-white/20'
                    )}
                >
                    <div className="flex items-center gap-1">
                        <ChevronLeft size={20} />
                        <span className="hidden sm:inline">Prev</span>
                    </div>
                </button>

                <div className="hide-scrollbar flex max-w-[200px] gap-1.5 overflow-x-auto px-2 sm:max-w-none">
                    {recipe.steps.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => onGoTo(idx)}
                            className={cn(
                                'touch-target h-2.5 w-2.5 flex-shrink-0 rounded-full transition-all sm:h-3 sm:w-3',
                                idx === currentStep
                                    ? 'scale-125 bg-primary'
                                    : idx < currentStep
                                        ? 'bg-success'
                                        : 'bg-white/20 hover:bg-white/40'
                            )}
                        />
                    ))}
                </div>

                <button
                    onClick={currentStep === recipe.steps.length - 1 ? onExit : onNext}
                    className="touch-target rounded-xl bg-primary px-3 py-3 text-sm font-medium text-white transition-all hover:bg-primary/80 sm:px-4 md:px-6 sm:text-base"
                >
                    <div className="flex items-center gap-1">
                        <span>{currentStep === recipe.steps.length - 1 ? 'Done' : 'Next'}</span>
                        <ChevronRight size={20} />
                    </div>
                </button>
            </div>
        </div>
    );
};

const RecipeDetail = ({ recipe, onClose, onStartCooking, onToggleFavorite, onPlanMeal }) => {
    const [showMealPicker, setShowMealPicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMealType, setSelectedMealType] = useState('dinner');

    const mealTypes = [
        { key: 'breakfast', label: 'Breakfast', emoji: '🍳' },
        { key: 'lunch', label: 'Lunch', emoji: '🥗' },
        { key: 'dinner', label: 'Dinner', emoji: '🍽️' },
        { key: 'snack', label: 'Snack', emoji: '🍎' },
    ];

    const nextDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d.toISOString().split('T')[0];
    });

    const handlePlanMeal = () => {
        onPlanMeal(selectedDate, selectedMealType, recipe);
        setShowMealPicker(false);
        onClose();
    };

    const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
            <div
                className="module-modal flex max-h-[88vh] w-full max-w-5xl flex-col animate-scale-in lg:grid lg:grid-cols-[0.92fr_1.08fr] lg:gap-0 lg:p-0"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="relative overflow-hidden border-b border-white/10 p-5 lg:border-b-0 lg:border-r lg:p-6">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_34%)]" />
                    <div className="relative">
                        <div className="mb-5 flex items-start justify-between gap-3">
                            <div className="module-inline-chip">
                                <ChefHat size={14} className="text-warning" />
                                {recipe.paprikaSource ? 'Paprika sync' : 'Local recipe'}
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => onToggleFavorite(recipe.id)} className="module-icon-button">
                                    <Heart size={20} className={recipe.isFavorite ? 'fill-current text-red-500' : 'text-white/45'} />
                                </button>
                                <button onClick={onClose} className="module-icon-button">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-4xl border border-white/10 bg-white/5">
                            {recipe.photoUrl ? (
                                <img src={recipe.photoUrl} alt={recipe.title} className="h-56 w-full object-cover lg:h-72" />
                            ) : (
                                <div className="flex h-56 w-full items-center justify-center bg-gradient-to-br from-primary/25 via-family-purple/18 to-warning/14 text-7xl lg:h-72">
                                    {recipe.emoji || '🍽️'}
                                </div>
                            )}
                        </div>

                        <div className="mt-5">
                            <h2 className="text-3xl font-semibold tracking-tight">{recipe.title}</h2>
                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="module-metric">
                                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/35">Total time</p>
                                    <p className="mt-2 text-2xl font-semibold">{totalTime} min</p>
                                </div>
                                <div className="module-metric">
                                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/35">Servings</p>
                                    <p className="mt-2 text-2xl font-semibold">{recipe.servings || '-'}</p>
                                </div>
                                <div className="module-metric">
                                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/35">Category</p>
                                    <p className="mt-2 text-lg font-semibold">{recipe.category || 'General'}</p>
                                </div>
                            </div>

                            <div className="mt-5 flex gap-3">
                                <button
                                    onClick={() => setShowMealPicker(true)}
                                    className="module-action flex-1 text-violet-300"
                                >
                                    <Calendar size={18} />
                                    Plan Meal
                                </button>
                                <button
                                    onClick={onStartCooking}
                                    className="module-action module-action-primary flex-1"
                                >
                                    <Play size={18} />
                                    Start Cooking
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="min-h-0 p-5 lg:p-6">
                    {showMealPicker && (
                        <div className="module-note mb-5">
                            <h4 className="flex items-center gap-2 font-semibold text-violet-300">
                                <Calendar size={16} />
                                Plan this meal
                            </h4>
                            <div className="mt-4 grid grid-cols-7 gap-2">
                                {nextDays.map((dateStr) => {
                                    const d = new Date(`${dateStr}T12:00:00`);
                                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                                    return (
                                        <button
                                            key={dateStr}
                                            onClick={() => setSelectedDate(dateStr)}
                                            className={cn(
                                                'rounded-2xl border px-2 py-2 text-center transition-all',
                                                selectedDate === dateStr
                                                    ? 'border-primary/30 bg-primary/15 text-white'
                                                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                                            )}
                                        >
                                            <div className="text-xs text-white/55">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                            <div className="mt-1 font-semibold">{d.getDate()}</div>
                                            {isToday && <div className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-primary">Today</div>}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {mealTypes.map((type) => (
                                    <button
                                        key={type.key}
                                        onClick={() => setSelectedMealType(type.key)}
                                        className={cn(
                                            'module-pill',
                                            selectedMealType === type.key && 'module-pill-active'
                                        )}
                                    >
                                        {type.emoji} {type.label}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-4 flex gap-3">
                                <button onClick={() => setShowMealPicker(false)} className="module-action flex-1">
                                    Cancel
                                </button>
                                <button onClick={handlePlanMeal} className="module-action module-action-primary flex-1">
                                    Add to Meal Plan
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid min-h-0 gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="min-h-0">
                            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-success/20">
                                    <Flame size={16} className="text-success" />
                                </span>
                                Ingredients
                            </h3>
                            <div className="hide-scrollbar max-h-[45vh] space-y-2 overflow-y-auto">
                                {recipe.ingredients.map((ingredient, idx) => (
                                    <div key={idx} className="module-list-item px-3 py-3">
                                        <div className="flex items-start gap-3">
                                            <span className="mt-1 h-2 w-2 rounded-full bg-success" />
                                            <span className="text-sm text-white/82">{ingredient}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="min-h-0">
                            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20">
                                    <Play size={16} className="text-primary" />
                                </span>
                                Steps
                            </h3>
                            <div className="hide-scrollbar max-h-[45vh] space-y-2 overflow-y-auto">
                                {recipe.steps.map((step, idx) => (
                                    <div key={idx} className="module-list-item px-3 py-3">
                                        <div className="flex items-start gap-3">
                                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                                                {idx + 1}
                                            </span>
                                            <span className="text-sm leading-6 text-white/82">{step}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RecipeCard = ({ recipe, onOpen }) => {
    const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

    return (
        <button
            onClick={onOpen}
            className="group overflow-hidden rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.018)),rgba(10,14,22,0.82)] text-left transition-all hover:-translate-y-1 hover:shadow-[0_20px_38px_rgba(0,0,0,0.24)]"
        >
            <div className="relative h-44 overflow-hidden border-b border-white/10 bg-gradient-to-br from-primary/20 via-family-purple/16 to-warning/14">
                {recipe.photoUrl ? (
                    <img
                        src={recipe.photoUrl}
                        alt={recipe.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(event) => {
                            event.currentTarget.style.display = 'none';
                        }}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-6xl">
                        {recipe.emoji || '🍽️'}
                    </div>
                )}

                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    {recipe.paprikaSource && (
                        <span className="rounded-full border border-orange-400/20 bg-orange-500/80 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white">
                            Paprika
                        </span>
                    )}
                    {recipe.isFavorite && (
                        <span className="rounded-full border border-red-400/20 bg-black/35 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-red-300">
                            Favorite
                        </span>
                    )}
                </div>
            </div>

            <div className="p-4">
                <h3 className="line-clamp-2 text-lg font-semibold">{recipe.title}</h3>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/52">
                    <span className="inline-flex items-center gap-1">
                        <Clock size={14} />
                        {totalTime}m
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Users size={14} />
                        {recipe.servings || '-'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <ChefHat size={14} />
                        {recipe.steps?.length || 0} steps
                    </span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="truncate rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.16em] text-white/55">
                        {recipe.category || 'General'}
                    </span>
                    <span className="text-sm font-medium text-primary">Open</span>
                </div>
            </div>
        </button>
    );
};

const Recipes = () => {
    const dispatch = useDispatch();
    const {
        recipes,
        selectedRecipeId,
        cookingMode,
        currentStep,
        searchQuery,
        filterCategory,
        loading,
    } = useSelector((state) => state.recipes);

    useEffect(() => {
        dispatch(fetchRecipes());
    }, [dispatch]);

    const selectedRecipe = recipes.find((recipe) => recipe.id === selectedRecipeId);

    const isValidCategory = (cat) => {
        if (!cat || cat === 'Paprika') return false;
        if (/^[A-F0-9-]{8,}/i.test(cat)) return false;
        if (cat.length > 20) return false;
        return true;
    };

    const categories = ['all', ...new Set(recipes.map((recipe) => recipe.category).filter(isValidCategory))];

    const filteredRecipes = useMemo(() => recipes.filter((recipe) => {
        const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || recipe.category === filterCategory;
        return matchesSearch && matchesCategory;
    }), [recipes, searchQuery, filterCategory]);

    const favoriteCount = recipes.filter((recipe) => recipe.isFavorite).length;
    const paprikaCount = recipes.filter((recipe) => recipe.paprikaSource).length;
    const featuredRecipe = filteredRecipes.find((recipe) => recipe.isFavorite) || filteredRecipes[0] || null;
    const libraryRecipes = featuredRecipe
        ? filteredRecipes.filter((recipe) => recipe.id !== featuredRecipe.id)
        : filteredRecipes;
    const quickPicks = (filteredRecipes.filter((recipe) => recipe.isFavorite).length > 0
        ? filteredRecipes.filter((recipe) => recipe.isFavorite)
        : filteredRecipes
    ).slice(0, 4);

    if (loading && recipes.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="animate-spin text-white/40" size={48} />
            </div>
        );
    }

    return (
        <PageShell className="h-full animate-fade-in">
            {cookingMode && selectedRecipe && (
                <CookingMode
                    recipe={selectedRecipe}
                    currentStep={currentStep}
                    onNext={() => dispatch(nextStep())}
                    onPrev={() => dispatch(prevStep())}
                    onGoTo={(step) => dispatch(goToStep(step))}
                    onExit={() => dispatch(exitCookingMode())}
                />
            )}

            {selectedRecipeId && !cookingMode && selectedRecipe && (
                <RecipeDetail
                    recipe={selectedRecipe}
                    onClose={() => dispatch(selectRecipe(null))}
                    onStartCooking={() => dispatch(startCookingMode())}
                    onToggleFavorite={(id) => dispatch(toggleFavoriteAsync(id))}
                    onPlanMeal={(date, mealType, recipe) => {
                        dispatch(setMealAsync({
                            date,
                            mealType,
                            recipe: {
                                id: recipe.id,
                                title: recipe.title,
                                emoji: recipe.emoji,
                                photoUrl: recipe.photoUrl || null,
                            },
                        }));
                    }}
                />
            )}

            <PageHeader
                icon={ChefHat}
                eyebrow="Kitchen library"
                title="Recipes"
                description="Browse synced and local recipes, keep favorites close, and move from planning to cooking without the old visual clutter."
                tone="amber"
                stats={[
                    { label: 'Visible', value: filteredRecipes.length, meta: 'matching results' },
                    { label: 'Favorites', value: favoriteCount, meta: 'saved picks' },
                    { label: 'Synced', value: paprikaCount, meta: 'from Paprika' },
                ]}
                actions={(
                    <div className="module-inline-chip">
                        <Sparkles size={14} className="text-warning" />
                        {filterCategory === 'all' ? 'Browsing all categories' : `Filtered by ${filterCategory}`}
                    </div>
                )}
            />

            <div className="grid flex-1 min-h-0 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="grid gap-4 xl:grid-rows-[auto_auto_minmax(0,1fr)]">
                    <SurfacePanel className="space-y-4">
                        <div>
                            <p className="module-kicker">Browse controls</p>
                            <h2 className="text-2xl font-semibold">Search and filter</h2>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                            <input
                                type="text"
                                placeholder="Search recipes..."
                                value={searchQuery}
                                onChange={(event) => dispatch(setSearchQuery(event.target.value))}
                                className="module-input pl-12"
                            />
                        </div>

                        <div className="module-toolbar max-h-[240px] overflow-y-auto touch-scroll">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => dispatch(setFilterCategory(cat))}
                                    className={cn(
                                        'module-pill whitespace-nowrap capitalize',
                                        filterCategory === cat && 'module-pill-active'
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {(searchQuery || filterCategory !== 'all') && (
                            <button
                                onClick={() => {
                                    dispatch(setSearchQuery(''));
                                    dispatch(setFilterCategory('all'));
                                }}
                                className="module-action w-full"
                            >
                                Clear filters
                            </button>
                        )}
                    </SurfacePanel>

                    <SurfacePanel>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="module-kicker">Collections</p>
                                <h2 className="text-2xl font-semibold">Recipe mix</h2>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <div className="module-metric">
                                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/35">Favorites</p>
                                <p className="mt-2 text-3xl font-semibold">{favoriteCount}</p>
                                <p className="mt-1 text-sm text-white/48">Keep recurring go-to meals close.</p>
                            </div>
                            <div className="module-metric">
                                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/35">Paprika sync</p>
                                <p className="mt-2 text-3xl font-semibold">{paprikaCount}</p>
                                <p className="mt-1 text-sm text-white/48">Imported recipes available to plan.</p>
                            </div>
                        </div>

                        <div className="module-note mt-4">
                            Use this screen as a library first: search narrowly, star the recipes you repeat, then send them into the meal board only when they are actually needed.
                        </div>
                    </SurfacePanel>

                    <SurfacePanel className="flex min-h-0 flex-col">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="module-kicker">Quick picks</p>
                                <h2 className="text-2xl font-semibold">Start here</h2>
                            </div>
                            <span className="module-badge">{quickPicks.length}</span>
                        </div>

                        <div className="mt-5 flex-1 space-y-2 overflow-y-auto touch-scroll hide-scrollbar">
                            {quickPicks.length === 0 ? (
                                <EmptyState
                                    icon={ChefHat}
                                    title="No recipes available"
                                    description="Sync recipes from Paprika or add local recipes to start browsing."
                                />
                            ) : (
                                quickPicks.map((recipe) => (
                                    <button
                                        key={recipe.id}
                                        onClick={() => dispatch(selectRecipe(recipe.id))}
                                        className="module-list-item w-full text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-2xl">
                                                {recipe.photoUrl ? (
                                                    <img src={recipe.photoUrl} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    recipe.emoji || '🍽️'
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-semibold">{recipe.title}</p>
                                                <p className="mt-1 text-sm text-white/48">
                                                    {(recipe.prepTime || 0) + (recipe.cookTime || 0)} min
                                                    {' • '}
                                                    {recipe.servings || '-'} servings
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </SurfacePanel>
                </div>

                <div className="grid min-h-0 gap-4 xl:grid-rows-[auto_minmax(0,1fr)]">
                    {featuredRecipe && (
                        <button
                            onClick={() => dispatch(selectRecipe(featuredRecipe.id))}
                            className="group relative overflow-hidden rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.018)),rgba(10,14,22,0.82)] text-left"
                        >
                            <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                                <div className="relative min-h-[260px] overflow-hidden border-b border-white/10 lg:border-b-0 lg:border-r">
                                    {featuredRecipe.photoUrl ? (
                                        <img
                                            src={featuredRecipe.photoUrl}
                                            alt={featuredRecipe.title}
                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex h-full min-h-[260px] w-full items-center justify-center bg-gradient-to-br from-primary/24 via-family-purple/18 to-warning/14 text-8xl">
                                            {featuredRecipe.emoji || '🍽️'}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />
                                </div>

                                <div className="p-5 sm:p-6">
                                    <div className="module-inline-chip">
                                        <Sparkles size={14} className="text-warning" />
                                        Featured recipe
                                    </div>

                                    <h2 className="mt-4 text-3xl font-semibold tracking-tight">{featuredRecipe.title}</h2>
                                    <p className="mt-3 max-w-xl text-sm leading-7 text-white/56">
                                        {featuredRecipe.isFavorite
                                            ? 'A repeat favorite that is already proven in your rotation.'
                                            : 'A strong current pick based on your active filters and available library.'}
                                    </p>

                                    <div className="mt-5 flex flex-wrap gap-2">
                                        <span className="module-pill">{(featuredRecipe.prepTime || 0) + (featuredRecipe.cookTime || 0)} min</span>
                                        <span className="module-pill">{featuredRecipe.servings || '-'} servings</span>
                                        <span className="module-pill">{featuredRecipe.category || 'General'}</span>
                                        {featuredRecipe.paprikaSource && <span className="module-pill">Paprika</span>}
                                    </div>

                                    <div className="mt-6 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 text-sm text-white/52">
                                            <Heart size={14} className={featuredRecipe.isFavorite ? 'fill-current text-red-400' : 'text-white/45'} />
                                            {featuredRecipe.isFavorite ? 'Saved favorite' : 'Tap to inspect details'}
                                        </div>
                                        <span className="text-sm font-medium text-primary">Open recipe</span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    )}

                    <SurfacePanel className="flex min-h-0 flex-col">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="module-kicker">Library</p>
                                <h2 className="text-2xl font-semibold">All visible recipes</h2>
                                <p className="mt-1 text-sm text-white/55">
                                    Cleaner cards, fewer competing accents, and enough metadata to scan fast.
                                </p>
                            </div>
                            <span className="module-badge">{filteredRecipes.length}</span>
                        </div>

                        <div className="mt-5 flex-1 overflow-y-auto touch-scroll hide-scrollbar">
                            {filteredRecipes.length === 0 ? (
                                <EmptyState
                                    title="No recipes found"
                                    description="Try a broader search, remove a category filter, or sync more recipes from Paprika."
                                />
                            ) : libraryRecipes.length === 0 && featuredRecipe ? (
                                <div className="module-note">
                                    The featured recipe is the only match right now. Open it above for details or clear filters to explore more.
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                                    {libraryRecipes.map((recipe) => (
                                        <RecipeCard
                                            key={recipe.id}
                                            recipe={recipe}
                                            onOpen={() => dispatch(selectRecipe(recipe.id))}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </SurfacePanel>
                </div>
            </div>
        </PageShell>
    );
};

export default Recipes;
