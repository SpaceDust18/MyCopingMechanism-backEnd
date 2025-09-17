// middleware/verifyToken.js
import jwt from "jsonwebtoken";

/**
 * Verifies a Bearer JWT in the Authorization header.
 * - Expects: Authorization: Bearer <token>
 * - On success, sets req.user = { id, username, role }
 * - On failure, responds with 401 (missing) or 403 (invalid/expired)
 */
export function verifyToken(req, res, next) {
  // Accept header in a resilient way
  const authHeader = (req.headers.authorization || "").trim();

  // Optional: allow reading from cookies if you later store tokens there
  // const tokenFromCookie = req.cookies?.token;

  if (!authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.slice(7); // after "Bearer "
  if (!token) {
    return res
      .status(401)
      .json({ error: "Access denied. No token provided." });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Fail fast if secret is misconfigured
    console.error(
      "JWT verification error: missing JWT_SECRET in environment."
    );
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const decoded = jwt.verify(token, secret);

    // Only expose what you need downstream
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    };

    return next();
  } catch (err) {
    // Token invalid or expired
    console.error("JWT verification error:", err.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}