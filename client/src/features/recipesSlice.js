import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';

// Async thunks
export const fetchRecipes = createAsyncThunk('recipes/fetchRecipes', async () => {
    return api.getRecipes();
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
