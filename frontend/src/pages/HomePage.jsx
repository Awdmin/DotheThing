import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Modal, Field, Input, Textarea, Spinner } from "../components/ui.jsx";
import { api } from "../lib/api.js";

const PRESET_COLORS = ["#5b5bd6","#f43f5e","#10b981","#f59e0b","#0ea5e9","#8b5cf6","#ec4899","#64748b"];

function CreateProject({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", description: "", githubRepo: "", githubToken: "", members: "", color: "#5b5bd6" });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const members = form.members ? form.members.split(",").map(m => m.trim()).filter(Boolean) : [];
      const project = await api.createProject({ ...form, members });
      onCreated(project);
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="New Project" width={460}>
      <form onSubmit={submit}>
        <Field label="Project Name">
          <Input autoFocus value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. TRIPS, LegalRadar…" />
        </Field>
        <Field label="Description">
          <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="What is this project about?" rows={2} />
        </Field>
        <Field label="Accent Color">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {PRESET_COLORS.map(c => (
              <button key={c} type="button" onClick={() => set("color", c)}
                style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: form.color === c ? "3px solid var(--text)" : "2px solid transparent", cursor: "pointer", transition: "all 0.15s" }} />
            ))}
          </div>
        </Field>
        <Field label="Team Members (comma-separated)">
          <Input value={form.members} onChange={e => set("members", e.target.value)} placeholder="Anže, Partner" />
        </Field>
        <details style={{ marginBottom: 16 }}>
          <summary style={{ fontSize: "0.85rem", color: "var(--text-2)", cursor: "pointer", userSelect: "none", marginBottom: 10 }}>GitHub integration (optional)</summary>
          <div style={{ paddingTop: 10 }}>
            <Field label="Repository (owner/repo)">
              <Input value={form.githubRepo} onChange={e => set("githubRepo", e.target.value)} placeholder="myorg/myrepo" />
            </Field>
            <Field label="Personal Access Token">
              <Input type="password" value={form.githubToken} onChange={e => set("githubToken", e.target.value)} placeholder="ghp_…" />
            </Field>
          </div>
        </details>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading || !form.name.trim()}>{loading ? "Creating…" : "Create Project"}</Button>
        </div>
      </form>
    </Modal>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 48px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
            <Spinner size={32} />
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                {projects.length} project{projects.length !== 1 ? "s" : ""}
              </span>
              <Button onClick={() => setCreating(true)}>+ New Project</Button>
            </div>

            {projects.length === 0 ? (
              <div style={{ textAlign: "center", paddingTop: 60 }}>
                <div style={{ fontSize: "3rem", marginBottom: 12 }}>📋</div>
                <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>No projects yet</div>
                <div style={{ color: "var(--text-2)", fontSize: "0.875rem", marginBottom: 20 }}>Create your first project to get started.</div>
                <Button onClick={() => setCreating(true)}>+ Create Project</Button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {projects.map(p => (
                  <div
                    key={p._id}
                    onClick={() => navigate(`/project/${p._id}`)}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                      padding: 24,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    {/* Color accent */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: p.color || "#5b5bd6", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }} />

                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "var(--radius)", background: (p.color || "#5b5bd6") + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                        {p.name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>{p.name}</div>
                        {p.description && <div style={{ fontSize: "0.8rem", color: "var(--text-2)", marginTop: 2, lineHeight: 1.4 }}>{p.description}</div>}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                      {p.githubRepo && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "var(--text-3)" }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                          {p.githubRepo}
                        </div>
                      )}
                      {p.members?.length > 0 && (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-3)", marginLeft: "auto" }}>
                          {p.members.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {creating && (
        <CreateProject
          onClose={() => setCreating(false)}
          onCreated={(p) => { setProjects(prev => [p, ...prev]); setCreating(false); navigate(`/project/${p._id}`); }}
        />
      )}
    </div>
  );
}
