import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { projectRoutes } from "./routes/projects.js";
import { cardRoutes } from "./routes/cards.js";
import { githubRoutes } from "./routes/github.js";
import { columnRoutes } from "./routes/columns.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/dothetahing";

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true, ts: new Date() }));

// Routes
app.use("/api/projects", projectRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/columns", columnRoutes);
app.use("/api/github", githubRoutes);

// Connect to MongoDB and start
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`✅ Backend running on :${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
