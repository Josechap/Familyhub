const getPrepTemplates = (db) => {
    const templates = db.prepare(`
        SELECT pt.id, pt.title, pt.trigger_type, pt.trigger_value, pt.member_id, fm.name AS member_name
        FROM prep_templates pt
        LEFT JOIN family_members fm ON pt.member_id = fm.id
        ORDER BY pt.title
    `).all();

    const items = db.prepare(`
        SELECT id, template_id, label, sort_order
        FROM prep_items
        ORDER BY template_id, sort_order, id
    `).all();

    return templates.map((template) => ({
        id: String(template.id),
        title: template.title,
        triggerType: template.trigger_type,
        triggerValue: template.trigger_value,
        memberId: template.member_id ? String(template.member_id) : null,
        memberName: template.member_name || null,
        items: items
            .filter((item) => item.template_id === template.id)
            .map((item) => ({
                id: String(item.id),
                label: item.label,
                sortOrder: item.sort_order,
            })),
    }));
};

const matchesTemplate = (template, event) => {
    if (template.memberId && event.memberId && String(template.memberId) !== String(event.memberId)) {
        return false;
    }

    const title = String(event.title || '').toLowerCase();
    const eventType = String(event.eventType || 'general').toLowerCase();
    const triggerValue = String(template.triggerValue || '').trim().toLowerCase();

    if (!triggerValue) {
        return false;
    }

    if (template.triggerType === 'event_type') {
        return eventType === triggerValue;
    }

    return title.includes(triggerValue);
};

const attachPrepMatches = (db, events) => {
    const templates = getPrepTemplates(db);
    return events.map((event) => {
        const prepMatches = templates
            .filter((template) => matchesTemplate(template, event))
            .map((template) => ({
                templateId: template.id,
                title: template.title,
                triggerType: template.triggerType,
                triggerValue: template.triggerValue,
                items: template.items,
            }));

        return {
            ...event,
            prepMatches,
        };
    });
};

const buildPrepAgendaForDate = (events, dateKey) => {
    return events
        .filter((event) => event.date === dateKey)
        .flatMap((event) => (event.prepMatches || []).flatMap((match) =>
            match.items.map((item) => ({
                id: `${event.id}:${match.templateId}:${item.id}`,
                label: item.label,
                eventId: event.id,
                eventTitle: event.title,
                templateId: match.templateId,
                templateTitle: match.title,
                memberId: event.memberId || null,
                member: event.member || null,
            }))
        ));
};

module.exports = {
    getPrepTemplates,
    attachPrepMatches,
    buildPrepAgendaForDate,
};
