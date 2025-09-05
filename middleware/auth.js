import jwt from "jsonwebtoken";

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  console.log("AUTH HEADER RECEIVED:", authHeader);

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach useful info (id, username, role) to req.user
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    };

    next();
  } catch (err) {
    console.error("JWT verification error:", err.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}