const API_BASE = 'http://localhost:3001/api';

export const api = {
    // Recipes
    async getRecipes() {
        const res = await fetch(`${API_BASE}/recipes`);
        if (!res.ok) throw new Error('Failed to fetch recipes');
        return res.json();
    },

    async toggleFavorite(id) {
        const res = await fetch(`${API_BASE}/recipes/${id}/favorite`, { method: 'PUT' });
        if (!res.ok) throw new Error('Failed to toggle favorite');
        return res.json();
    },

    // Tasks
    async getTasks() {
        const res = await fetch(`${API_BASE}/tasks`);
        if (!res.ok) throw new Error('Failed to fetch tasks');
        return res.json();
    },

    async getFamilyMembers() {
        const res = await fetch(`${API_BASE}/tasks/family`);
        if (!res.ok) throw new Error('Failed to fetch family');
        return res.json();
    },

    async toggleChore(id) {
        const res = await fetch(`${API_BASE}/tasks/${id}/toggle`, { method: 'PUT' });
        if (!res.ok) throw new Error('Failed to toggle chore');
        return res.json();
    },

    // Calendar
    async getEvents() {
        const res = await fetch(`${API_BASE}/calendar/events`);
        if (!res.ok) throw new Error('Failed to fetch events');
        return res.json();
    },

    async getDinnerSlots() {
        const res = await fetch(`${API_BASE}/calendar/dinner`);
        if (!res.ok) throw new Error('Failed to fetch dinner slots');
        return res.json();
    },

    // Google
    async getGoogleCalendarEvents() {
        try {
            const res = await fetch(`${API_BASE}/google/calendar/events`);
            if (!res.ok) return []; // Return empty if not connected
            return res.json();
        } catch {
            return []; // Return empty on error
        }
    },

    async getGoogleTasks() {
        try {
            const res = await fetch(`${API_BASE}/google/tasks`);
            if (!res.ok) return [];
            return res.json();
        } catch {
            return [];
        }
    },

    async completeGoogleTask(listId, taskId) {
        const res = await fetch(`${API_BASE}/google/tasks/${listId}/${taskId}/complete`, {
            method: 'PATCH',
        });
        if (!res.ok) throw new Error('Failed to complete task');
        return res.json();
    },

    async reopenGoogleTask(listId, taskId) {
        const res = await fetch(`${API_BASE}/google/tasks/${listId}/${taskId}/reopen`, {
            method: 'PATCH',
        });
        if (!res.ok) throw new Error('Failed to reopen task');
        return res.json();
    },

    async updateGoogleTask(listId, taskId, updates) {
        const res = await fetch(`${API_BASE}/google/tasks/${listId}/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error('Failed to update task');
        return res.json();
    },

    async createGoogleTask(listId, task) {
        const res = await fetch(`${API_BASE}/google/tasks/${listId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task),
        });
        if (!res.ok) throw new Error('Failed to create task');
        return res.json();
    },

    async deleteGoogleTask(listId, taskId) {
        const res = await fetch(`${API_BASE}/google/tasks/${listId}/${taskId}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete task');
        return res.json();
    },

    async transferGoogleTask(listId, taskId, targetListId) {
        const res = await fetch(`${API_BASE}/google/tasks/${listId}/${taskId}/transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetListId }),
        });
        if (!res.ok) throw new Error('Failed to transfer task');
        return res.json();
    },

    async getGoogleTaskLists() {
        try {
            const res = await fetch(`${API_BASE}/google/tasks/lists`);
            if (!res.ok) return [];
            return res.json();
        } catch {
            return [];
        }
    },

    // Paprika
    async getPaprikaStatus() {
        try {
            const res = await fetch(`${API_BASE}/paprika/status`);
            if (!res.ok) return { connected: false };
            return res.json();
        } catch {
            return { connected: false };
        }
    },

    async connectPaprika(email, password) {
        const res = await fetch(`${API_BASE}/paprika/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to connect');
        }
        return res.json();
    },

    async getPaprikaRecipes() {
        try {
            const res = await fetch(`${API_BASE}/paprika/recipes`);
            if (!res.ok) return { recipes: [] };
            return res.json();
        } catch {
            return { recipes: [] };
        }
    },

    async disconnectPaprika() {
        const res = await fetch(`${API_BASE}/paprika/disconnect`, {
            method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to disconnect');
        return res.json();
    },

    // Meal Planning
    async getMealsForWeek(startDate) {
        const res = await fetch(`${API_BASE}/meals/week?start=${startDate}`);
        if (!res.ok) throw new Error('Failed to fetch meals');
        return res.json();
    },

    async getTodayMeal() {
        const res = await fetch(`${API_BASE}/meals/today`);
        if (!res.ok) return null;
        return res.json();
    },

    async setMeal(date, recipe) {
        const res = await fetch(`${API_BASE}/meals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date,
                recipeId: recipe.id,
                recipeTitle: recipe.title,
                recipeEmoji: recipe.emoji || '🍽️',
                recipePhoto: recipe.photoUrl || null,
            }),
        });
        if (!res.ok) throw new Error('Failed to set meal');
        return res.json();
    },

    async removeMeal(date) {
        const res = await fetch(`${API_BASE}/meals/${date}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to remove meal');
        return res.json();
    },
    // Sonos
    async getSonosDevices() {
        const res = await fetch(`${API_BASE}/sonos`);
        if (!res.ok) throw new Error('Failed to fetch sonos devices');
        return res.json();
    },

    async sonosPlay(ip) {
        const res = await fetch(`${API_BASE}/sonos/${ip}/play`);
        if (!res.ok) throw new Error('Failed to play');
        return res.json();
    },

    async sonosPause(ip) {
        const res = await fetch(`${API_BASE}/sonos/${ip}/pause`);
        if (!res.ok) throw new Error('Failed to pause');
        return res.json();
    },

    async sonosNext(ip) {
        const res = await fetch(`${API_BASE}/sonos/${ip}/next`);
        if (!res.ok) throw new Error('Failed to skip next');
        return res.json();
    },

    async sonosPrevious(ip) {
        const res = await fetch(`${API_BASE}/sonos/${ip}/previous`);
        if (!res.ok) throw new Error('Failed to skip previous');
        return res.json();
    },

    async sonosVolume(ip, level) {
        const res = await fetch(`${API_BASE}/sonos/${ip}/volume/${level}`);
        if (!res.ok) throw new Error('Failed to set volume');
        return res.json();
    },

    async getSonosState(ip) {
        const res = await fetch(`${API_BASE}/sonos/${ip}/state`);
        if (!res.ok) throw new Error('Failed to get state');
        return res.json();
    },
};

export default api;
