import mongoose from "mongoose";

// ─── PROJECT ──────────────────────────────────────────────────────────────────
const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    color: { type: String, default: "#6366f1" },
    githubRepo: { type: String, default: "" }, // owner/repo format
    githubToken: { type: String, default: "" }, // stored per-project
    members: [{ type: String }],
    columnOrder: [{ type: String }], // ordered column IDs
  },
  { timestamps: true }
);

// ─── COLUMN ───────────────────────────────────────────────────────────────────
const columnSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    name: { type: String, required: true },
    color: { type: String, default: "#94a3b8" },
    cardOrder: [{ type: String }], // ordered card IDs within this column
  },
  { timestamps: true }
);

// ─── CARD ─────────────────────────────────────────────────────────────────────
const cardSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    columnId: { type: mongoose.Schema.Types.ObjectId, ref: "Column", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    priority: { type: String, enum: ["critical", "high", "medium", "low"], default: "medium" },
    type: { type: String, enum: ["bug", "feature", "task", "chore"], default: "task" },
    assignee: { type: String, default: "" },
    tags: [{ type: String }],
    githubIssue: {
      number: Number,
      url: String,
      state: String,
      title: String,
    },
    dueDate: { type: Date, default: null },
    position: { type: Number, default: 0 }, // for ordering within column
  },
  { timestamps: true }
);

export const Project = mongoose.model("Project", projectSchema);
export const Column = mongoose.model("Column", columnSchema);
export const Card = mongoose.model("Card", cardSchema);
