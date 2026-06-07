import React, { useEffect, useRef } from "react";

// ─── PRIORITY CONFIG ──────────────────────────────────────────────────────────
export const PRIORITY = {
  critical: { label: "Critical", color: "var(--rose)", bg: "var(--rose-light)", dot: "#f43f5e" },
  high:     { label: "High",     color: "#dc6803",    bg: "#fffaeb",            dot: "#f59e0b" },
  medium:   { label: "Medium",   color: "var(--indigo)", bg: "var(--indigo-light)", dot: "#5b5bd6" },
  low:      { label: "Low",      color: "var(--text-2)", bg: "var(--surface-2)",   dot: "#94a3b8" },
};

export const TYPE = {
  bug:     { label: "Bug",     color: "var(--rose)",    bg: "var(--rose-light)",    emoji: "🐛" },
  feature: { label: "Feature", color: "var(--emerald)", bg: "var(--emerald-light)", emoji: "✨" },
  task:    { label: "Task",    color: "var(--indigo)",  bg: "var(--indigo-light)",  emoji: "✓" },
  chore:   { label: "Chore",   color: "var(--text-2)",  bg: "var(--surface-2)",     emoji: "⚙" },
};

// ─── BADGE ────────────────────────────────────────────────────────────────────
export function Badge({ type = "priority", value, size = "sm" }) {
  const config = type === "priority" ? PRIORITY[value] : TYPE[value];
  if (!config) return null;
  const pad = size === "sm" ? "2px 7px" : "3px 10px";
  const fs = size === "sm" ? "0.7rem" : "0.75rem";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: pad, borderRadius: 99, fontSize: fs, fontWeight: 600,
      color: config.color, background: config.bg, letterSpacing: "0.01em",
      whiteSpace: "nowrap",
    }}>
      {type === "priority" && <span style={{ width: 5, height: 5, borderRadius: "50%", background: config.dot, flexShrink: 0 }} />}
      {type === "type" && <span>{config.emoji}</span>}
      {config.label}
    </span>
  );
}

// ─── BUTTON ───────────────────────────────────────────────────────────────────
export function Button({ children, variant = "primary", size = "md", onClick, disabled, style }) {
  const styles = {
    primary: { background: "var(--indigo)", color: "#fff", border: "none" },
    secondary: { background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" },
    ghost: { background: "transparent", color: "var(--text-2)", border: "none" },
    danger: { background: "var(--rose-light)", color: "var(--rose)", border: "1px solid rgba(244,63,94,0.2)" },
  };
  const sizes = {
    sm: { padding: "5px 12px", fontSize: "0.8rem", borderRadius: "var(--radius-sm)" },
    md: { padding: "8px 16px", fontSize: "0.875rem", borderRadius: "var(--radius-sm)" },
    lg: { padding: "10px 20px", fontSize: "0.95rem", borderRadius: "var(--radius)" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, whiteSpace: "nowrap", transition: "all 0.15s",
        ...styles[variant], ...sizes[size], ...style,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = "brightness(0.93)"; }}
      onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}
    >
      {children}
    </button>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 520 }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(26,25,23,0.4)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
    >
      <div
        className="modal-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)", borderRadius: 16,
          width: "100%", maxWidth: width, maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <span style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text)" }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", color: "var(--text-3)", cursor: "pointer",
              width: 28, height: 28, borderRadius: 6, display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: "1.1rem",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-2)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
          >×</button>
        </div>
        <div style={{ padding: 24, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

// ─── FORM FIELD ───────────────────────────────────────────────────────────────
export function Field({ label, children, style }) {
  return (
    <div style={{ marginBottom: 16, ...style }}>
      {label && <label style={{ display: "block", fontWeight: 500, fontSize: "0.8rem", color: "var(--text-2)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>}
      {children}
    </div>
  );
}

export function Input({ style, ...props }) {
  return (
    <input
      style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "0.9rem", ...style }}
      {...props}
    />
  );
}

export function Textarea({ style, ...props }) {
  return (
    <textarea
      style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "0.9rem", resize: "vertical", minHeight: 80, ...style }}
      {...props}
    />
  );
}

export function Select({ style, children, ...props }) {
  return (
    <select
      style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "0.9rem", ...style }}
      {...props}
    >
      {children}
    </select>
  );
}

// ─── SPINNER ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = "var(--indigo)" }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `2px solid transparent`,
      borderTopColor: color,
      animation: "spin 0.7s linear infinite",
      display: "inline-block",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── AVATAR ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ["#5b5bd6","#f43f5e","#10b981","#f59e0b","#0ea5e9","#8b5cf6"];
export function Avatar({ name, size = 28 }) {
  if (!name) return null;
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: AVATAR_COLORS[i], color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 700, letterSpacing: 0,
    }}>
      {name[0].toUpperCase()}
    </div>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
export function Empty({ icon, title, subtitle, action }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "48px 24px", textAlign: "center" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: 4 }}>{icon}</div>
      <div style={{ fontWeight: 600, color: "var(--text)" }}>{title}</div>
      {subtitle && <div style={{ fontSize: "0.875rem", color: "var(--text-2)", maxWidth: 280 }}>{subtitle}</div>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
