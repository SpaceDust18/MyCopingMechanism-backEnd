import pool from "../index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Register a new user
export async function registerUser(req, res) {
  const { username, name, email, password } = req.body || {};

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const trimmedUsername = username.trim();

  try {
    // Case-insensitive duplicate check
    const dup = await pool.query(
      `SELECT 1
         FROM users
        WHERE LOWER(username) = LOWER($1)
           OR LOWER(email)    = LOWER($2)`,
      [trimmedUsername, normalizedEmail]
    );
    if (dup.rowCount > 0) {
      return res.status(409).json({ error: "Username or email already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user
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
    console.error("Error registering user:", err);
    return res.status(500).json({ error: "Server error during registration" });
  }
}

// Login user
export async function loginUser(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    const q = await pool.query(
      `SELECT id, username, name, email, role, password
         FROM users
        WHERE LOWER(email) = LOWER($1)`,
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

// Get current logged-in user
export async function getMe(req, res) {
  try {
    // req.user is set by your verifyToken middleware
    const q = await pool.query(
      `SELECT id, username, name, email, role, created_at, updated_at
         FROM users
        WHERE id = $1`,
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