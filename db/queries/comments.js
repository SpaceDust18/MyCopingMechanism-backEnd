import pool from "../index.js";

// Get comments for a post
export async function getCommentsByPost(req, res) {
  const { postId } = req.params;
  try {
    const result = await pool.query(
      `SELECT comments.*, users.username AS author
       FROM comments
       JOIN users ON comments.user_id = users.id
       WHERE post_id = $1
       ORDER BY comments.created_at ASC`,
      [postId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ error: "Server error fetching comments" });
  }
}

// Add a comment to a post
export async function addComment(req, res) {
  const { postId } = req.params;
  const { content } = req.body;
  const userId = req.user.id; // from JWT
  try {
    const result = await pool.query(
      `INSERT INTO comments (post_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [postId, userId, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ error: "Server error adding comment" });
  }
}

// Delete a comment (only author can delete)
export async function deleteComment(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const result = await pool.query(
      `DELETE FROM comments
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(403).json({ error: "Not authorized or comment not found" });
    }
    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ error: "Server error deleting comment" });
  }
}