import { Router } from "express";
import fetch from "node-fetch";
import { Project, Card } from "../models/index.js";

export const githubRoutes = Router();

// Helper: GitHub API call
async function gh(token, path, options = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error ${res.status}`);
  }
  return res.json();
}

// GET /api/github/:projectId/issues - fetch open issues from GitHub
githubRoutes.get("/:projectId/issues", async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project?.githubRepo || !project?.githubToken) {
      return res.status(400).json({ error: "GitHub not configured for this project" });
    }

    const { state = "open", per_page = 30, page = 1 } = req.query;
    const issues = await gh(
      project.githubToken,
      `/repos/${project.githubRepo}/issues?state=${state}&per_page=${per_page}&page=${page}&filter=all`
    );

    // Filter out PRs (GitHub returns PRs in issues endpoint)
    const filtered = issues.filter((i) => !i.pull_request);

    res.json(filtered.map((i) => ({
      number: i.number,
      title: i.title,
      url: i.html_url,
      state: i.state,
      labels: i.labels.map((l) => l.name),
      assignee: i.assignee?.login || "",
      body: i.body || "",
      createdAt: i.created_at,
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/github/:projectId/issues - create a new GitHub issue and optionally link to a card
githubRoutes.post("/:projectId/issues", async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project?.githubRepo || !project?.githubToken) {
      return res.status(400).json({ error: "GitHub not configured for this project" });
    }

    const { title, body, labels, cardId } = req.body;
    const issue = await gh(project.githubToken, `/repos/${project.githubRepo}/issues`, {
      method: "POST",
      body: { title, body: body || "", labels: labels || [] },
    });

    // Link the issue to a card if cardId provided
    if (cardId) {
      await Card.findByIdAndUpdate(cardId, {
        githubIssue: {
          number: issue.number,
          url: issue.html_url,
          state: issue.state,
          title: issue.title,
        },
      });
    }

    res.status(201).json({
      number: issue.number,
      url: issue.html_url,
      state: issue.state,
      title: issue.title,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/github/:projectId/import - import GitHub issues as cards into a column
githubRoutes.post("/:projectId/import", async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project?.githubRepo || !project?.githubToken) {
      return res.status(400).json({ error: "GitHub not configured" });
    }

    const { issueNumbers, columnId } = req.body;
    const created = [];

    for (const num of issueNumbers) {
      const issue = await gh(project.githubToken, `/repos/${project.githubRepo}/issues/${num}`);
      const maxPos = await Card.find({ columnId }).sort({ position: -1 }).limit(1);
      const position = maxPos.length > 0 ? maxPos[0].position + 1 : 0;

      const card = await Card.create({
        projectId: project._id,
        columnId,
        title: issue.title,
        description: issue.body || "",
        type: "bug",
        tags: issue.labels.map((l) => l.name),
        position,
        githubIssue: {
          number: issue.number,
          url: issue.html_url,
          state: issue.state,
          title: issue.title,
        },
      });
      created.push(card);
    }

    res.json(created);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/github/:projectId/issues/:number - update issue state (close/reopen)
githubRoutes.patch("/:projectId/issues/:number", async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project?.githubRepo || !project?.githubToken) {
      return res.status(400).json({ error: "GitHub not configured" });
    }

    const { state } = req.body; // "open" or "closed"
    const issue = await gh(
      project.githubToken,
      `/repos/${project.githubRepo}/issues/${req.params.number}`,
      { method: "PATCH", body: { state } }
    );

    res.json({ number: issue.number, state: issue.state });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
