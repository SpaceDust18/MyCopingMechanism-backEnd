import pool from "../index.js";

// Get all posts
export async function getAllPosts(req, res) {
  try {
    const result = await pool.query(
      `SELECT posts.*, users.username AS author
       FROM posts
       JOIN users ON posts.author_id = users.id
       ORDER BY posts.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ error: "Server error fetching posts" });
  }
}

// Get a single post by ID
export async function getPostById(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT posts.*, users.username AS author
       FROM posts
       JOIN users ON posts.author_id = users.id
       WHERE posts.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).json({ error: "Server error fetching post" });
  }
}

// Create a new post
export async function createPost(req, res) {
  const { title, content, image_url } = req.body;
  const userId = req.user.id; // from JWT
  try {
    const result = await pool.query(
      `INSERT INTO posts (title, content, author_id, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, content, userId, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: "Server error creating post" });
  }
}

// Update a post (only if user is the author)
export async function updatePost(req, res) {
  const { id } = req.params;
  const { title, content, image_url } = req.body;
  const userId = req.user.id; // from JWT
  try {
    const result = await pool.query(
      `UPDATE posts
       SET title = $1, content = $2, image_url = $3
       WHERE id = $4 AND author_id = $5
       RETURNING *`,
      [title, content, image_url, id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(403).json({ error: "Not authorized to update this post" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).json({ error: "Server error updating post" });
  }
}

// Delete a post (only if user is the author)
export async function deletePost(req, res) {
  const { id } = req.params;
  const userId = req.user.id; // from JWT
  try {
    const result = await pool.query(
      `DELETE FROM posts
       WHERE id = $1 AND author_id = $2
       RETURNING *`,
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(403).json({ error: "Not authorized or post not found" });
    }
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ error: "Server error deleting post" });
  }
}