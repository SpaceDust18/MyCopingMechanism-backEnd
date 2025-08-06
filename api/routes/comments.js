import express from "express";
import { verifyToken } from "../../middleware/auth.js";
import {
  getCommentsByPost,
  addComment,
  deleteComment
} from "../../db/queries/comments.js";

const router = express.Router();

// Public: Get comments for a post
router.get("/post/:postId", getCommentsByPost);

// Protected: Add or delete a comment
router.post("/post/:postId", verifyToken, addComment);
router.delete("/:id", verifyToken, deleteComment);

export default router;