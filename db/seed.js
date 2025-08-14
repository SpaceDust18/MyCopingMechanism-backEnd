import pool from "./index.js";

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

async function seed() {
  try {
    await pool.query("DELETE FROM comments");
    await pool.query("DELETE FROM posts");
    await pool.query("DELETE FROM users");

    const userIds = [];
    for (const user of users) {
      const res = await pool.query(
        `INSERT INTO users (username, email, password)
         VALUES ($1, $2, $3) RETURNING id`,
        [user.username, user.email, user.password]
      );
      userIds.push(res.rows[0].id);
    }

    const postIds = [];
    for (const post of posts) {
      const res = await pool.query(
        `INSERT INTO posts (title, content, author_id)
         VALUES ($1, $2, $3) RETURNING id`,
        [post.title, post.content, userIds[post.userIndex]]
      );
      postIds.push(res.rows[0].id);
    }

    for (const comment of comments) {
      await pool.query(
        `INSERT INTO comments (content, post_id, user_id)
         VALUES ($1, $2, $3)`,
        [comment.content, postIds[comment.postIndex], userIds[comment.userIndex]]
      );
    }

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding database:", err);
    process.exit(1);
  }
}

seed();