const BASE = import.meta.env.VITE_API_URL || "";

async function req(method, path, body) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Projects
  getProjects: () => req("GET", "/projects"),
  getProject: (id) => req("GET", `/projects/${id}`),
  createProject: (data) => req("POST", "/projects", data),
  updateProject: (id, data) => req("PATCH", `/projects/${id}`, data),
  deleteProject: (id) => req("DELETE", `/projects/${id}`),

  // Columns
  createColumn: (data) => req("POST", "/columns", data),
  updateColumn: (id, data) => req("PATCH", `/columns/${id}`, data),
  deleteColumn: (id) => req("DELETE", `/columns/${id}`),
  reorderColumns: (projectId, columnOrder) => req("POST", "/columns/reorder", { projectId, columnOrder }),

  // Cards
  createCard: (data) => req("POST", "/cards", data),
  updateCard: (id, data) => req("PATCH", `/cards/${id}`, data),
  moveCard: (cardId, toColumnId, toIndex) => req("POST", "/cards/move", { cardId, toColumnId, toIndex }),
  deleteCard: (id) => req("DELETE", `/cards/${id}`),

  // GitHub
  getIssues: (projectId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req("GET", `/github/${projectId}/issues?${qs}`);
  },
  createIssue: (projectId, data) => req("POST", `/github/${projectId}/issues`, data),
  importIssues: (projectId, data) => req("POST", `/github/${projectId}/import`, data),
  updateIssue: (projectId, number, data) => req("PATCH", `/github/${projectId}/issues/${number}`, data),
};
