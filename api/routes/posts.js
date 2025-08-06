import express from "express";
import { verifyToken } from "../../middleware/auth.js";
import {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost
} from "../../db/queries/posts.js";

const router = express.Router();

// Public routes
router.get("/", getAllPosts);
router.get("/:id", getPostById);

// Protected routes
router.post("/", verifyToken, createPost);
router.put("/:id", verifyToken, updatePost);
router.delete("/:id", verifyToken, deletePost);

export default router;