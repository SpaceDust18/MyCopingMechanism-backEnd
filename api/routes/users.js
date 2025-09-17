// api/routes/users.js
import express from "express";
import { getMe, updateMe } from "../../db/queries/users.js";
import { verifyToken } from "../../middleware/auth.js";

const router = express.Router();

// Get current user
router.get("/me", verifyToken, getMe);

// Update current user (name and/or username)
router.patch("/me", verifyToken, updateMe);

export default router;