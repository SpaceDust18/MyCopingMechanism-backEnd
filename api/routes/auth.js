// api/routes/auth.js
import express from "express";
import { registerUser, loginUser } from "../../db/queries/users.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

export default router;