import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Heart, Clock, Users, ChevronLeft, ChevronRight, Play, X, Search, Loader2, Flame, Calendar, Plus } from 'lucide-react';
import {
    fetchRecipes,
    selectRecipe,
    startCookingMode,
    exitCookingMode,
    nextStep,
    prevStep,
    goToStep,
    toggleFavoriteAsync,
    setSearchQuery,
    setFilterCategory,
} from '../features/recipesSlice';
import { setMealAsync } from '../features/mealsSlice';
import { cn } from '../lib/utils';

// Cooking Mode Component - Fully responsive immersive experience
const CookingMode = ({ recipe, currentStep, onNext, onPrev, onGoTo, onExit }) => {
    const step = recipe.steps[currentStep];
    const progress = ((currentStep + 1) / recipe.steps.length) * 100;

    return (
        <div className="fixed inset-0 bg-dark-bg z-50 flex flex-col p-3 sm:p-4 md:p-6 max-h-screen">
            {/* Header - Compact */}
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <button
                    onClick={onExit}
                    className="flex items-center gap-1 text-white/50 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10 touch-target"
                >
                    <X size={20} />
                    <span className="font-medium text-sm hidden sm:inline">Exit</span>
                </button>
                <div className="text-center flex-1 mx-2">
                    <div className="text-sm sm:text-base md:text-lg font-semibold truncate">{recipe.title}</div>
                    <div className="text-xs text-white/50">Step {currentStep + 1} of {recipe.steps.length}</div>
                </div>
                <div className="w-10 sm:w-16" />
            </div>

            {/* Progress bar - Compact */}
            <div className="progress-bar mb-3 sm:mb-4 flex-shrink-0">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Main content - Responsive text with scroll */}
            <div className="flex-1 flex items-center justify-center overflow-y-auto px-2 sm:px-4 md:px-8 min-h-0">
                <div className="w-full max-w-4xl text-center py-4">
                    <p className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-semibold leading-relaxed text-white break-words">
                        {step}
                    </p>
                </div>
            </div>

            {/* Navigation - Compact and responsive */}
            <div className="flex items-center justify-between gap-2 sm:gap-4 mt-3 flex-shrink-0">
                <button
                    onClick={onPrev}
                    disabled={currentStep === 0}
                    className={cn(
                        "flex items-center gap-1 px-3 sm:px-4 md:px-6 py-3 rounded-xl font-medium transition-all touch-target text-sm sm:text-base",
                        currentStep === 0
                            ? "text-white/20 cursor-not-allowed"
                            : "bg-white/10 hover:bg-white/20 text-white"
                    )}
                >
                    <ChevronLeft size={20} />
                    <span className="hidden sm:inline">Prev</span>
                </button>

                {/* Step indicators - Scrollable */}
                <div className="flex gap-1.5 overflow-x-auto hide-scrollbar px-2 max-w-[200px] sm:max-w-none">
                    {recipe.steps.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => onGoTo(idx)}
                            className={cn(
                                "w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all flex-shrink-0 touch-target",
                                idx === currentStep
                                    ? "bg-primary scale-125"
                                    : idx < currentStep
                                        ? "bg-success"
                                        : "bg-white/20 hover:bg-white/40"
                            )}
                        />
                    ))}
                </div>

                <button
                    onClick={currentStep === recipe.steps.length - 1 ? onExit : onNext}
                    className="flex items-center gap-1 px-3 sm:px-4 md:px-6 py-3 rounded-xl font-medium bg-primary text-white hover:bg-primary/80 transition-all touch-target text-sm sm:text-base"
                >
                    <span>{currentStep === recipe.steps.length - 1 ? 'Done' : 'Next'}</span>
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
};

// Recipe Detail Modal
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

    // Generate next 7 days
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

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <div className="card max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-scale-in">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <span className="text-5xl">{recipe.emoji || '🍽️'}</span>
                        <div>
                            <h2 className="text-xl font-semibold">{recipe.title}</h2>
                            <div className="flex items-center gap-4 text-sm text-white/50 mt-1">
                                <span className="flex items-center gap-1">
                                    <Clock size={14} />
                                    {recipe.prepTime + recipe.cookTime} min
                                </span>
                                <span className="flex items-center gap-1">
                                    <Users size={14} />
                                    {recipe.servings} servings
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onToggleFavorite(recipe.id)}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors touch-target"
                        >
                            <Heart
                                size={24}
                                className={recipe.isFavorite ? "text-red-500 fill-current" : "text-white/40"}
                            />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors touch-target"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Meal Planning Quick Picker */}
                {showMealPicker && (
                    <div className="mb-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                        <h4 className="font-medium text-purple-300 mb-3 flex items-center gap-2">
                            <Calendar size={16} />
                            Plan this meal
                        </h4>
                        <div className="grid grid-cols-7 gap-1 mb-3">
                            {nextDays.map(dateStr => {
                                const d = new Date(dateStr + 'T12:00:00');
                                const isToday = dateStr === new Date().toISOString().split('T')[0];
                                return (
                                    <button
                                        key={dateStr}
                                        onClick={() => setSelectedDate(dateStr)}
                                        className={cn(
                                            "p-2 rounded-lg text-center transition-all",
                                            selectedDate === dateStr
                                                ? "bg-purple-500 text-white"
                                                : "bg-white/5 hover:bg-white/10"
                                        )}
                                    >
                                        <div className="text-xs text-white/60">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                        <div className="font-medium">{d.getDate()}</div>
                                        {isToday && <div className="text-xs text-purple-300">Today</div>}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex gap-2 mb-3">
                            {mealTypes.map(type => (
                                <button
                                    key={type.key}
                                    onClick={() => setSelectedMealType(type.key)}
                                    className={cn(
                                        "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                                        selectedMealType === type.key
                                            ? "bg-purple-500 text-white"
                                            : "bg-white/5 hover:bg-white/10"
                                    )}
                                >
                                    {type.emoji} {type.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowMealPicker(false)}
                                className="flex-1 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePlanMeal}
                                className="flex-1 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600"
                            >
                                Add to Meal Plan
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto space-y-6 touch-scroll">
                    {/* Ingredients */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                                <Flame size={16} className="text-success" />
                            </span>
                            Ingredients
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {recipe.ingredients.map((ingredient, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                                    <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                                    <span className="text-white/80">{ingredient}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Steps */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                <Play size={16} className="text-primary" />
                            </span>
                            Steps
                        </h3>
                        <div className="space-y-3">
                            {recipe.steps.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                                        {idx + 1}
                                    </span>
                                    <span className="text-white/80 text-sm">{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-4 mt-4 border-t border-white/10">
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowMealPicker(true)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-500/20 text-purple-300 rounded-xl font-medium hover:bg-purple-500/30 transition-colors touch-target"
                        >
                            <Calendar size={20} />
                            Plan Meal
                        </button>
                        <button
                            onClick={onStartCooking}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/80 transition-colors touch-target"
                        >
                            <Play size={20} />
                            Start Cooking
                        </button>
                    </div>
                </div>
            </div>
        </div>
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

    const selectedRecipe = recipes.find(r => r.id === selectedRecipeId);

    // Get unique categories
    const isValidCategory = (cat) => {
        if (!cat || cat === 'Paprika') return false;
        if (/^[A-F0-9-]{8,}/i.test(cat)) return false;
        if (cat.length > 20) return false;
        return true;
    };
    const categories = ['all', ...new Set(recipes.map(r => r.category).filter(isValidCategory))];

    // Filter recipes
    const filteredRecipes = recipes.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || r.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // Loading state
    if (loading && recipes.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="animate-spin text-white/40" size={48} />
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col gap-4 animate-fade-in">
            {/* Cooking Mode Overlay */}
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

            {/* Recipe Detail Modal */}
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
                            }
                        }));
                    }}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Recipes</h1>
                <span className="text-white/50 text-sm">{filteredRecipes.length} recipes</span>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                <input
                    type="text"
                    placeholder="Search recipes..."
                    value={searchQuery}
                    onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-white/40"
                />
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => dispatch(setFilterCategory(cat))}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap touch-target capitalize",
                            filterCategory === cat
                                ? "bg-primary text-white"
                                : "bg-white/5 text-white/60 hover:bg-white/10"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Recipe Grid */}
            <div className="flex-1 overflow-y-auto touch-scroll hide-scrollbar">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredRecipes.map((recipe, idx) => (
                        <div
                            key={recipe.id}
                            onClick={() => dispatch(selectRecipe(recipe.id))}
                            className="card cursor-pointer hover:bg-white/10 transition-all group animate-slide-up overflow-hidden p-0"
                            style={{ animationDelay: `${idx * 30}ms` }}
                        >
                            {/* Photo or Placeholder */}
                            <div className="h-32 sm:h-40 relative overflow-hidden bg-gradient-to-br from-primary/30 to-purple-500/30">
                                {recipe.photoUrl ? (
                                    <img
                                        src={recipe.photoUrl}
                                        alt={recipe.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                ) : recipe.emoji ? (
                                    <div className="w-full h-full flex items-center justify-center text-5xl sm:text-6xl group-hover:scale-110 transition-transform">
                                        {recipe.emoji}
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="text-white/20 text-5xl">🍽️</div>
                                    </div>
                                )}

                                {/* Favorite heart */}
                                {recipe.isFavorite && (
                                    <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                                        <Heart size={16} className="text-red-500 fill-current" />
                                    </div>
                                )}

                                {/* Paprika badge */}
                                {recipe.paprikaSource && (
                                    <div className="absolute top-2 left-2 bg-orange-500/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                                        Paprika
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="font-semibold line-clamp-2 mb-2">{recipe.title}</h3>

                                {/* Meta */}
                                <div className="flex items-center gap-3 text-sm text-white/50">
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {recipe.prepTime + recipe.cookTime}m
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users size={14} />
                                        {recipe.servings}
                                    </span>
                                </div>

                                {/* Category badge */}
                                {isValidCategory(recipe.category) && (
                                    <div className="mt-3">
                                        <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/60">
                                            {recipe.category}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty state */}
                {filteredRecipes.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">🍳</div>
                        <p className="text-white/40 text-lg">No recipes found</p>
                        <p className="text-white/30 text-sm mt-1">Try a different search or category</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Recipes;
