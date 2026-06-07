import { Router } from "express";
import { Column, Project, Card } from "../models/index.js";

export const columnRoutes = Router();

// POST create column
columnRoutes.post("/", async (req, res) => {
  try {
    const { projectId, name, color } = req.body;
    const col = await Column.create({ projectId, name, color: color || "#94a3b8" });

    // Add to project's columnOrder
    await Project.findByIdAndUpdate(projectId, { $push: { columnOrder: col._id.toString() } });

    res.status(201).json(col);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PATCH update column
columnRoutes.patch("/:id", async (req, res) => {
  try {
    const col = await Column.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(col);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE column (and its cards)
columnRoutes.delete("/:id", async (req, res) => {
  try {
    const col = await Column.findByIdAndDelete(req.params.id);
    if (col) {
      await Card.deleteMany({ columnId: col._id });
      await Project.findByIdAndUpdate(col.projectId, {
        $pull: { columnOrder: col._id.toString() },
      });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST reorder columns in a project
columnRoutes.post("/reorder", async (req, res) => {
  try {
    const { projectId, columnOrder } = req.body;
    await Project.findByIdAndUpdate(projectId, { columnOrder });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
