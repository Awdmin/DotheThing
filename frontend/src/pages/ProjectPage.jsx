import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Board } from "../components/Board.jsx";
import { GithubPanel } from "../components/GithubPanel.jsx";
import { Button, Spinner, Modal, Field, Input, Textarea, Badge } from "../components/ui.jsx";
import { api } from "../lib/api.js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const PRIORITY_COLOR = { critical: "#f43f5e", high: "#f59e0b", medium: "#5b5bd6", low: "#94a3b8" };
const STATUS_COLOR  = { "Backlog": "#94a3b8", "In Progress": "#5b5bd6", "Review": "#f59e0b", "Done": "#10b981" };

// ─── SETTINGS MODAL ──────────────────────────────────────────────────────────
function ProjectSettings({ project, onClose, onUpdated, onDeleted }) {
  const [form, setForm] = useState({
    name: project.name,
    description: project.description || "",
    githubRepo: project.githubRepo || "",
    githubToken: project.githubToken || "",
    members: (project.members || []).join(", "),
    color: project.color || "#5b5bd6",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      const members = form.members ? form.members.split(",").map(m => m.trim()).filter(Boolean) : [];
      const updated = await api.updateProject(project._id, { ...form, members });
      onUpdated(updated);
      onClose();
    } catch (e) { alert("Save failed: " + e.message); }
    finally { setSaving(false); }
  }

  async function del() {
    if (!confirm(`Delete project "${project.name}" and all its cards? This cannot be undone.`)) return;
    await api.deleteProject(project._id);
    onDeleted();
  }

  return (
    <Modal open onClose={onClose} title="Project Settings" width={500}>
      <Field label="Name"><Input value={form.name} onChange={e => set("name", e.target.value)} /></Field>
      <Field label="Description"><Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} /></Field>
      <Field label="Accent Color">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="color" value={form.color} onChange={e => set("color", e.target.value)}
            style={{ width: 40, height: 36, padding: 2, border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer" }} />
          <Input value={form.color} onChange={e => set("color", e.target.value)} style={{ flex: 1 }} />
        </div>
      </Field>
      <Field label="Team Members (comma-separated)">
        <Input value={form.members} onChange={e => set("members", e.target.value)} placeholder="Anže, Partner" />
      </Field>

      {/* GitHub section */}
      <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
          GitHub Integration
        </div>
        <div style={{ fontSize: "0.78rem", color: "var(--text-2)", marginBottom: 12, lineHeight: 1.5 }}>
          To create issues from cards you need a <strong>Fine-grained PAT</strong> (not classic):<br />
          GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate.<br />
          Set <em>Repository access</em> to your repo, then under <em>Permissions → Repository → Issues</em> set <strong>Read and write</strong>.
        </div>
        <Field label="Repository (owner/repo)">
          <Input value={form.githubRepo} onChange={e => set("githubRepo", e.target.value)} placeholder="myorg/myrepo" />
        </Field>
        <Field label="Fine-grained Personal Access Token" style={{ marginBottom: 0 }}>
          <Input type="password" value={form.githubToken} onChange={e => set("githubToken", e.target.value)} placeholder="github_pat_…" />
        </Field>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={del} style={{ marginLeft: "auto" }}>Delete Project</Button>
      </div>
    </Modal>
  );
}

// ─── LIST VIEW ────────────────────────────────────────────────────────────────
function ListView({ columns }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("updatedAt");
  const [sortDir, setSortDir] = useState(-1);
  const [filterPriority, setFilterPriority] = useState("");
  const [filterType, setFilterType] = useState("");

  const allCards = columns.flatMap(col =>
    col.cards.map(c => ({ ...c, columnName: col.name }))
  );

  const filtered = allCards
    .filter(c =>
      (!search || c.title.toLowerCase().includes(search.toLowerCase()) || (c.description || "").toLowerCase().includes(search.toLowerCase())) &&
      (!filterPriority || c.priority === filterPriority) &&
      (!filterType || c.type === filterType)
    )
    .sort((a, b) => {
      if (sortKey === "priority") {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return (order[a.priority] - order[b.priority]) * sortDir;
      }
      const av = a[sortKey] || "", bv = b[sortKey] || "";
      return av < bv ? -sortDir : sortDir;
    });

  const th = (label, key) => (
    <th onClick={() => { if (sortKey === key) setSortDir(d => -d); else { setSortKey(key); setSortDir(-1); } }}
      style={{ padding: "8px 14px", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: sortKey === key ? "var(--indigo)" : "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer", whiteSpace: "nowrap", borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
      {label}{sortKey === key ? (sortDir === 1 ? " ↑" : " ↓") : ""}
    </th>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexShrink: 0, flexWrap: "wrap" }}>
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cards…"
          style={{ width: 240, padding: "7px 12px" }} />
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: filterPriority ? "var(--text)" : "var(--text-3)", fontSize: "0.85rem" }}>
          <option value="">All priorities</option>
          {["critical","high","medium","low"].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: filterType ? "var(--text)" : "var(--text-3)", fontSize: "0.85rem" }}>
          <option value="">All types</option>
          {["bug","feature","task","chore"].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(search || filterPriority || filterType) && (
          <button onClick={() => { setSearch(""); setFilterPriority(""); setFilterType(""); }}
            style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 12px", fontSize: "0.8rem", color: "var(--text-2)", cursor: "pointer" }}>
            Clear
          </button>
        )}
        <span style={{ fontSize: "0.8rem", color: "var(--text-3)", alignSelf: "center", marginLeft: "auto" }}>{filtered.length} cards</span>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: "auto", borderRadius: 10, border: "1px solid var(--border)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{th("Title","title")}{th("Status","columnName")}{th("Priority","priority")}{th("Type","type")}{th("Assignee","assignee")}{th("Updated","updatedAt")}</tr>
          </thead>
          <tbody>
            {filtered.map(card => (
              <tr key={card._id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s", cursor: "default" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "10px 14px", fontSize: "0.875rem", fontWeight: 500, color: "var(--text)", maxWidth: 320 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {card.githubIssue && <svg width="11" height="11" viewBox="0 0 24 24" fill="var(--text-3)"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>}
                    {card.title}
                  </div>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.75rem", fontWeight: 600 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLOR[card.columnName] || "#94a3b8" }} />
                    {card.columnName}
                  </span>
                </td>
                <td style={{ padding: "10px 14px" }}><Badge type="priority" value={card.priority} size="sm" /></td>
                <td style={{ padding: "10px 14px" }}><Badge type="type" value={card.type} size="sm" /></td>
                <td style={{ padding: "10px 14px", fontSize: "0.82rem", color: "var(--text-2)" }}>{card.assignee || "—"}</td>
                <td style={{ padding: "10px 14px", fontSize: "0.78rem", color: "var(--text-3)", fontFamily: "monospace" }}>
                  {card.updatedAt ? new Date(card.updatedAt).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 24px", color: "var(--text-3)", fontSize: "0.875rem" }}>No cards match your filters.</div>
        )}
      </div>
    </div>
  );
}

// ─── REPORTS VIEW ─────────────────────────────────────────────────────────────
function ReportsView({ columns }) {
  const allCards = columns.flatMap(col => col.cards.map(c => ({ ...c, columnName: col.name })));
  const total = allCards.length;
  const open = allCards.filter(c => c.columnName !== "Done").length;
  const criticalOpen = allCards.filter(c => c.priority === "critical" && c.columnName !== "Done").length;
  const doneRate = total ? Math.round((allCards.filter(c => c.columnName === "Done").length / total) * 100) : 0;

  const statusData = columns.map(col => ({ name: col.name, count: col.cards.length, fill: STATUS_COLOR[col.name] || "#94a3b8" }));
  const priorityData = ["critical","high","medium","low"].map(p => ({ name: p, count: allCards.filter(c => c.priority === p).length, fill: PRIORITY_COLOR[p] }));
  const typeData = ["bug","feature","task","chore"].map(t => ({ name: t, count: allCards.filter(c => c.type === t).length }));

  const tStyle = { contentStyle: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, fontSize: "0.8rem", boxShadow: "var(--shadow)" }, labelStyle: { color: "var(--text-2)" }, itemStyle: { color: "var(--text)" } };
  const card = (label, value, sub, color) => (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px" }}>
      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: "2.2rem", fontWeight: 800, color: color || "var(--text)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
  const panel = (title, children) => (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ overflowY: "auto", height: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {card("Total", total)}
        {card("Open", open, null, "#5b5bd6")}
        {card("Critical open", criticalOpen, null, criticalOpen > 0 ? "#f43f5e" : "var(--text)")}
        {card("Done rate", `${doneRate}%`, `${total - open} of ${total} closed`, "#10b981")}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {panel("By Status",
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={statusData} barSize={32}>
              <XAxis dataKey="name" tick={{ fill: "var(--text-3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-3)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...tStyle} />
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {statusData.map(s => <Cell key={s.name} fill={s.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        {panel("By Priority",
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={priorityData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={72} innerRadius={36} paddingAngle={3}>
                {priorityData.map(p => <Cell key={p.name} fill={p.fill} />)}
              </Pie>
              <Tooltip {...tStyle} />
              <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "0.75rem", color: "var(--text-2)" }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      {panel("By Type",
        <div style={{ display: "flex", gap: 12 }}>
          {typeData.map(t => (
            <div key={t.name} style={{ flex: 1, textAlign: "center", background: "var(--surface-2)", borderRadius: 8, padding: "14px 8px" }}>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text)" }}>{t.count}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-3)", textTransform: "capitalize", marginTop: 2 }}>{t.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PROJECT PAGE ─────────────────────────────────────────────────────────────
export function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ghPanelOpen, setGhPanelOpen] = useState(false);
  const [tab, setTab] = useState("board");

  async function load() {
    setLoading(true);
    try {
      const d = await api.getProject(id);
      setData(d);
      setColumns(d.columns);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  function handleColumnsChange(updated) {
    setColumns(updated);
  }

  function handleImported(cards, columnId) {
    setColumns(prev => prev.map(col =>
      col._id === columnId ? { ...col, cards: [...col.cards, ...cards] } : col
    ));
    setGhPanelOpen(false);
  }

  if (loading) return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner size={32} /></div>;
  if (error) return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--rose)" }}>Error: {error}</div>;

  const { project } = data;
  const totalCards = columns.reduce((n, c) => n + c.cards.length, 0);

  const tabs = [
    { id: "board", label: "Board" },
    { id: "list", label: "List" },
    { id: "reports", label: "Reports" },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "0 24px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 14, flexShrink: 0, height: 52 }}>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: project.color, flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>{project.name}</span>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginLeft: 16 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: "6px 14px", background: tab === t.id ? "var(--indigo-light)" : "none", border: "none", borderRadius: 6, color: tab === t.id ? "var(--indigo)" : "var(--text-2)", cursor: "pointer", fontSize: "0.85rem", fontWeight: tab === t.id ? 600 : 400, transition: "all 0.15s" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          {/* Live column counters */}
          <div style={{ display: "flex", gap: 14, paddingRight: 14, borderRight: "1px solid var(--border)" }}>
            {columns.map(col => (
              <div key={col._id} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text)" }}>{col.cards.length}</div>
                <div style={{ fontSize: "0.6rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: 1 }}>{col.name}</div>
              </div>
            ))}
          </div>
          {project.githubRepo && (
            <Button variant="secondary" size="sm" onClick={() => setGhPanelOpen(v => !v)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              Issues
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>⚙</Button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, padding: "20px 24px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {tab === "board" && (
            <Board columns={columns} projectId={project._id} project={project} onColumnsChange={handleColumnsChange} />
          )}
          {tab === "list" && <ListView columns={columns} />}
          {tab === "reports" && <ReportsView columns={columns} />}
        </div>

        {ghPanelOpen && (
          <div style={{ width: 320, borderLeft: "1px solid var(--border)", background: "var(--surface)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
            <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>GitHub Issues</span>
              <button onClick={() => setGhPanelOpen(false)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: "1.1rem" }}>×</button>
            </div>
            <GithubPanel project={project} columns={columns} onImported={handleImported} />
          </div>
        )}
      </div>

      {settingsOpen && (
        <ProjectSettings project={project} onClose={() => setSettingsOpen(false)}
          onUpdated={updated => setData(d => ({ ...d, project: updated }))}
          onDeleted={() => navigate("/")} />
      )}
    </div>
  );
}
