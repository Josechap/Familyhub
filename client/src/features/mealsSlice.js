import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';

// Async thunks
export const fetchMeals = createAsyncThunk('meals/fetchMeals', async (weekStart) => {
    const meals = await api.getMealsForWeek(weekStart);
    return { meals, weekStart };
});

export const setMealAsync = createAsyncThunk('meals/setMeal', async ({ date, mealType, recipe }) => {
    await api.setMeal(date, mealType, recipe);
    return { date, mealType, recipe };
});

export const removeMealAsync = createAsyncThunk('meals/removeMeal', async ({ date, mealType }) => {
    await api.removeMeal(date, mealType);
    return { date, mealType };
});

export const fetchTodayMeals = createAsyncThunk('meals/fetchTodayMeals', async () => {
    const meals = await api.getTodayMeals();
    return meals;
});

export const generateShoppingList = createAsyncThunk('meals/generateShoppingList', async (dateRange) => {
    const shoppingList = await api.generateShoppingList(dateRange);
    return shoppingList;
});

export const fetchMealHistory = createAsyncThunk('meals/fetchMealHistory', async ({ startDate, endDate }) => {
    const history = await api.getMealHistory(startDate, endDate);
    return history;
});

const initialState = {
    meals: {}, // Date-keyed object: { '2026-01-09': { breakfast: {...}, lunch: {...}, dinner: {...}, snack: {...} } }
    weekStart: null,
    todayMeals: {
        breakfast: null,
        lunch: null,
        dinner: null,
        snack: null,
    },
    shoppingList: {
        items: [],
        loading: false,
        dateRange: null,
    },
    history: {
        entries: [],
        loading: false,
        startDate: null,
        endDate: null,
    },
    selectedDate: null,
    selectedMealType: null, // 'breakfast', 'lunch', 'dinner', 'snack'
    showRecipePicker: false,
    loading: false,
    error: null,
};

export const mealsSlice = createSlice({
    name: 'meals',
    initialState,
    reducers: {
        setSelectedDate: (state, action) => {
            state.selectedDate = action.payload;
        },
        setSelectedMealType: (state, action) => {
            state.selectedMealType = action.payload;
        },
        toggleRecipePicker: (state, action) => {
            state.showRecipePicker = action.payload ?? !state.showRecipePicker;
        },
        openRecipePicker: (state, action) => {
            // Action payload: { date, mealType }
            state.selectedDate = action.payload.date;
            state.selectedMealType = action.payload.mealType;
            state.showRecipePicker = true;
        },
        closeRecipePicker: (state) => {
            state.showRecipePicker = false;
        },
        clearShoppingList: (state) => {
            state.shoppingList.items = [];
            state.shoppingList.dateRange = null;
        },
        toggleShoppingListItem: (state, action) => {
            const item = state.shoppingList.items.find(i => i.id === action.payload);
            if (item) {
                item.checked = !item.checked;
            }
        },
        setWeekStart: (state, action) => {
            state.weekStart = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch meals for week
            .addCase(fetchMeals.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchMeals.fulfilled, (state, action) => {
                state.loading = false;
                state.meals = action.payload.meals;
                state.weekStart = action.payload.weekStart;
            })
            .addCase(fetchMeals.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Set meal
            .addCase(setMealAsync.fulfilled, (state, action) => {
                const { date, mealType, recipe } = action.payload;
                if (!state.meals[date]) {
                    state.meals[date] = {};
                }
                // Transform recipe to format expected by UI
                state.meals[date][mealType] = {
                    recipeId: recipe.id,
                    recipeTitle: recipe.title,
                    recipeEmoji: recipe.emoji || '🍽️',
                    recipePhoto: recipe.photoUrl || null,
                };
                state.showRecipePicker = false;
            })
            // Remove meal
            .addCase(removeMealAsync.fulfilled, (state, action) => {
                const { date, mealType } = action.payload;
                if (state.meals[date]) {
                    delete state.meals[date][mealType];
                    if (Object.keys(state.meals[date]).length === 0) {
                        delete state.meals[date];
                    }
                }
            })
            // Fetch today's meals
            .addCase(fetchTodayMeals.fulfilled, (state, action) => {
                state.todayMeals = action.payload;
            })
            // Generate shopping list
            .addCase(generateShoppingList.pending, (state) => {
                state.shoppingList.loading = true;
            })
            .addCase(generateShoppingList.fulfilled, (state, action) => {
                state.shoppingList.loading = false;
                state.shoppingList.items = action.payload.items;
                state.shoppingList.dateRange = action.payload.dateRange;
            })
            .addCase(generateShoppingList.rejected, (state, action) => {
                state.shoppingList.loading = false;
                state.error = action.error.message;
            })
            // Fetch meal history
            .addCase(fetchMealHistory.pending, (state) => {
                state.history.loading = true;
            })
            .addCase(fetchMealHistory.fulfilled, (state, action) => {
                state.history.loading = false;
                state.history.entries = action.payload;
            })
            .addCase(fetchMealHistory.rejected, (state, action) => {
                state.history.loading = false;
                state.error = action.error.message;
            });
    },
});

export const {
    setSelectedDate,
    setSelectedMealType,
    toggleRecipePicker,
    openRecipePicker,
    closeRecipePicker,
    clearShoppingList,
    toggleShoppingListItem,
    setWeekStart,
} = mealsSlice.actions;

export default mealsSlice.reducer;
