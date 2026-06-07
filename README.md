# DotheThing

Self-hosted project & bug tracker. One board per project. MongoDB backend. GitHub issues integration. Free drag-and-drop between any column.

## Stack

- **Frontend**: React + Vite + dnd-kit (drag & drop)
- **Backend**: Node.js + Express
- **Database**: MongoDB (via Mongoose)
- **Auth**: None (add your own reverse-proxy auth if needed)
- **GitHub**: PAT-based, per-project

---

## Quick Start (Docker)

```bash
git clone <your-repo>
cd dothetahing
docker compose up -d --build
```

Open **http://your-server:8080** — done.

---

## Using Your Own MongoDB

If you already have MongoDB running (CasaOS, Atlas, etc.):

1. Remove the `mongo` service from `docker-compose.yml`
2. Set `MONGO_URI` in the `backend` service:

```yaml
environment:
  MONGO_URI: mongodb://user:pass@your-mongo-host:27017/dothetahing
```

---

## GitHub Integration

Per-project. In **Project Settings**:

1. **Repository**: `owner/repo` (e.g. `awdmin/trips`)
2. **Token**: GitHub Personal Access Token with `repo` + `issues` scope

This lets you:
- Browse open/closed issues from the sidebar
- Import issues as cards (placed in the column you choose)
- Create GitHub issues from cards
- Issues link back to GitHub with #number

Tokens are stored in MongoDB. Use read-only tokens if you only need browsing.

---

## Development (without Docker)

```bash
# Start MongoDB locally or use Atlas

# Backend
cd backend
cp .env.example .env  # Edit MONGO_URI
npm install
npm run dev           # :3001

# Frontend
cd ../frontend
npm install
npm run dev           # :5173 → proxies /api to :3001
```

---

## Project Structure

```
dothetahing/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── models/index.js       # Project, Column, Card schemas
│       └── routes/
│           ├── projects.js
│           ├── columns.js
│           ├── cards.js
│           └── github.js
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── index.css
        ├── lib/api.js
        ├── components/
        │   ├── ui.jsx           # Design system
        │   ├── Board.jsx        # Drag-and-drop kanban
        │   ├── CardModal.jsx    # Card detail + edit
        │   └── GithubPanel.jsx  # Issue browser + importer
        └── pages/
            ├── HomePage.jsx     # Project list
            └── ProjectPage.jsx  # Board view
```

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/projects | List all projects |
| POST | /api/projects | Create project (auto-creates 4 columns) |
| GET | /api/projects/:id | Get project with columns + cards |
| PATCH | /api/projects/:id | Update project settings |
| DELETE | /api/projects/:id | Delete project + cascade |
| POST | /api/cards | Create card |
| PATCH | /api/cards/:id | Update card |
| POST | /api/cards/move | Move card to column + position |
| DELETE | /api/cards/:id | Delete card |
| POST | /api/columns | Add column to project |
| DELETE | /api/columns/:id | Delete column + its cards |
| GET | /api/github/:projectId/issues | List GitHub issues |
| POST | /api/github/:projectId/issues | Create GitHub issue |
| POST | /api/github/:projectId/import | Import issues as cards |

---

