// api/routes/posts.js
import express from "express";
import { verifyToken } from "../../middleware/auth.js";
import {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
} from "../../db/queries/posts.js";

const router = express.Router();

/** Require admin role for mutating routes */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

/** Validate numeric :id (kept here to avoid inline regex in the path) */
router.param("id", (req, res, next, id) => {
  const num = Number(id);
  if (!Number.isInteger(num) || num <= 0) {
    return res.status(400).json({ error: "Invalid post id" });
  }
  next();
});

// ---------- Public ----------
router.get("/", getAllPosts);
router.get("/:id", getPostById);

// ---------- Protected (admin only) ----------
router.post("/", verifyToken, requireAdmin, createPost);
router.put("/:id", verifyToken, requireAdmin, updatePost);
// Optional PATCH, if your controller supports partial updates
router.patch("/:id", verifyToken, requireAdmin, updatePost);
router.delete("/:id", verifyToken, requireAdmin, deletePost);

export default router;