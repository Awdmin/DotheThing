import { Router } from "express";
import { Project, Column, Card } from "../models/index.js";

export const projectRoutes = Router();

const DEFAULT_COLUMNS = [
  { name: "Backlog", color: "#94a3b8" },
  { name: "In Progress", color: "#6366f1" },
  { name: "Review", color: "#f59e0b" },
  { name: "Done", color: "#22c55e" },
];

// GET all projects
projectRoutes.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET single project with columns and cards
projectRoutes.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Not found" });

    const columns = await Column.find({ projectId: project._id });
    const cards = await Card.find({ projectId: project._id });

    // Map cards into columns
    const columnsWithCards = columns.map((col) => ({
      ...col.toObject(),
      cards: cards
        .filter((c) => c.columnId.toString() === col._id.toString())
        .sort((a, b) => a.position - b.position),
    }));

    // Apply custom column order if it exists
    const ordered =
      project.columnOrder?.length > 0
        ? project.columnOrder
            .map((id) => columnsWithCards.find((c) => c._id.toString() === id))
            .filter(Boolean)
        : columnsWithCards;

    res.json({ project: project.toObject(), columns: ordered });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST create project (auto-creates default columns)
projectRoutes.post("/", async (req, res) => {
  try {
    const { name, description, color, githubRepo, githubToken, members } = req.body;
    const project = await Project.create({ name, description, color, githubRepo, githubToken, members: members || [] });

    // Create default columns
    const columns = await Promise.all(
      DEFAULT_COLUMNS.map((col) => Column.create({ projectId: project._id, name: col.name, color: col.color }))
    );

    project.columnOrder = columns.map((c) => c._id.toString());
    await project.save();

    res.status(201).json(project);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PATCH update project
projectRoutes.patch("/:id", async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(project);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE project (cascade)
projectRoutes.delete("/:id", async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    await Column.deleteMany({ projectId: req.params.id });
    await Card.deleteMany({ projectId: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
