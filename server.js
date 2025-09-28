// server.js
import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";

import authRoutes from "./api/routes/auth.js";
import postsRoutes from "./api/routes/posts.js";
import commentsRoutes from "./api/routes/comments.js";
import sectionsRouter from "./api/routes/sections.js";
import reflectionsRouter from "./api/routes/reflections.js";
import usersRouter from "./api/routes/users.js";
import contactRouter from "./api/routes/contact.js";

import pool from "./db/index.js";

dotenv.config();

const app = express();

// CORS allowlist
const envOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const DEV_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

const ALLOWED_ORIGINS = [...new Set([...DEV_ORIGINS, ...envOrigins])];

// Middleware 
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: ${origin} not allowed`), false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

// REST Routes 
app.use("/api/auth", authRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/sections", sectionsRouter);
app.use("/api/reflections", reflectionsRouter);
app.use("/api/users", usersRouter);
app.use("/api/contact", contactRouter);

// Health/test route
app.get("/", (_req, res) => {
  res.json({ message: "Welcome to MyCopingMechanism API" });
});

// 404 for unknown API routes (keep after all routes)
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Basic error handler (returns JSON)
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err?.message || err);
  if (String(err?.message || "").startsWith("CORS:")) {
    return res.status(403).json({ error: err.message });
  }
  res.status(500).json({ error: "Server error" });
});

// HTTP + Socket.IO Server
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  path: "/socket.io",
  cors: {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error(`Socket.IO CORS: ${origin} not allowed`), false);
    },
    credentials: false,
  },
});

// REQUIRE A VALID JWT TO CONNECT 
io.use((socket, next) => { // Mandatory auth
  try {
    const token = socket.handshake?.auth?.token;
    if (!token) return next(new Error("Unauthorized")); // Block anonymous

    const secret = process.env.JWT_SECRET;
    if (!secret) return next(new Error("Missing JWT_SECRET"));

    const decoded = jwt.verify(token, secret);
    socket.user = { id: decoded.id, username: decoded.username, role: decoded.role };
    return next();
  } catch {
    return next(new Error("Unauthorized"));
  }
});

// Utility: get today's daily_id or null
async function getTodayDailyId() {
  const { rows } = await pool.query(
    `SELECT id FROM reflection_daily_prompts WHERE active_on = CURRENT_DATE`
  );
  return rows[0]?.id ?? null;
}

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id, `(user ${socket.user.id})`);

  socket.on("reflections:joinToday", async (_payload, ack) => {
    try {
      const dailyId = await getTodayDailyId();
      if (!dailyId) return ack?.({ ok: false, error: "No daily prompt" });
      socket.join(`daily_${dailyId}`);
      ack?.({ ok: true, dailyId });
    } catch (err) {
      console.error("joinToday error:", err);
      ack?.({ ok: false, error: "Server error" });
    }
  });

  // CREATE message — user is guaranteed present by io.use
  socket.on("reflections:messageToday", async (payload, ack) => {
    try {
      const content = String(payload?.content || "").trim();
      if (!content) return ack?.({ ok: false, error: "Empty message" });

      const dailyId = await getTodayDailyId();
      if (!dailyId) return ack?.({ ok: false, error: "No daily prompt" });

      const userId = socket.user.id;
      const username = socket.user.username;

      const ins = await pool.query(
        `INSERT INTO reflection_daily_messages (daily_id, user_id, username, content)
         VALUES ($1, $2, $3, $4)
         RETURNING id, user_id, username, content, created_at`,
        [dailyId, userId, username, content]
      );

      const msg = ins.rows[0];
      io.to(`daily_${dailyId}`).emit("reflections:message:new", msg);
      ack?.({ ok: true, message: msg });
    } catch (err) {
      console.error("messageToday error:", err);
      ack?.({ ok: false, error: "Server error" });
    }
  });

  // EDIT — owner or admin
  socket.on("reflections:message:update", async (payload, ack) => {
    try {
      const { id, content } = payload ?? {};
      if (!id || !String(content || "").trim()) {
        return ack?.({ ok: false, error: "Bad payload" });
      }

      const found = await pool.query(
        `SELECT id, daily_id, user_id FROM reflection_daily_messages WHERE id = $1`,
        [id]
      );
      if (!found.rows.length) return ack?.({ ok: false, error: "Not found" });

      const isOwner = found.rows[0].user_id === socket.user.id;
      const isAdmin = socket.user.role === "admin";
      if (!isOwner && !isAdmin) return ack?.({ ok: false, error: "Forbidden" });

      const updated = await pool.query(
        `UPDATE reflection_daily_messages
           SET content = $2
         WHERE id = $1
         RETURNING id, user_id, username, content, created_at`,
        [id, String(content).trim()]
      );
      if (!updated.rows.length) return ack?.({ ok: false, error: "Update failed" });

      const msg = updated.rows[0];
      io.to(`daily_${found.rows[0].daily_id}`).emit("reflections:message:updated", msg);
      ack?.({ ok: true, message: msg });
    } catch (e) {
      console.error("messageUpdate error:", e);
      ack?.({ ok: false, error: "Server error" });
    }
  });

  // DELETE — owner or admin
  socket.on("reflections:message:delete", async (payload, ack) => {
    try {
      const { id } = payload ?? {};
      if (!id) return ack?.({ ok: false, error: "Bad payload" });

      const found = await pool.query(
        `SELECT id, daily_id, user_id FROM reflection_daily_messages WHERE id = $1`,
        [id]
      );
      if (!found.rows.length) return ack?.({ ok: false, error: "Not found" });

      const isOwner = found.rows[0].user_id === socket.user.id;
      const isAdmin = socket.user.role === "admin";
      if (!isOwner && !isAdmin) return ack?.({ ok: false, error: "Forbidden" });

      await pool.query(`DELETE FROM reflection_daily_messages WHERE id = $1`, [id]);

      io.to(`daily_${found.rows[0].daily_id}`).emit("reflections:message:deleted", { id });
      ack?.({ ok: true, id });
    } catch (e) {
      console.error("messageDelete error:", e);
      ack?.({ ok: false, error: "Server error" });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", socket.id, reason);
  });
});

// Start server with auto-retry port
const DEFAULT_PORT = parseInt(process.env.PORT || "5050", 10);

function startServer(port) {
  server
    .listen(port)
    .on("listening", () => {
      console.log(`Server running on http://localhost:${port}`);
      console.log("CORS allowed origins:", ALLOWED_ORIGINS.join(", ") || "(none)");
    })
    .on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        const next = port + 1;
        console.warn(`Port ${port} in use, trying ${next}...`);
        startServer(next);
      } else {
        console.error("Server failed to start:", err);
        process.exit(1);
      }
    });
}
startServer(DEFAULT_PORT);