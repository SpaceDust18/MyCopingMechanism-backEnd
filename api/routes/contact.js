// api/routes/contact.js
import express from "express";
import rateLimit from "express-rate-limit";
import pool from "../../db/index.js";
import { sendContactEmail } from "../../utils/mailer.js";

const router = express.Router();

// 10 requests per hour per IP
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
router.use(limiter);

function isValidEmail(v) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body || {};

    const trimmedName = (name || "").trim();
    const trimmedEmail = (email || "").trim();
    const trimmedMsg = (message || "").trim();

    if (!trimmedName || !trimmedEmail || !trimmedMsg) {
      return res.status(400).json({ error: "Name, email, and message are required." });
    }
    if (!isValidEmail(trimmedEmail)) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }
    if (trimmedName.length > 100) {
      return res.status(400).json({ error: "Name is too long." });
    }
    if (trimmedMsg.length > 10000) {
      return res.status(400).json({ error: "Message is too long." });
    }

    // meta
    const client_ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      null;
    const user_agent = req.get("user-agent") || null;

    // 1) store in DB
    const ins = await pool.query(
      `INSERT INTO contact_messages (name, email, message, client_ip, user_agent)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [trimmedName, trimmedEmail, trimmedMsg, client_ip, user_agent]
    );
    const row = ins.rows[0];

    // 2) notify owner AND (optionally) auto-reply to visitor (inside helper)
    try {
      await sendContactEmail({
        to: process.env.CONTACT_NOTIFY_TO || process.env.MAIL_USER, // owner inbox
        fromEmail: trimmedEmail, // visitor (used for Reply-To + confirmation)
        name: trimmedName,
        message: trimmedMsg,
      });
    } catch (e) {
      // Do not fail the whole request because of email issues
      console.error("sendContactEmail error:", e?.message || e);
    }

    return res.status(201).json({
      message: "Thanks! Your message was sent.",
      id: row.id,
      created_at: row.created_at,
    });
  } catch (e) {
    console.error("Contact submit error:", e);
    return res.status(500).json({ error: "Server error submitting contact form." });
  }
});

export default router;