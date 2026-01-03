import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';

// Async thunks
export const fetchRecipes = createAsyncThunk('recipes/fetchRecipes', async () => {
    // Fetch local recipes
    const localRecipes = await api.getRecipes();

    // Fetch Paprika recipes
    let paprikaRecipes = [];
    try {
        const paprikaData = await api.getPaprikaRecipes();
        paprikaRecipes = (paprikaData.recipes || []).map(r => ({
            id: r.id,
            title: r.title,
            description: r.description,
            emoji: null, // No emoji for Paprika - use photo instead
            photoUrl: r.photoUrl || null,
            hasPhoto: r.hasPhoto || false,
            prepTime: r.prepTime ? parseInt(r.prepTime) || 0 : 0,
            cookTime: r.cookTime ? parseInt(r.cookTime) || 0 : 0,
            servings: r.servings ? parseInt(r.servings) || 4 : 4,
            category: r.categories?.[0] || 'Paprika',
            ingredients: r.ingredients ? r.ingredients.split('\n').filter(i => i.trim()) : [],
            steps: r.directions ? r.directions.split('\n').filter(s => s.trim()) : [],
            isFavorite: r.isFavorite || false,
            paprikaSource: true,
        }));
    } catch (error) {
        console.log('Paprika recipes not available');
    }

    return [...localRecipes, ...paprikaRecipes];
});

export const toggleFavoriteAsync = createAsyncThunk('recipes/toggleFavorite', async (recipeId) => {
    await api.toggleFavorite(recipeId);
    return recipeId;
});

const initialState = {
    recipes: [],
    selectedRecipeId: null,
    cookingMode: false,
    currentStep: 0,
    searchQuery: '',
    filterCategory: 'all',
    loading: false,
    error: null,
};

export const recipesSlice = createSlice({
    name: 'recipes',
    initialState,
    reducers: {
        selectRecipe: (state, action) => {
            state.selectedRecipeId = action.payload;
            state.cookingMode = false;
            state.currentStep = 0;
        },
        startCookingMode: (state) => {
            state.cookingMode = true;
            state.currentStep = 0;
        },
        exitCookingMode: (state) => {
            state.cookingMode = false;
            state.currentStep = 0;
        },
        nextStep: (state) => {
            const recipe = state.recipes.find(r => r.id === state.selectedRecipeId);
            if (recipe && state.currentStep < recipe.steps.length - 1) {
                state.currentStep += 1;
            }
        },
        prevStep: (state) => {
            if (state.currentStep > 0) {
                state.currentStep -= 1;
            }
        },
        goToStep: (state, action) => {
            state.currentStep = action.payload;
        },
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
        },
        setFilterCategory: (state, action) => {
            state.filterCategory = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRecipes.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchRecipes.fulfilled, (state, action) => {
                state.loading = false;
                state.recipes = action.payload;
            })
            .addCase(fetchRecipes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(toggleFavoriteAsync.fulfilled, (state, action) => {
                const recipe = state.recipes.find(r => r.id === action.payload);
                if (recipe) {
                    recipe.isFavorite = !recipe.isFavorite;
                }
            });
    },
});

export const {
    selectRecipe,
    startCookingMode,
    exitCookingMode,
    nextStep,
    prevStep,
    goToStep,
    setSearchQuery,
    setFilterCategory,
} = recipesSlice.actions;

export default recipesSlice.reducer;
