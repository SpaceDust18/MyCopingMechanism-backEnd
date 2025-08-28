import express, { application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./api/routes/auth.js";
import postsRoutes from "./api/routes/posts.js";
import commentsRoutes from "./api/routes/comments.js";
import sectionsRouter from "./api/routes/sections.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON request bodies

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/sections", sectionsRouter);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to MyCopingMechanism API" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});