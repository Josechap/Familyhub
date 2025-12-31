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
};

export default api;
