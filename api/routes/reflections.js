// api/routes/reflections.js
import { Router } from "express";
import pool from "../../db/index.js";
import { verifyToken } from "../../middleware/auth.js";

const router = Router();

// Ensures today's daily prompt exists; create one if missing by choosing a random active prompt
async function ensureTodayDailyPrompt(client) {
  const existing = await client.query(
    `SELECT dp.id, dp.active_on, p.id AS prompt_id, p.text
       FROM reflection_daily_prompts dp
       JOIN reflection_prompts p ON p.id = dp.prompt_id
      WHERE dp.active_on = CURRENT_DATE`
  );
  if (existing.rows.length) return existing.rows[0];

  const pick = await client.query(
    `SELECT id, text
       FROM reflection_prompts
      WHERE is_active = TRUE
   ORDER BY RANDOM()
      LIMIT 1`
  );
  if (!pick.rows.length) throw new Error("No active prompts available");

  const prompt = pick.rows[0];
  const inserted = await client.query(
    `INSERT INTO reflection_daily_prompts (prompt_id, active_on)
     VALUES ($1, CURRENT_DATE)
     RETURNING id, active_on`,
    [prompt.id]
  );

  return {
    id: inserted.rows[0].id,
    active_on: inserted.rows[0].active_on,
    prompt_id: prompt.id,
    text: prompt.text,
  };
}

/** GET /api/reflections/today */
router.get("/today", async (_req, res) => {
  const client = await pool.connect();
  try {
    const daily = await ensureTodayDailyPrompt(client);
    return res.json({
      daily_id: daily.id,
      active_on: daily.active_on,
      prompt: { id: daily.prompt_id, text: daily.text },
    });
  } catch (e) {
    console.error("GET /api/reflections/today error:", e);
    return res.status(500).json({ error: "Unable to get today's prompt" });
  } finally {
    client.release();
  }
});

/** GET /api/reflections/today/messages */
router.get("/today/messages", async (_req, res) => {
  try {
    const today = await pool.query(
      `SELECT id FROM reflection_daily_prompts WHERE active_on = CURRENT_DATE`
    );
    if (!today.rows.length) {
      return res.json([]);
    }
    const dailyId = today.rows[0].id;

    const rows = await pool.query(
      `SELECT id, user_id, username, content, created_at
         FROM reflection_daily_messages
        WHERE daily_id = $1
     ORDER BY created_at ASC
        LIMIT 200`,
      [dailyId]
    );
    return res.json(rows.rows);
  } catch (e) {
    console.error("GET /api/reflections/today/messages error:", e);
    return res.status(500).json({ error: "Unable to fetch messages" });
  }
});

/** GET /api/reflections/random (requires JWT)
 * Alias to today's prompt — everyone sees the same one each day
 */
router.get("/random", verifyToken, async (_req, res) => {
  const client = await pool.connect();
  try {
    const daily = await ensureTodayDailyPrompt(client);
    return res.json({
      ok: true,
      daily_id: daily.id,
      active_on: daily.active_on,
      prompt: { id: daily.prompt_id, text: daily.text },
    });
  } catch (err) {
    console.error("GET /api/reflections/random error:", err);
    return res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

/** PATCH /api/reflections/messages/:id (requires JWT) */
router.patch("/messages/:id", verifyToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const content = String(req.body?.content || "").trim();
    if (!id || !content) return res.status(400).json({ error: "Bad payload" });

    const found = await pool.query(
      `SELECT id, user_id FROM reflection_daily_messages WHERE id = $1`,
      [id]
    );
    if (!found.rows.length) return res.status(404).json({ error: "Not found" });

    if (found.rows[0].user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not your message" });
    }

    const updated = await pool.query(
      `UPDATE reflection_daily_messages
          SET content = $2
        WHERE id = $1
    RETURNING id, user_id, username, content, created_at`,
      [id, content]
    );

    return res.json({ ok: true, message: updated.rows[0] });
  } catch (e) {
    console.error("PATCH /api/reflections/messages/:id error:", e);
    return res.status(500).json({ error: "Update failed" });
  }
});

/** DELETE /api/reflections/messages/:id (requires JWT) */
router.delete("/messages/:id", verifyToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Bad id" });

    const found = await pool.query(
      `SELECT id, user_id FROM reflection_daily_messages WHERE id = $1`,
      [id]
    );
    if (!found.rows.length) return res.status(404).json({ error: "Not found" });

    if (found.rows[0].user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not your message" });
    }

    const del = await pool.query(
      `DELETE FROM reflection_daily_messages WHERE id = $1 RETURNING id`,
      [id]
    );
    if (!del.rows.length) return res.status(500).json({ error: "Delete failed" });

    return res.json({ ok: true, id });
  } catch (e) {
    console.error("DELETE /api/reflections/messages/:id error:", e);
    return res.status(500).json({ error: "Delete failed" });
  }
});

export default router;