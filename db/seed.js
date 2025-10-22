import pool from "./index.js";

// ----- Users -----
const users = [
  {
    username: "claudia",
    email: "claudia@example.com",
    password: "$2b$12$g9D8q8SMJ.VLhtOKG54OPemnGx0iYho4rjNt2A5oSB8snt3k2FXM.", // already hashed
    role: "admin",
  },
  {
    username: "marcella",
    email: "marcella@example.com",
    password: "$2b$12$E2L/QZQYkC9Zii/4Pr5CcOY6Cvx7EY1s.j2mZeDBe.GL9UfYcG0uS", // already hashed
    role: "user",
  },
  {
    username: "Queen B",
    email: "mycopingmechanism83@gmail.com",
    password: "$2b$12$3hubraMonopy1iAEC1x8vOAijN0yfN.ojn5b.JBsFEvQ4SGAA14TW", // already hashed
    role: "admin",
  },
];

// ----- Reflection prompts -----
const reflectionPrompts = [
  "What is one small win you had today?",
  "What helps you feel grounded when life feels heavy?",
  "Name one thing you would tell your younger self?",
  "What can you do in the next ten minutes to care for yourself?",
  "What made you smile today?",
  "What are three things you're grateful for right now?",
  "What emotion stood out to you today, and why?",
  "What would you like to let go of?",
  "What does ‘rest’ mean to you?",
  "Describe one moment today where you felt calm.",
  "What’s something kind you can say to yourself right now?",
  "Who or what inspired you today?",
  "What’s a goal you’re working toward, and how do you feel about it?",
  "When was the last time you felt proud of yourself?",
  "What does self-care look like for you this week?",
  "What is something you learned about yourself recently?",
  "What are your top three priorities this month?",
  "How would you describe your mood in one word?",
  "What’s something you can forgive yourself for?",
  "How do you show kindness to others?",
  "What’s a recent challenge that helped you grow?",
  "What brings you peace when things feel overwhelming?",
  "If you could talk to your future self, what would you ask?",
  "What habit would you like to build or strengthen?",
  "What are you most looking forward to tomorrow?",
  "What’s a way you can express creativity this week?",
  "What makes you feel safe and supported?",
  "When do you feel most like yourself?",
  "What’s a lesson you’ve learned the hard way?",
  "What boundaries do you want to protect?",
  "Describe something simple that brings you joy.",
  "What would make tomorrow a good day?",
  "What motivates you when you feel stuck?",
  "How do you take care of your mental health?",
  "Who makes you feel supported, and why?",
  "What’s a kind message you wish someone would tell you?",
  "How can you celebrate yourself today?",
  "What do you want to remember about this week?",
  "If you could give yourself one piece of advice, what would it be?",
  "What matters most to you right now?",
];

// ----- Weekly quotes -----
const weeklyQuotes = [
  "We must understand that sadness is an ocean, and sometimes we drown, while other days we are forced to swim. —— R.M. Drake",
  "Healing doesn’t mean the damage never existed. It means the damage no longer controls your life. —— Akshay Dubey",
  "Do not judge me by my success, judge me by how many times I fell and got back up again. —— Nelson Mandela",
  "You either walk inside your story and own it, or you stand outside your story and hustle for your worthiness. —— Brené Brown",
  "Even the darkest night will end, and the sun will rise. —— Victor Hugo",
  "Our wounds are often the openings into the best and most beautiful parts of us. —— David Richo",
  "What lies behind us and what lies before us are tiny matters compared to what lies within us. —— Ralph Waldo Emerson",
  "Just because no one else can heal or do your inner work for you doesn’t mean you can, should, or need to do it alone. —— Lisa Olivera",
  "Be gentle with yourself. You’re doing the best you can. —— Unknown",
  "Rock bottom became the solid foundation on which I rebuilt my life. —— J.K. Rowling",
  "Sometimes the bravest and most important thing you can do is just show up. —— Brené Brown",
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ✅ Upsert users
    for (const user of users) {
      await client.query(
        `INSERT INTO users (username, email, password, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE
         SET role = EXCLUDED.role`,
        [user.username, user.email, user.password, user.role]
      );
    }

    // ✅ Reflection prompts (no duplicates)
    for (const text of reflectionPrompts) {
      await client.query(
        `INSERT INTO reflection_prompts (text, is_active)
         VALUES ($1, TRUE)
         ON CONFLICT (text) DO NOTHING`,
        [text]
      );
    }

    // ✅ Weekly quotes (no duplicates) — FIXED
    for (const quote of weeklyQuotes) {
      await client.query(
        `INSERT INTO weekly_quotes (text, is_active)
         VALUES ($1, TRUE)
         ON CONFLICT (text) DO NOTHING`,
        [quote]
      );
    }

    // ✅ Pick today's daily reflection prompt
    const { rows } = await client.query(`SELECT id FROM reflection_prompts`);
    if (rows.length > 0) {
      const pickIndex = Math.floor(Math.random() * rows.length);
      const pickedPromptId = rows[pickIndex].id;

      await client.query(
        `INSERT INTO reflection_daily_prompts (prompt_id, active_on)
         VALUES ($1, CURRENT_DATE)
         ON CONFLICT (active_on) DO UPDATE SET prompt_id = EXCLUDED.prompt_id`,
        [pickedPromptId]
      );
    }

    // ✅ Pick this week’s quote
    const quotesRes = await client.query(`SELECT id FROM weekly_quotes`);
    if (quotesRes.rows.length > 0) {
      const pickIndex = Math.floor(Math.random() * quotesRes.rows.length);
      const pickedQuoteId = quotesRes.rows[pickIndex].id;

      // Instead of using a separate table, we can store the "active" week directly
      await client.query(
        `UPDATE weekly_quotes
         SET used_on = DATE_TRUNC('week', CURRENT_DATE)
         WHERE id = $1`,
        [pickedQuoteId]
      );
    }

    await client.query("COMMIT");
    console.log("✅ Database seeded successfully (users, prompts, daily reflection, weekly quotes)!");
    process.exit(0);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error seeding database:", err);
    process.exit(1);
  } finally {
    client.release();
  }
}

seed();