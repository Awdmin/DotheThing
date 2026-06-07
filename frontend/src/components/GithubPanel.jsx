import React, { useState, useEffect } from "react";
import { Button, Spinner } from "./ui.jsx";
import { api } from "../lib/api.js";

export function GithubPanel({ project, columns, onImported }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [targetColumn, setTargetColumn] = useState(columns[0]?._id || "");
  const [importing, setImporting] = useState(false);
  const [filter, setFilter] = useState("open");

  const hasGithub = project?.githubRepo && project?.githubToken;

  async function load() {
    if (!hasGithub) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.getIssues(project._id, { state: filter });
      setIssues(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (hasGithub) load(); }, [project._id, filter]);

  async function importSelected() {
    if (!selected.size || !targetColumn) return;
    setImporting(true);
    try {
      const cards = await api.importIssues(project._id, {
        issueNumbers: [...selected],
        columnId: targetColumn,
      });
      onImported(cards, targetColumn);
      setSelected(new Set());
    } catch (e) {
      alert("Import failed: " + e.message);
    } finally {
      setImporting(false);
    }
  }

  const toggle = (num) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(num) ? next.delete(num) : next.add(num);
      return next;
    });
  };

  if (!hasGithub) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "var(--text-2)", fontSize: "0.875rem" }}>
        <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>🔌</div>
        GitHub not configured for this project.
        <br />Edit the project settings to add a repo and token.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text)", marginBottom: 10 }}>
          <span style={{ color: "var(--text-2)" }}>github.com /</span> {project.githubRepo}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["open", "closed"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              style={{
                padding: "4px 12px", borderRadius: 99, border: "1px solid",
                borderColor: filter === s ? "var(--indigo)" : "var(--border)",
                background: filter === s ? "var(--indigo-light)" : "var(--surface)",
                color: filter === s ? "var(--indigo)" : "var(--text-2)",
                fontSize: "0.78rem", fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
              }}>
              {s}
            </button>
          ))}
          <button onClick={load} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: "0.8rem" }}>↻ Refresh</button>
        </div>
      </div>

      {/* Issue list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
            <Spinner />
          </div>
        )}
        {error && <div style={{ padding: 16, color: "var(--rose)", fontSize: "0.85rem" }}>⚠ {error}</div>}
        {!loading && !error && issues.map((issue) => (
          <div
            key={issue.number}
            onClick={() => toggle(issue.number)}
            style={{
              display: "flex", gap: 10, alignItems: "flex-start",
              padding: "10px 8px", borderRadius: "var(--radius-sm)",
              cursor: "pointer", transition: "background 0.1s",
              background: selected.has(issue.number) ? "var(--indigo-light)" : "transparent",
              marginBottom: 2,
            }}
            onMouseEnter={e => { if (!selected.has(issue.number)) e.currentTarget.style.background = "var(--surface-2)"; }}
            onMouseLeave={e => { if (!selected.has(issue.number)) e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{
              width: 16, height: 16, borderRadius: 3, border: `2px solid`,
              borderColor: selected.has(issue.number) ? "var(--indigo)" : "var(--border-strong)",
              background: selected.has(issue.number) ? "var(--indigo)" : "transparent",
              flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              marginTop: 1, transition: "all 0.15s",
            }}>
              {selected.has(issue.number) && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.83rem", fontWeight: 500, color: "var(--text)", marginBottom: 3, lineHeight: 1.3 }}>
                #{issue.number} {issue.title}
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {issue.labels.map((l) => (
                  <span key={l} style={{ fontSize: "0.65rem", padding: "1px 5px", background: "var(--surface-2)", color: "var(--text-2)", borderRadius: 99, border: "1px solid var(--border)" }}>{l}</span>
                ))}
                {issue.assignee && <span style={{ fontSize: "0.65rem", color: "var(--text-3)" }}>@{issue.assignee}</span>}
              </div>
            </div>
          </div>
        ))}
        {!loading && !error && issues.length === 0 && (
          <div style={{ textAlign: "center", padding: 32, color: "var(--text-3)", fontSize: "0.875rem" }}>
            No {filter} issues found.
          </div>
        )}
      </div>

      {/* Import toolbar */}
      {selected.size > 0 && (
        <div style={{
          padding: "12px 16px", borderTop: "1px solid var(--border)", flexShrink: 0,
          background: "var(--surface)", display: "flex", gap: 8, alignItems: "center",
        }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-2)" }}>{selected.size} selected →</span>
          <select value={targetColumn} onChange={e => setTargetColumn(e.target.value)}
            style={{ flex: 1, padding: "6px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "0.82rem" }}>
            {columns.map((col) => <option key={col._id} value={col._id}>{col.name}</option>)}
          </select>
          <Button size="sm" onClick={importSelected} disabled={importing}>
            {importing ? "Importing…" : "Import"}
          </Button>
        </div>
      )}
    </div>
  );
}
