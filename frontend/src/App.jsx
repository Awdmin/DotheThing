import React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { HomePage } from "./pages/HomePage.jsx";
import { ProjectPage } from "./pages/ProjectPage.jsx";

function Nav() {
  const loc = useLocation();
  const isHome = loc.pathname === "/";
  return (
    <div style={{
      height: 52, flexShrink: 0, background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center", padding: "0 24px", gap: 16,
    }}>
      <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: "var(--text)", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "0.65rem", fontWeight: 800,
          color: "var(--surface)", letterSpacing: "0.02em", flexShrink: 0,
        }}>DtTh</div>
        <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text)", letterSpacing: "-0.01em" }}>DotheThing</span>
      </Link>

      {!isHome && (
        <Link to="/" style={{ textDecoration: "none", fontSize: "0.82rem", color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
          ← Projects
        </Link>
      )}

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981" }} />
        <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>Connected</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/project/:id" element={<ProjectPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
