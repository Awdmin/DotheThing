import { Router } from "express";
import { Card, Column } from "../models/index.js";

export const cardRoutes = Router();

// GET cards for a project
cardRoutes.get("/project/:projectId", async (req, res) => {
  try {
    const cards = await Card.find({ projectId: req.params.projectId }).sort({ position: 1 });
    res.json(cards);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST create card
cardRoutes.post("/", async (req, res) => {
  try {
    const { projectId, columnId, title, description, priority, type, assignee, tags, dueDate } = req.body;

    // Find max position in this column
    const maxPos = await Card.find({ columnId }).sort({ position: -1 }).limit(1);
    const position = maxPos.length > 0 ? maxPos[0].position + 1 : 0;

    const card = await Card.create({ projectId, columnId, title, description, priority, type, assignee, tags, dueDate, position });
    res.status(201).json(card);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PATCH update card
cardRoutes.patch("/:id", async (req, res) => {
  try {
    const card = await Card.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(card);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST move card (change column + reorder)
// Body: { cardId, toColumnId, toIndex }
cardRoutes.post("/move", async (req, res) => {
  try {
    const { cardId, toColumnId, toIndex } = req.body;

    const card = await Card.findById(cardId);
    if (!card) return res.status(404).json({ error: "Card not found" });

    const fromColumnId = card.columnId.toString();
    const isMovingColumns = fromColumnId !== toColumnId;

    // Get all cards in destination column (excluding the moving card)
    const destCards = await Card.find({
      columnId: toColumnId,
      _id: { $ne: cardId },
    }).sort({ position: 1 });

    // Insert at toIndex
    destCards.splice(toIndex, 0, card);

    // Reassign positions
    const updates = destCards.map((c, i) =>
      Card.findByIdAndUpdate(c._id, { position: i, columnId: toColumnId })
    );
    await Promise.all(updates);

    // Update the moved card's columnId
    await Card.findByIdAndUpdate(cardId, { columnId: toColumnId, position: toIndex });

    // Re-normalize source column if different
    if (isMovingColumns) {
      const srcCards = await Card.find({ columnId: fromColumnId }).sort({ position: 1 });
      await Promise.all(srcCards.map((c, i) => Card.findByIdAndUpdate(c._id, { position: i })));
    }

    const updated = await Card.findById(cardId);
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE card
cardRoutes.delete("/:id", async (req, res) => {
  try {
    await Card.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
