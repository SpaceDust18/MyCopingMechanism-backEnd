import pool from "../index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Register a new user
export async function registerUser(req, res, next) {
  const { username, email, password } = req.body;

  try {
    // Normalize email to lowercase for consistent future logins
    const normalizedEmail = email.trim().toLowerCase();

    // Check if username or email already exists
    const userCheck = await pool.query(
      "SELECT 1 FROM users WHERE email = $1 OR username = $2",
      [normalizedEmail, username.trim()]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: "Username or email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const newUser = await pool.query(
      `INSERT INTO users (username, email, password, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, username, email, role, created_at`,
      [username.trim(), normalizedEmail, hashedPassword]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: newUser.rows[0]
    });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
}

// Login user
export async function loginUser(req, res, next) {
  const { email, password } = req.body;

  try {
    const normalizedEmail = email.trim().toLowerCase();
    // Check if user exists
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1", [normalizedEmail]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Error logging in user:", err);
    res.status(500).json({ error: "Server error during login" });
  }
}