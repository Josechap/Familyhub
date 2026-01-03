import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Heart, Clock, Users, ChevronLeft, ChevronRight, Play, X, Search, Loader2 } from 'lucide-react';
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
import { cn } from '../lib/utils';

// Cooking Mode Component
const CookingMode = ({ recipe, currentStep, onNext, onPrev, onGoTo, onExit }) => {
    const step = recipe.steps[currentStep];
    const progress = ((currentStep + 1) / recipe.steps.length) * 100;

    return (
        <div className="fixed inset-0 bg-editorial-bg z-50 flex flex-col p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
                <button
                    onClick={onExit}
                    className="flex items-center gap-1 sm:gap-2 text-gray-500 hover:text-editorial-text transition-colors"
                >
                    <X size={20} className="sm:w-6 sm:h-6" />
                    <span className="font-medium text-sm sm:text-base hidden sm:inline">Exit Cooking Mode</span>
                </button>
                <div className="text-center flex-1 mx-2">
                    <div className="text-base sm:text-xl lg:text-2xl font-serif truncate">{recipe.title}</div>
                    <div className="text-xs sm:text-sm text-gray-500">Step {currentStep + 1} of {recipe.steps.length}</div>
                </div>
                <div className="w-8 sm:w-20 lg:w-32" /> {/* Spacer for centering */}
            </div>

            {/* Progress bar */}
            <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full mb-4 sm:mb-6 lg:mb-8 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-pastel-green to-pastel-blue transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Main content - Responsive text sizing */}
            <div className="flex-1 flex items-center justify-center overflow-y-auto px-2 sm:px-4">
                <div className="max-w-4xl text-center">
                    <div className="text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-serif leading-snug sm:leading-tight text-editorial-text">
                        {step}
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4 sm:mt-6 lg:mt-8 gap-2 sm:gap-4">
                <button
                    onClick={onPrev}
                    disabled={currentStep === 0}
                    className={cn(
                        "flex items-center gap-1 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base lg:text-lg font-medium transition-all",
                        currentStep === 0
                            ? "text-gray-300 cursor-not-allowed"
                            : "bg-white shadow-sm hover:shadow-md text-editorial-text"
                    )}
                >
                    <ChevronLeft size={18} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    <span className="hidden sm:inline">Previous</span>
                </button>

                {/* Step indicators - Hide on very small screens, show limited on mobile */}
                <div className="flex gap-1.5 sm:gap-2 overflow-x-auto max-w-[40%] sm:max-w-none">
                    {recipe.steps.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => onGoTo(idx)}
                            className={cn(
                                "w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 rounded-full transition-all flex-shrink-0",
                                idx === currentStep
                                    ? "bg-editorial-text scale-125"
                                    : idx < currentStep
                                        ? "bg-pastel-green"
                                        : "bg-gray-300 hover:bg-gray-400"
                            )}
                        />
                    ))}
                </div>

                <button
                    onClick={currentStep === recipe.steps.length - 1 ? onExit : onNext}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base lg:text-lg font-medium bg-editorial-text text-white hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
                >
                    <span>{currentStep === recipe.steps.length - 1 ? 'Finish' : 'Next'}</span>
                    <ChevronRight size={18} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </button>
            </div>
        </div>
    );
};

// Recipe Detail Modal
const RecipeDetail = ({ recipe, onClose, onStartCooking, onToggleFavorite }) => {
    return (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-8">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-5xl">{recipe.emoji}</span>
                        <div>
                            <h2 className="text-2xl font-serif">{recipe.title}</h2>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1">
                                    <Clock size={14} />
                                    {recipe.prepTime + recipe.cookTime} min
                                </span>
                                <span className="flex items-center gap-1">
                                    <Users size={14} />
                                    {recipe.servings} servings
                                </span>
                                <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                                    {recipe.category}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onToggleFavorite(recipe.id)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <Heart
                                size={24}
                                className={recipe.isFavorite ? "text-red-500 fill-current" : "text-gray-400"}
                            />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-6">
                    {/* Ingredients */}
                    <div>
                        <h3 className="text-lg font-serif mb-4">Ingredients</h3>
                        <ul className="space-y-2">
                            {recipe.ingredients.map((ingredient, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="w-2 h-2 rounded-full bg-pastel-green mt-2 shrink-0" />
                                    <span>{ingredient}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Steps */}
                    <div>
                        <h3 className="text-lg font-serif mb-4">Steps</h3>
                        <ol className="space-y-3">
                            {recipe.steps.map((step, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold shrink-0">
                                        {idx + 1}
                                    </span>
                                    <span className="text-sm">{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100">
                    <button
                        onClick={onStartCooking}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-editorial-text text-white rounded-2xl font-medium hover:bg-gray-800 transition-colors"
                    >
                        <Play size={20} />
                        Start Cooking Mode
                    </button>
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

    // Fetch data on mount
    useEffect(() => {
        dispatch(fetchRecipes());
    }, [dispatch]);

    const selectedRecipe = recipes.find(r => r.id === selectedRecipeId);

    // Get unique categories (filter out UUID-like strings and empty values)
    const isValidCategory = (cat) => {
        if (!cat || cat === 'Paprika') return false;
        // Filter out UUID patterns (contains mostly hex characters and dashes)
        if (/^[A-F0-9-]{8,}/i.test(cat)) return false;
        // Filter out very long strings (likely UIDs)
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
                <Loader2 className="animate-spin text-gray-400" size={48} />
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col">
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
                />
            )}

            <h1 className="text-3xl mb-6 font-serif">Recipes</h1>

            {/* Search and Filter */}
            <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search recipes..."
                        value={searchQuery}
                        onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                        className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pastel-blue"
                    />
                </div>
                <div className="flex gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => dispatch(setFilterCategory(cat))}
                            className={cn(
                                "px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize",
                                filterCategory === cat
                                    ? "bg-editorial-text text-white"
                                    : "bg-white text-editorial-text hover:bg-gray-100"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Recipe Grid */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-4 gap-6">
                    {filteredRecipes.map((recipe) => (
                        <div
                            key={recipe.id}
                            onClick={() => dispatch(selectRecipe(recipe.id))}
                            className="bg-white rounded-3xl overflow-hidden shadow-sm cursor-pointer hover:shadow-lg transition-all group"
                        >
                            {/* Photo or Placeholder */}
                            <div className="h-40 relative overflow-hidden bg-gradient-to-br from-pastel-blue to-pastel-purple">
                                {recipe.photoUrl ? (
                                    <img
                                        src={recipe.photoUrl}
                                        alt={recipe.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                ) : recipe.emoji ? (
                                    <div className="w-full h-full flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">
                                        {recipe.emoji}
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="text-white/30 text-6xl">🍽️</div>
                                    </div>
                                )}
                                {recipe.paprikaSource && (
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-orange-600 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                        Paprika
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                {/* Title */}
                                <h3 className="text-lg font-serif mb-2 line-clamp-2">{recipe.title}</h3>

                                {/* Meta */}
                                <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
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
                                <div className="flex items-center justify-between">
                                    {isValidCategory(recipe.category) ? (
                                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                            {recipe.category}
                                        </span>
                                    ) : (
                                        <span></span>
                                    )}
                                    {recipe.isFavorite && (
                                        <Heart size={16} className="text-red-500 fill-current" />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Recipes;
