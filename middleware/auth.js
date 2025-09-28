// middleware/verifyToken.js
import jwt from "jsonwebtoken";

/**
 * Verifies a Bearer JWT in the Authorization header.
 * - Expects: Authorization: Bearer <token>
 * - On success, sets req.user = { id, username, role }
 * - On failure, responds with 401 (missing) or 403 (invalid/expired)
 */
export function verifyToken(req, res, next) {
  const authHeader = (req.headers.authorization || "").trim();

  if (!authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.slice(7);

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT verification error: missing JWT_SECRET in environment.");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = { id: decoded.id, username: decoded.username, role: decoded.role };
    return next();
  } catch (err) {
    console.error("JWT verification error:", err.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}