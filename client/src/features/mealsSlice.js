import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../lib/api';

export const fetchMeals = createAsyncThunk('meals/fetchMeals', async (weekStart) => {
    const [meals, shoppingList] = await Promise.all([
        api.getMealsForWeek(weekStart),
        api.getShoppingItems().catch(() => ({ items: [], uncheckedCount: 0 })),
    ]);
    return { meals, weekStart, shoppingList };
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
    return api.generateShoppingList(dateRange);
});

export const fetchShoppingList = createAsyncThunk('meals/fetchShoppingList', async () => {
    return api.getShoppingItems();
});

export const updateShoppingListItem = createAsyncThunk('meals/updateShoppingListItem', async ({ id, updates }) => {
    return api.updateShoppingItem(id, updates);
});

export const addShoppingListItem = createAsyncThunk('meals/addShoppingListItem', async (payload) => {
    return api.addShoppingItem(payload);
});

export const deleteShoppingListItem = createAsyncThunk('meals/deleteShoppingListItem', async (id) => {
    return api.deleteShoppingItem(id);
});

export const fetchMealHistory = createAsyncThunk('meals/fetchMealHistory', async ({ startDate, endDate }) => {
    return api.getMealHistory(startDate, endDate);
});

const initialState = {
    meals: {},
    weekStart: null,
    todayMeals: {
        breakfast: null,
        lunch: null,
        dinner: null,
        snack: null,
    },
    shoppingList: {
        items: [],
        uncheckedCount: 0,
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
    selectedMealType: null,
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
            state.selectedDate = action.payload.date;
            state.selectedMealType = action.payload.mealType;
            state.showRecipePicker = true;
        },
        closeRecipePicker: (state) => {
            state.showRecipePicker = false;
        },
        setWeekStart: (state, action) => {
            state.weekStart = action.payload;
        },
    },
    extraReducers: (builder) => {
        const applyShoppingPayload = (state, payload) => {
            state.shoppingList.items = payload.items || [];
            state.shoppingList.uncheckedCount = payload.uncheckedCount || 0;
            if (payload.dateRange) {
                state.shoppingList.dateRange = payload.dateRange;
            }
        };

        builder
            .addCase(fetchMeals.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchMeals.fulfilled, (state, action) => {
                state.loading = false;
                state.meals = action.payload.meals;
                state.weekStart = action.payload.weekStart;
                applyShoppingPayload(state, action.payload.shoppingList);
            })
            .addCase(fetchMeals.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(setMealAsync.fulfilled, (state, action) => {
                const { date, mealType, recipe } = action.payload;
                if (!state.meals[date]) {
                    state.meals[date] = {};
                }
                state.meals[date][mealType] = {
                    recipeId: recipe.id,
                    recipeTitle: recipe.title,
                    recipeEmoji: recipe.emoji || '🍽️',
                    recipePhoto: recipe.photoUrl || null,
                };
                state.showRecipePicker = false;
            })
            .addCase(removeMealAsync.fulfilled, (state, action) => {
                const { date, mealType } = action.payload;
                if (state.meals[date]) {
                    delete state.meals[date][mealType];
                    if (Object.keys(state.meals[date]).length === 0) {
                        delete state.meals[date];
                    }
                }
            })
            .addCase(fetchTodayMeals.fulfilled, (state, action) => {
                state.todayMeals = action.payload;
            })
            .addCase(generateShoppingList.pending, (state) => {
                state.shoppingList.loading = true;
            })
            .addCase(generateShoppingList.fulfilled, (state, action) => {
                state.shoppingList.loading = false;
                applyShoppingPayload(state, action.payload);
            })
            .addCase(generateShoppingList.rejected, (state, action) => {
                state.shoppingList.loading = false;
                state.error = action.error.message;
            })
            .addCase(fetchShoppingList.fulfilled, (state, action) => {
                applyShoppingPayload(state, action.payload);
            })
            .addCase(updateShoppingListItem.fulfilled, (state, action) => {
                applyShoppingPayload(state, action.payload);
            })
            .addCase(addShoppingListItem.fulfilled, (state, action) => {
                applyShoppingPayload(state, action.payload);
            })
            .addCase(deleteShoppingListItem.fulfilled, (state, action) => {
                applyShoppingPayload(state, action.payload);
            })
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
    setWeekStart,
} = mealsSlice.actions;

export default mealsSlice.reducer;
