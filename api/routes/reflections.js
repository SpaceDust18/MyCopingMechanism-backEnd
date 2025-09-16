// api/routes/reflections.js
import { Router } from "express";
import pool from "../../db/index.js"; 

const router = Router();

/** Ensure today's daily prompt exists; create one if missing by choosing a random active prompt */
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
      // If no daily prompt yet, return empty list (the /today endpoint will create one on fetch)
      return res.json([]);
    }
    const dailyId = today.rows[0].id;

    const rows = await pool.query(
      `SELECT id, username, content, created_at
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

export default router;