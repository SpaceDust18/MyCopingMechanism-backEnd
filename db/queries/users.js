// db/queries/users.js
import pool from "../index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/** Register a new user */
export async function registerUser(req, res) {
  const { username, name, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const trimmedUsername = username.trim();

  try {
    const dup = await pool.query(
      `SELECT 1 FROM users
       WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)`,
      [trimmedUsername, normalizedEmail]
    );
    if (dup.rowCount > 0) {
      return res.status(409).json({ error: "Username or email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const insert = await pool.query(
      `INSERT INTO users (username, name, email, password, role)
       VALUES ($1, $2, $3, $4, 'user')
       RETURNING id, username, name, email, role, created_at`,
      [trimmedUsername, name?.trim() || null, normalizedEmail, hashedPassword]
    );

    return res.status(201).json({
      message: "User registered successfully",
      user: insert.rows[0],
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Username or email already in use" });
    }
    console.error("Error registering user:", err);
    return res.status(500).json({ error: "Server error during registration" });
  }
}

/** Login user */
export async function loginUser(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const q = await pool.query(
      `SELECT id, username, name, email, role, password
       FROM users WHERE LOWER(email) = LOWER($1)`,
      [normalizedEmail]
    );
    if (q.rowCount === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = q.rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Error logging in user:", err);
    return res.status(500).json({ error: "Server error during login" });
  }
}

/** Get current logged-in user */
export async function getMe(req, res) {
  try {
    const q = await pool.query(
      `SELECT id, username, name, email, role, created_at, updated_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (q.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(q.rows[0]);
  } catch (err) {
    console.error("Error fetching current user:", err);
    return res.status(500).json({ error: "Server error fetching current user" });
  }
}

/** Update current logged-in user */
export async function updateMe(req, res) {
  const { username, name } = req.body || {};
  try {
    const fields = [];
    const values = [];
    let i = 1;

    if (typeof username !== "undefined") {
      const trimmed = username.trim();

      // enforce simple handle rules: 3–32 chars, no spaces, only letters/numbers/._-
      if (!/^[a-zA-Z0-9._-]{3,32}$/.test(trimmed)) {
        return res.status(400).json({
          error:
            "Username must be 3–32 chars, letters/numbers/._- only (no spaces).",
        });
      }

      // check uniqueness
      const conflict = await pool.query(
        `SELECT 1 FROM users
         WHERE id <> $1 AND LOWER(username) = LOWER($2)`,
        [req.user.id, trimmed]
      );
      if (conflict.rowCount > 0) {
        return res.status(409).json({ error: "Username already in use" });
      }

      fields.push(`username = $${i++}`);
      values.push(trimmed);
    }

    if (typeof name !== "undefined") {
      fields.push(`name = $${i++}`);
      values.push(name?.trim() || null);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No changes provided" });
    }

    values.push(req.user.id);
    const sql = `UPDATE users SET ${fields.join(", ")}
                 WHERE id = $${i}
                 RETURNING id, username, name, email, role, created_at, updated_at`;
    const out = await pool.query(sql, values);

    return res.json(out.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Username already in use" });
    }
    console.error("Error updating profile:", err);
    return res.status(500).json({ error: "Server error updating profile" });
  }
}