const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'familyhub.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

// Seed initial data if tables are empty
const seedData = () => {
    // Check if family members exist
    const memberCount = db.prepare('SELECT COUNT(*) as count FROM family_members').get();

    if (memberCount.count === 0) {
        console.log('Seeding initial data...');

        // Insert family members
        const insertMember = db.prepare('INSERT INTO family_members (name, color, points) VALUES (?, ?, ?)');
        insertMember.run('Dad', 'pastel-blue', 120);
        insertMember.run('Mom', 'pastel-pink', 150);
        insertMember.run('Kid1', 'pastel-green', 85);

        // Insert recipes
        const insertRecipe = db.prepare(`
            INSERT INTO recipes (title, emoji, prep_time, cook_time, servings, category, is_favorite, ingredients, steps)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertRecipe.run(
            'Tacos Al Pastor', '🌮', 30, 25, 4, 'Mexican', 1,
            JSON.stringify(['1 lb pork shoulder', '3 dried guajillo chiles', '1/2 cup pineapple juice', '3 cloves garlic', '8 corn tortillas']),
            JSON.stringify(['Soak dried chiles in hot water', 'Blend with pineapple juice and spices', 'Marinate pork', 'Cook until charred', 'Serve on tortillas'])
        );

        insertRecipe.run(
            'Spaghetti Carbonara', '🍝', 10, 20, 4, 'Italian', 0,
            JSON.stringify(['400g spaghetti', '200g guanciale', '4 egg yolks', '100g Pecorino Romano']),
            JSON.stringify(['Cook pasta al dente', 'Crisp guanciale', 'Mix eggs and cheese', 'Combine off heat', 'Serve immediately'])
        );

        insertRecipe.run(
            'Chicken Stir Fry', '🥡', 15, 15, 4, 'Asian', 1,
            JSON.stringify(['1 lb chicken', '2 cups vegetables', '3 tbsp soy sauce', '2 cloves garlic']),
            JSON.stringify(['Mix sauce ingredients', 'Stir-fry chicken', 'Add vegetables', 'Combine with sauce', 'Serve over rice'])
        );

        // Insert chores
        const insertChore = db.prepare('INSERT INTO chores (title, points, assigned_to, completed, recurring) VALUES (?, ?, ?, ?, ?)');
        insertChore.run('Take out trash', 10, 3, 0, 'weekly');
        insertChore.run('Load dishwasher', 10, 3, 0, 'daily');
        insertChore.run('Fold laundry', 15, 2, 0, 'weekly');
        insertChore.run('Vacuum living room', 20, 1, 0, 'weekly');
        insertChore.run('Walk the dog', 15, 1, 1, 'daily');
        insertChore.run('Water plants', 5, 2, 1, 'daily');

        // Insert today's dinner
        const today = new Date().toISOString().split('T')[0];
        const insertDinner = db.prepare('INSERT INTO dinner_slots (date, recipe_id, recipe_title) VALUES (?, ?, ?)');
        insertDinner.run(today, 1, 'Tacos Al Pastor');

        // Insert calendar events
        const insertEvent = db.prepare('INSERT INTO calendar_events (title, date, start_hour, duration, member_id, color) VALUES (?, ?, ?, ?, ?, ?)');
        const eventTemplates = [
            { title: 'Soccer Practice', duration: 1.5, memberId: 3, color: 'pastel-green' },
            { title: 'Work Meeting', duration: 2, memberId: 1, color: 'pastel-blue' },
            { title: 'Piano Lesson', duration: 1, memberId: 3, color: 'pastel-green' },
            { title: 'Grocery Shopping', duration: 1, memberId: 2, color: 'pastel-pink' },
            { title: 'Doctor Appointment', duration: 1, memberId: 2, color: 'pastel-pink' },
            { title: 'Dance Class', duration: 1, memberId: 3, color: 'pastel-green' },
        ];

        // Add events for the next 7 days
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const date = new Date();
            date.setDate(date.getDate() + dayOffset);
            const dateStr = date.toISOString().split('T')[0];

            // 2-3 events per day
            const numEvents = Math.floor(Math.random() * 2) + 2;
            for (let i = 0; i < numEvents; i++) {
                const event = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
                const hour = 8 + Math.floor(Math.random() * 10); // 8am to 6pm
                insertEvent.run(event.title, dateStr, hour, event.duration, event.memberId, event.color);
            }
        }

        console.log('Seed data inserted successfully!');
    }
};

seedData();

module.exports = db;
