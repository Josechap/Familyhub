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
        <div className="fixed inset-0 bg-editorial-bg z-50 flex flex-col p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={onExit}
                    className="flex items-center gap-2 text-gray-500 hover:text-editorial-text transition-colors"
                >
                    <X size={24} />
                    <span className="font-medium">Exit Cooking Mode</span>
                </button>
                <div className="text-center">
                    <div className="text-2xl font-serif">{recipe.emoji} {recipe.title}</div>
                    <div className="text-sm text-gray-500">Step {currentStep + 1} of {recipe.steps.length}</div>
                </div>
                <div className="w-32" /> {/* Spacer for centering */}
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-200 rounded-full mb-8 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-pastel-green to-pastel-blue transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Main content */}
            <div className="flex-1 flex items-center justify-center">
                <div className="max-w-4xl text-center">
                    <div className="text-6xl font-serif leading-tight text-editorial-text mb-8">
                        {step}
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onPrev}
                    disabled={currentStep === 0}
                    className={cn(
                        "flex items-center gap-2 px-6 py-4 rounded-2xl text-lg font-medium transition-all",
                        currentStep === 0
                            ? "text-gray-300 cursor-not-allowed"
                            : "bg-white shadow-sm hover:shadow-md text-editorial-text"
                    )}
                >
                    <ChevronLeft size={24} />
                    Previous
                </button>

                {/* Step indicators */}
                <div className="flex gap-2">
                    {recipe.steps.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => onGoTo(idx)}
                            className={cn(
                                "w-3 h-3 rounded-full transition-all",
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
                    className="flex items-center gap-2 px-6 py-4 rounded-2xl text-lg font-medium bg-editorial-text text-white hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
                >
                    {currentStep === recipe.steps.length - 1 ? 'Finish' : 'Next'}
                    <ChevronRight size={24} />
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

    // Get unique categories
    const categories = ['all', ...new Set(recipes.map(r => r.category))];

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
                            className="bg-white rounded-3xl p-6 shadow-sm cursor-pointer hover:shadow-md transition-all group"
                        >
                            {/* Emoji */}
                            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                                {recipe.emoji}
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-serif mb-2">{recipe.title}</h3>

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
                                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                    {recipe.category}
                                </span>
                                {recipe.isFavorite && (
                                    <Heart size={16} className="text-red-500 fill-current" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Recipes;
