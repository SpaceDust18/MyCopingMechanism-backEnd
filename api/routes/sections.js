import express from "express";
import pool from "../../db/index.js";
import { verifyToken } from "../../middleware/auth.js";

const router = express.Router();
const requireAdmin = (req, res, next) =>
  req.user?.role === "admin" ? next() : res.status(403).json({ error: "Admin privileges required" });

// GET public
router.get("/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const { rows: s } = await pool.query(
      "SELECT id, slug, title FROM sections WHERE lower(slug) = lower($1)",
      [slug]
    );
    const section = s[0];
    if (!section) return res.status(404).json({ error: "Section not found" });

    const { rows: blocks } = await pool.query(
      `SELECT id, title, body, image_url, order_index, published, created_at, updated_at
       FROM content_blocks
       WHERE section_id = $1 AND published = TRUE
       ORDER BY order_index ASC, created_at ASC`,
      [section.id]
    );
    res.json({ section, blocks });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST admin
router.post("/:slug/blocks", verifyToken, requireAdmin, async (req, res) => {
  const { slug } = req.params;
  const { title, body, image_url, order_index = 0, published = true } = req.body || {};
  if (!body?.trim()) return res.status(400).json({ error: "Body is required" });

  try {
    const { rows: s } = await pool.query(
      "SELECT id FROM sections WHERE lower(slug) = lower($1)",
      [slug]
    );
    const section = s[0];
    if (!section) return res.status(404).json({ error: "Section not found" });

    const { rows } = await pool.query(
      `INSERT INTO content_blocks (section_id, title, body, image_url, order_index, published)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, body, image_url, order_index, published, created_at, updated_at`,
      [section.id, title || null, body.trim(), image_url || null, order_index, published]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT admin
router.put("/:slug/blocks/:id", verifyToken, requireAdmin, async (req, res) => {
  const { slug, id } = req.params;
  const { title, body, image_url, order_index, published } = req.body || {};

  const sets = [];
  const vals = [];
  let i = 1;
  if (title !== undefined) { sets.push(`title = $${i++}`); vals.push(title); }
  if (body !== undefined) { sets.push(`body = $${i++}`); vals.push(body); }
  if (image_url !== undefined) { sets.push(`image_url = $${i++}`); vals.push(image_url); }
  if (order_index !== undefined) { sets.push(`order_index = $${i++}`); vals.push(order_index); }
  if (published !== undefined) { sets.push(`published = $${i++}`); vals.push(published); }
  sets.push("updated_at = now()");
  if (sets.length === 1) return res.status(400).json({ error: "Nothing to update" });

  try {
    const { rows: s } = await pool.query("SELECT id FROM sections WHERE lower(slug)=lower($1)", [slug]);
    const section = s[0];
    if (!section) return res.status(404).json({ error: "Section not found" });

    vals.push(section.id, id);
    const { rowCount } = await pool.query(
      `UPDATE content_blocks SET ${sets.join(", ")}
       WHERE section_id = $${i++} AND id = $${i}`,
      vals
    );
    if (rowCount === 0) return res.status(404).json({ error: "Block not found" });
    res.json({ success: true, id: Number(id) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE admin
router.delete("/:slug/blocks/:id", verifyToken, requireAdmin, async (req, res) => {
  const { slug, id } = req.params;
  try {
    const { rows: s } = await pool.query("SELECT id FROM sections WHERE lower(slug)=lower($1)", [slug]);
    const section = s[0];
    if (!section) return res.status(404).json({ error: "Section not found" });

    const { rowCount } = await pool.query(
      "DELETE FROM content_blocks WHERE section_id = $1 AND id = $2",
      [section.id, id]
    );
    if (rowCount === 0) return res.status(404).json({ error: "Block not found" });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;