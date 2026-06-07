import React, { useState } from "react";
import { Modal, Button, Badge, Field, Input, Textarea, Select, Avatar } from "./ui.jsx";
import { api } from "../lib/api.js";

const PRIORITIES = ["critical", "high", "medium", "low"];
const TYPES = ["bug", "feature", "task", "chore"];

export function CardModal({ card, projectId, members, onClose, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: card.title,
    description: card.description || "",
    priority: card.priority,
    type: card.type,
    assignee: card.assignee || "",
    tags: (card.tags || []).join(", "),
    dueDate: card.dueDate ? card.dueDate.split("T")[0] : "",
  });
  const [loading, setLoading] = useState(false);
  const [creatingIssue, setCreatingIssue] = useState(false);
  const [ghLoading, setGhLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setLoading(true);
    try {
      const tags = form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
      const updated = await api.updateCard(card._id, { ...form, tags });
      onUpdated(updated);
      setEditing(false);
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function del() {
    if (!confirm("Delete this card?")) return;
    await api.deleteCard(card._id);
    onDeleted(card._id);
    onClose();
  }

  async function createGithubIssue() {
    setGhLoading(true);
    try {
      const issue = await api.createIssue(projectId, {
        title: card.title,
        body: card.description || "",
        labels: card.type === "bug" ? ["bug"] : [],
        cardId: card._id,
      });
      onUpdated({ ...card, githubIssue: issue });
      alert(`Issue #${issue.number} created on GitHub!`);
    } catch (e) {
      alert("GitHub error: " + e.message);
    } finally {
      setGhLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="" width={560}>
      <div>
        {/* Type + Priority row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
          <Badge type="type" value={editing ? form.type : card.type} />
          <Badge type="priority" value={editing ? form.priority : card.priority} />
          {card.githubIssue && (
            <a href={card.githubIssue.url} target="_blank" rel="noreferrer"
              style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: "0.78rem", color: "var(--text-2)", textDecoration: "none", padding: "3px 8px", background: "var(--surface-2)", borderRadius: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              #{card.githubIssue.number}
            </a>
          )}
        </div>

        {/* Title */}
        {editing ? (
          <Input value={form.title} onChange={(e) => set("title", e.target.value)}
            style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 16 }} />
        ) : (
          <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--text)", marginBottom: 16, lineHeight: 1.4 }}>{card.title}</h2>
        )}

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          {editing ? (
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Add a description…" style={{ minHeight: 100 }} />
          ) : (
            <div style={{
              fontSize: "0.875rem", color: card.description ? "var(--text)" : "var(--text-3)",
              background: "var(--surface-2)", borderRadius: "var(--radius-sm)",
              padding: "10px 12px", lineHeight: 1.6, minHeight: 60,
              whiteSpace: "pre-wrap",
            }}>
              {card.description || "No description."}
            </div>
          )}
        </div>

        {/* Metadata grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Type</div>
            {editing ? (
              <Select value={form.type} onChange={(e) => set("type", e.target.value)}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </Select>
            ) : <div style={{ fontSize: "0.875rem" }}>{card.type}</div>}
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Priority</div>
            {editing ? (
              <Select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </Select>
            ) : <div style={{ fontSize: "0.875rem", textTransform: "capitalize" }}>{card.priority}</div>}
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Assignee</div>
            {editing ? (
              <Input value={form.assignee} onChange={(e) => set("assignee", e.target.value)} placeholder="Name…" />
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.875rem" }}>
                {card.assignee ? <><Avatar name={card.assignee} size={20} />{card.assignee}</> : <span style={{ color: "var(--text-3)" }}>Unassigned</span>}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Due Date</div>
            {editing ? (
              <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            ) : <div style={{ fontSize: "0.875rem" }}>{card.dueDate ? new Date(card.dueDate).toLocaleDateString() : <span style={{ color: "var(--text-3)" }}>—</span>}</div>}
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Tags</div>
            {editing ? (
              <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="tag1, tag2…" />
            ) : (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {(card.tags || []).length > 0
                  ? card.tags.map((t) => (
                      <span key={t} style={{ fontSize: "0.75rem", padding: "2px 8px", background: "var(--indigo-light)", color: "var(--indigo)", borderRadius: 99, fontWeight: 500 }}>
                        {t}
                      </span>
                    ))
                  : <span style={{ color: "var(--text-3)", fontSize: "0.875rem" }}>—</span>
                }
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          {editing ? (
            <>
              <Button onClick={save} disabled={loading}>{loading ? "Saving…" : "Save changes"}</Button>
              <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            </>
          ) : (
            <>
              <Button onClick={() => setEditing(true)}>Edit</Button>
              {!card.githubIssue && (
                <Button variant="secondary" onClick={createGithubIssue} disabled={ghLoading}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                  {ghLoading ? "Creating…" : "Create GitHub Issue"}
                </Button>
              )}
            </>
          )}
          <Button variant="danger" onClick={del} style={{ marginLeft: "auto" }}>Delete</Button>
        </div>
      </div>
    </Modal>
  );
}
