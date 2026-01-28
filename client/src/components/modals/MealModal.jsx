import React from 'react';
import { X, Clock, Users, ChefHat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MealModal = ({ meal, mealType, onClose }) => {
    const navigate = useNavigate();

    if (!meal) return null;

    const mealLabels = {
        breakfast: { label: 'Breakfast', emoji: '🍳', color: 'text-yellow-400' },
        lunch: { label: 'Lunch', emoji: '🥗', color: 'text-green-400' },
        dinner: { label: 'Dinner', emoji: '🍽️', color: 'text-blue-400' },
        snack: { label: 'Snack', emoji: '🍎', color: 'text-pink-400' },
    };

    const mealInfo = mealLabels[mealType] || mealLabels.dinner;

    const handleViewRecipe = () => {
        onClose();
        navigate('/recipes');
    };

    const handleChangeMeal = () => {
        onClose();
        navigate('/meals');
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="card w-full max-w-md animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">{meal.recipeEmoji || mealInfo.emoji}</span>
                        <div>
                            <p className={`text-sm font-medium ${mealInfo.color}`}>{mealInfo.label}</p>
                            <h2 className="text-xl font-semibold">{meal.recipeTitle}</h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors touch-target"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Recipe Photo */}
                {meal.recipePhoto && (
                    <div className="mb-4 rounded-xl overflow-hidden">
                        <img
                            src={meal.recipePhoto}
                            alt={meal.recipeTitle}
                            className="w-full h-48 object-cover"
                        />
                    </div>
                )}

                {/* Quick Info */}
                <div className="flex gap-4 mb-6 text-white/60">
                    {meal.prepTime && (
                        <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <span className="text-sm">{meal.prepTime} prep</span>
                        </div>
                    )}
                    {meal.servings && (
                        <div className="flex items-center gap-2">
                            <Users size={16} />
                            <span className="text-sm">{meal.servings} servings</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleChangeMeal}
                        className="flex-1 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors touch-target"
                    >
                        Change Meal
                    </button>
                    <button
                        onClick={handleViewRecipe}
                        className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/80 transition-colors touch-target flex items-center justify-center gap-2"
                    >
                        <ChefHat size={18} />
                        View Recipe
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MealModal;
