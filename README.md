# 🚀 TaskFlow — Full-Stack Project & Kanban SaaS Platform

**TaskFlow** is a modern, high-performance full-stack SaaS platform designed for seamless project management and team workflow tracking. Built with **Next.js (App Router)** and **FastAPI**, it provides a complete 4-stage Kanban workflow, secure user-scoped data isolation, interactive analytics, and productivity utilities—backed by persistent **Neon PostgreSQL** storage.

---

## ✨ Key Features

- 🔒 **Secure Authentication & Data Isolation:** JWT (`HS256`) authentication with strict `user_id` ownership verification to ensure users only manage their own workspace data.
- 📋 **4-Stage Kanban Workflow:** Smoothly transition tasks through **`To Do` → `In Progress` → `Review` → `Done`** with real-time database updates.
- ⚡ **Productivity Suite:** 
  - Instant search across task titles, tags, assignees, and task IDs.
  - Priority-based filtering (`Low`, `Medium`, `High`) and multi-criteria sorting (`Newest`, `Due Date`, `Priority`).
  - Slide-over **Comments Drawer** for team collaboration per task.
  - 1-click **CSV Export** for workspace reporting.
- 📊 **Sprint Analytics & Dashboard:** Interactive charts showing project completion rates and task status distribution.
- 🎨 **UI/UX Polish:** Framer Motion animation, custom responsive layout, toast notifications, confirmation modals, and a custom **404 Page**.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js (App Router)
- **Styling & UI:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons & Polish:** Lucide Icons / Headless components

### Backend
- **Framework:** FastAPI (Python)
- **ORM & Validation:** SQLAlchemy, Pydantic (supporting 4-stage status validation)
- **Authentication:** PyJWT (`HS256`), Passlib / Bcrypt hashing
- **Database:** Neon PostgreSQL (Cloud Driver: `psycopg2` / `asyncpg`)

---

## 📁 Project Structure

```text
taskflow/
├── backend/
│   ├── main.py              # FastAPI entry point, auth routes, task API endpoints
│   ├── models.py            # SQLAlchemy models (User, Task, Comment, Project)
│   ├── schemas.py           # Pydantic validation schemas
│   ├── database.py          # Neon PostgreSQL engine connection setup
│   └── requirements.txt     # Python dependencies
│
├── frontend/
│   ├── app/                 # Next.js App Router pages (auth, dashboard, board, settings)
│   ├── components/          # Reusable UI components (Kanban card, drawer, charts, toasts)
│   ├── lib/                 # API client, Auth context, types, & utility functions
│   └── package.json         # Node.js dependencies
│
└── README.md