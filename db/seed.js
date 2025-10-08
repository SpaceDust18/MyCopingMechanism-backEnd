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

// ----- New: reflection prompts & sample daily messages -----
const reflectionPrompts = [
  "What is one small win you had today",
  "What helps you feel grounded when life feels heavy",
  "Name one thing you would tell your younger self",
  "What can you do in the next ten minutes to care for yourself",
];

const sampleReflectionMessages = [
  { username: "claudia", content: "Grateful for a calm moment with tea." },
  { username: "marcella", content: "I took a short walk and felt better." },
  { username: "Anonymous", content: "Listened to my favorite song on repeat." },
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

    const dailyRes = await client.query(
      `INSERT INTO reflection_daily_prompts (prompt_id, active_on)
       VALUES ($1, CURRENT_DATE)
       ON CONFLICT (active_on) DO UPDATE SET prompt_id = EXCLUDED.prompt_id
       RETURNING id`,
      [pickedPromptId]
    );
    const dailyId = dailyRes.rows[0].id;

    // Map usernames to user IDs for sample messages
    const usernameToId = new Map();
    const usersRes = await client.query(`SELECT id, username FROM users`);
    for (const row of usersRes.rows) {
      usernameToId.set(row.username, row.id);
    }

    // Seed a few public chat messages for today
    for (const m of sampleReflectionMessages) {
      const uid = usernameToId.get(m.username) ?? null;
      await client.query(
        `INSERT INTO reflection_daily_messages (daily_id, user_id, username, content)
         VALUES ($1, $2, $3, $4)`,
        [dailyId, uid, m.username, m.content]
      );
    }

    await client.query("COMMIT");
    console.log("Database seeded successfully (users, posts, comments, reflections)!");
    process.exit(0);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error seeding database:", err);
    process.exit(1);
  } finally {
    client.release();
  }
}

seed();