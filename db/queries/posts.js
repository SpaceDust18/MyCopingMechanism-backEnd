// db/queries/posts.js
import pool from "../index.js";

// GET /api/posts?search=term&page=1&limit=10
export async function getAllPosts(req, res) {
  const { search = "", page = "1", limit = "10" } = req.query;

  const p = Math.max(parseInt(page, 10) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
  const offset = (p - 1) * l;

  const term = search.trim();

  let values = [];
  let idx = 1;

  const where = term
    ? `WHERE p.title ILIKE $${idx} OR p.content ILIKE $${idx} OR u.username ILIKE $${idx}`
    : "";

  if (term) {
    values.push(`%${term}%`);
    idx += 1;
  }

  const limitIdx = idx;
  values.push(l);
  idx += 1;

  const offsetIdx = idx;
  values.push(offset);

  const listSql = `
    SELECT p.*, u.username AS author
    FROM posts p
    JOIN users u ON p.author_id = u.id
    ${where}
    ORDER BY p.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM posts p
    JOIN users u ON p.author_id = u.id
    ${where}
  `;

  try {
    const [list, count] = await Promise.all([
      pool.query(listSql, values),
      pool.query(countSql, term ? [values[0]] : []),
    ]);

    const total = count.rows[0].total;
    res.json({
      data: list.rows,
      page: p,
      limit: l,
      total,
      totalPages: Math.max(Math.ceil(total / l), 1),
    });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ error: "Server error fetching posts" });
  }
}

// GET /api/posts/:id
export async function getPostById(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.*, u.username AS author
       FROM posts p
       JOIN users u ON p.author_id = u.id
       WHERE p.id = $1`,
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

// POST /api/posts   requires verifyToken
export async function createPost(req, res) {
  const userId = req.user?.id;
  const { title, content, image_url = null } = req.body;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!title || !content) return res.status(400).json({ error: "Title and content are required" });

  try {
    const inserted = await pool.query(
      `INSERT INTO posts (title, content, author_id, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [title, content, userId, image_url]
    );

    const { rows } = await pool.query(
      `SELECT p.*, u.username AS author
       FROM posts p
       JOIN users u ON p.author_id = u.id
       WHERE p.id = $1`,
      [inserted.rows[0].id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: "Server error creating post" });
  }
}

// PUT /api/posts/:id   requires verifyToken and ownership
export async function updatePost(req, res) {
  const userId = req.user?.id;
  const { id } = req.params;
  const { title, content, image_url } = req.body;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (title === undefined && content === undefined && image_url === undefined) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  const sets = [];
  const values = [];
  let idx = 1;

  if (title !== undefined) { sets.push(`title = $${idx++}`); values.push(title); }
  if (content !== undefined) { sets.push(`content = $${idx++}`); values.push(content); }
  if (image_url !== undefined) { sets.push(`image_url = $${idx++}`); values.push(image_url); }

  // always update updated_at
  sets.push(`updated_at = NOW()`);

  values.push(id);     // $idx
  values.push(userId); // $idx+1

  const sql = `
    UPDATE posts
    SET ${sets.join(", ")}
    WHERE id = $${idx} AND author_id = $${idx + 1}
    RETURNING id
  `;

  try {
    const result = await pool.query(sql, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Post not found or not yours" });
    }

    const { rows } = await pool.query(
      `SELECT p.*, u.username AS author
       FROM posts p
       JOIN users u ON p.author_id = u.id
       WHERE p.id = $1`,
      [result.rows[0].id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).json({ error: "Server error updating post" });
  }
}

// DELETE /api/posts/:id   requires verifyToken and ownership
export async function deletePost(req, res) {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const result = await pool.query(
      `DELETE FROM posts
       WHERE id = $1 AND author_id = $2
       RETURNING id`,
      [id, userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Post not found or not yours" });
    }
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ error: "Server error deleting post" });
  }
}
