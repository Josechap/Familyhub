const WEEKDAY_TOKENS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const pad = (value) => String(value).padStart(2, '0');

const formatDateKey = (input = new Date()) => {
    const date = input instanceof Date ? new Date(input) : new Date(input);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const getWeekStartDate = (input = new Date()) => {
    const date = input instanceof Date ? new Date(input) : new Date(input);
    date.setHours(0, 0, 0, 0);
    const day = date.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diffToMonday);
    return date;
};

const getWeekStartKey = (input = new Date()) => formatDateKey(getWeekStartDate(input));

const normalizeDaysOfWeek = (daysOfWeek) => {
    if (!daysOfWeek) {
        return [];
    }

    let parsedDays = daysOfWeek;
    if (typeof daysOfWeek === 'string') {
        try {
            parsedDays = JSON.parse(daysOfWeek);
        } catch {
            parsedDays = daysOfWeek.split(',');
        }
    }

    if (!Array.isArray(parsedDays)) {
        return [];
    }

    return [...new Set(parsedDays
        .map((day) => String(day).trim().toLowerCase().slice(0, 3))
        .filter((day) => WEEKDAY_TOKENS.includes(day)))];
};

const normalizeScheduleType = (task) => {
    if (task.schedule_type) {
        return task.schedule_type;
    }

    if (task.scheduleType) {
        return task.scheduleType;
    }

    switch (task.recurring) {
        case 'daily':
            return 'daily';
        case 'weekly':
            return 'weekly';
        default:
            return 'manual';
    }
};

const getCurrentCycleKey = (task, inputDate = new Date()) => {
    const scheduleType = normalizeScheduleType(task);
    if (scheduleType === 'daily') {
        return formatDateKey(inputDate);
    }

    if (scheduleType === 'weekly' || scheduleType === 'specific_days') {
        return getWeekStartKey(inputDate);
    }

    return task.cycle_key || task.cycleKey || null;
};

const getDueDayToken = (inputDate = new Date()) => WEEKDAY_TOKENS[(inputDate instanceof Date ? inputDate : new Date(inputDate)).getDay()];

const isDueToday = (task, inputDate = new Date()) => {
    const scheduleType = normalizeScheduleType(task);
    const active = task.active === undefined || task.active === null ? true : Boolean(task.active);
    if (!active) {
        return false;
    }

    if (scheduleType === 'daily' || scheduleType === 'weekly') {
        return true;
    }

    if (scheduleType === 'specific_days') {
        return normalizeDaysOfWeek(task.days_of_week || task.daysOfWeek).includes(getDueDayToken(inputDate));
    }

    return !Boolean(task.completed);
};

const isDueThisWeek = (task, inputDate = new Date()) => {
    const scheduleType = normalizeScheduleType(task);
    const active = task.active === undefined || task.active === null ? true : Boolean(task.active);
    if (!active) {
        return false;
    }

    if (scheduleType === 'daily' || scheduleType === 'weekly') {
        return true;
    }

    if (scheduleType === 'specific_days') {
        return normalizeDaysOfWeek(task.days_of_week || task.daysOfWeek).length > 0;
    }

    return !Boolean(task.completed);
};

const refreshRoutineTask = (db, task, inputDate = new Date()) => {
    const scheduleType = normalizeScheduleType(task);
    const daysOfWeek = normalizeDaysOfWeek(task.days_of_week || task.daysOfWeek);
    const currentCycleKey = getCurrentCycleKey(task, inputDate);
    let completed = Boolean(task.completed);

    if (scheduleType !== 'manual' && task.cycle_key !== currentCycleKey) {
        db.prepare('UPDATE chores SET cycle_key = ?, completed = 0 WHERE id = ?').run(currentCycleKey, task.id);
        completed = false;
    }

    return {
        ...task,
        scheduleType,
        daysOfWeek,
        dueTime: task.due_time || task.dueTime || null,
        cycleKey: currentCycleKey,
        active: task.active === undefined || task.active === null ? true : Boolean(task.active),
        completed,
        dueToday: isDueToday({ ...task, schedule_type: scheduleType, days_of_week: JSON.stringify(daysOfWeek), completed }, inputDate),
        dueThisWeek: isDueThisWeek({ ...task, schedule_type: scheduleType, days_of_week: JSON.stringify(daysOfWeek), completed }, inputDate),
        isRoutine: scheduleType !== 'manual',
    };
};

const getClothingRecommendation = (weather) => {
    if (!weather || typeof weather.temp !== 'number') {
        return null;
    }

    const temp = weather.temp;
    const condition = String(weather.condition || '').toLowerCase();
    const accessories = [];
    let main = 'T-shirt';
    let layers = 'No extra layer';
    let note = 'Comfortable for most of the day.';

    if (temp <= 35) {
        main = 'Warm coat';
        layers = 'Thermal layer';
        accessories.push('Gloves', 'Beanie');
        note = 'Cold enough for winter gear.';
    } else if (temp <= 50) {
        main = 'Jacket';
        layers = 'Long sleeves';
        accessories.push('Light jacket');
        note = 'Cool outside, dress in layers.';
    } else if (temp <= 68) {
        main = 'Light layer';
        layers = 'Sweatshirt or cardigan';
        note = 'Mild weather with a light extra layer.';
    } else if (temp <= 82) {
        main = 'Short sleeves';
        layers = 'Optional light layer indoors';
        note = 'Warm outside.';
    } else {
        main = 'Breathable clothes';
        layers = 'Avoid heavy layers';
        accessories.push('Water bottle');
        note = 'Hot weather, keep it light.';
    }

    if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm')) {
        accessories.push('Umbrella');
        note = 'Rain expected, bring waterproof gear.';
    }

    if (condition.includes('snow')) {
        accessories.push('Boots');
        note = 'Snow expected, wear insulated footwear.';
    }

    if (weather.windSpeed >= 15) {
        accessories.push('Windbreaker');
    }

    return {
        main,
        layers,
        accessories: [...new Set(accessories)],
        note,
    };
};

module.exports = {
    formatDateKey,
    getWeekStartDate,
    getWeekStartKey,
    normalizeDaysOfWeek,
    normalizeScheduleType,
    getCurrentCycleKey,
    isDueToday,
    isDueThisWeek,
    refreshRoutineTask,
    getClothingRecommendation,
};
