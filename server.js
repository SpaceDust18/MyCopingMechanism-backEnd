// server.js
import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { Server as SocketIOServer } from "socket.io";

// REST route modules
import authRoutes from "./api/routes/auth.js";
import postsRoutes from "./api/routes/posts.js";
import commentsRoutes from "./api/routes/comments.js";
import sectionsRouter from "./api/routes/sections.js";
import reflectionsRouter from "./api/routes/reflections.js"; // <-- add this route

// DB pool (adjust the path if your pool is elsewhere)
import pool from "./db/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// ----- Middleware -----
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json());

// ----- REST Routes -----
app.use("/api/auth", authRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/sections", sectionsRouter);
app.use("/api/reflections", reflectionsRouter); // <-- reflections REST endpoints

// Health/test route
app.get("/", (_req, res) => {
  res.json({ message: "Welcome to MyCopingMechanism API" });
});

// ----- HTTP + Socket.IO Server -----
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "*",
    credentials: true,
  },
});

// Socket.IO events for the single daily reflections chat
io.on("connection", (socket) => {
  // Join the one shared room for today's prompt
  socket.on("reflections:joinToday", async (_payload, ack) => {
    try {
      const { rows } = await pool.query(
        `SELECT id FROM reflection_daily_prompts WHERE active_on = CURRENT_DATE`
      );
      if (!rows.length) {
        ack?.({ ok: false, error: "No daily prompt" });
        return;
      }
      const dailyId = rows[0].id;
      socket.join(`daily_${dailyId}`);
      ack?.({ ok: true, dailyId });
    } catch (err) {
      console.error("joinToday error:", err);
      ack?.({ ok: false, error: "Server error" });
    }
  });

  // Post a message to today's room and broadcast to all clients
  socket.on("reflections:messageToday", async (payload, ack) => {
    try {
      const { content, userId, username } = payload ?? {};
      if (!content?.trim()) {
        ack?.({ ok: false, error: "Empty message" });
        return;
      }

      const today = await pool.query(
        `SELECT id FROM reflection_daily_prompts WHERE active_on = CURRENT_DATE`
      );
      if (!today.rows.length) {
        ack?.({ ok: false, error: "No daily prompt" });
        return;
      }
      const dailyId = today.rows[0].id;

      const ins = await pool.query(
        `INSERT INTO reflection_daily_messages (daily_id, user_id, username, content)
         VALUES ($1, $2, $3, $4)
         RETURNING id, username, content, created_at`,
        [dailyId, userId ?? null, username ?? "Anonymous", content.trim()]
      );

      const msg = ins.rows[0];
      io.to(`daily_${dailyId}`).emit("reflections:message:new", msg);
      ack?.({ ok: true, message: msg });
    } catch (err) {
      console.error("messageToday error:", err);
      ack?.({ ok: false, error: "Server error" });
    }
  });
});

// ----- Start server -----
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});