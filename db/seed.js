import pool from "./index.js";

// ----- Existing seed data -----
const users = [
  {
    username: "claudia",
    email: "claudia@example.com",
    password: "$2b$12$g9D8q8SMJ.VLhtOKG54OPemnGx0iYho4rjNt2A5oSB8snt3k2FXM.", // already hashed
  },
  {
    username: "marcella",
    email: "marcella@example.com",
    password: "$2b$12$E2L/QZQYkC9Zii/4Pr5CcOY6Cvx7EY1s.j2mZeDBe.GL9UfYcG0uS", // already hashed
  },
];

const posts = [
  {
    title: "First Post",
    content: "Welcome to the blog!",
    userIndex: 0,
  },
  {
    title: "Mental Health Tips",
    content: "Start with deep breathing and journaling.",
    userIndex: 1,
  },
];

const comments = [
  {
    postIndex: 0,
    userIndex: 1,
    content: "This is helpful, thank you!",
  },
  {
    postIndex: 1,
    userIndex: 0,
    content: "Glad you liked it!",
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
  "What matters most to you right now?"
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Clear in FK-safe order for reflections + existing data
    await client.query("DELETE FROM reflection_daily_messages");
    await client.query("DELETE FROM reflection_daily_prompts");
    await client.query("DELETE FROM reflection_prompts");

    await client.query("DELETE FROM comments");
    await client.query("DELETE FROM posts");
    await client.query("DELETE FROM users");

    // Users
    const userIds = [];
    for (const user of users) {
      const res = await client.query(
        `INSERT INTO users (username, email, password)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [user.username, user.email, user.password]
      );
      userIds.push(res.rows[0].id);
    }

    // Posts
    const postIds = [];
    for (const post of posts) {
      const res = await client.query(
        `INSERT INTO posts (title, content, author_id)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [post.title, post.content, userIds[post.userIndex]]
      );
      postIds.push(res.rows[0].id);
    }

    // Comments
    for (const comment of comments) {
      await client.query(
        `INSERT INTO comments (content, post_id, user_id)
         VALUES ($1, $2, $3)`,
        [comment.content, postIds[comment.postIndex], userIds[comment.userIndex]]
      );
    }

    // Reflection prompts
    const promptIds = [];
    for (const text of reflectionPrompts) {
      const res = await client.query(
        `INSERT INTO reflection_prompts (text, is_active)
         VALUES ($1, TRUE)
         RETURNING id`,
        [text]
      );
      promptIds.push(res.rows[0].id);
    }

    // Pick today's prompt (random) and create daily record
    const pickIndex = Math.floor(Math.random() * promptIds.length);
    const pickedPromptId = promptIds[pickIndex];

    await client.query(
      `INSERT INTO reflection_daily_prompts (prompt_id, active_on)
       VALUES ($1, CURRENT_DATE)
       ON CONFLICT (active_on) DO UPDATE SET prompt_id = EXCLUDED.prompt_id`,
      [pickedPromptId]
    );

    await client.query("COMMIT");
    console.log("✅ Database seeded successfully (users, posts, comments, prompts)!");
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