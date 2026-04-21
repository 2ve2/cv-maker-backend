# CV Maker Backend

A minimal, open-source backend API for creating and managing CV/Resume projects. Built with Bun, Hono, and PostgreSQL — no authentication required.

> **Frontend Repository:** [cv-maker-frontend](https://github.com/2ve2/cv-maker-frontend)

## ✨ Features

- 📄 **CRUD Projects** — Create, read, list, and search CV projects
- 🔍 **Search & Pagination** — Filter by title with cursor-free pagination
- 🛡️ **Rate Limiting** — Built-in rate limiting on API routes
- 🔒 **Security Headers** — Automatic security headers on all responses
- 📏 **Payload Limits** — Configurable request body size limits
- 🚫 **No Auth Required** — Fully open access, no sign-up needed
- ⚡ **Hot Reload** — Instant development feedback with Bun's `--hot`

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Bun** | JavaScript runtime & package manager |
| **Hono** | Fast web framework |
| **PostgreSQL (Neon)** | Serverless database |
| **Drizzle ORM** | Type-safe database queries |
| **Zod** | Request validation & schema parsing |
| **cuid2** | Collision-resistant unique IDs |

## 📋 Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- A [PostgreSQL](https://www.postgresql.org/) database ([Neon](https://neon.tech/) recommended)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/2ve2/cv-maker-backend.git
cd cv-maker-backend
```

### 2. Install dependencies

```bash
bun install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

> 💡 **Tip:** If using [Neon](https://neon.tech/), copy the connection string from your Neon dashboard.

### 4. Push the database schema

```bash
bun run db:push
```

### 5. Start the development server

```bash
bun run dev
```

The API will be available at `http://localhost:3000`.

## 📜 Available Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start development server with hot reload |
| `bun run start` | Start production server |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate` | Run Drizzle migrations |
| `bun run db:push` | Push schema directly to database |
| `bun run db:studio` | Open Drizzle Studio (database GUI) |

## 🔌 API Endpoints

All project routes are prefixed with `/api/projects`.

### Health Check

```
GET /
```

Returns API status and current timestamp.

### Create a Project

```
POST /api/projects
```

**Request Body:**

```json
{
  "title": "My Resume",
  "content": { "name": "John Doe", "experience": [] }
}
```

| Field | Type | Rules |
|---|---|---|
| `title` | `string` | Required, 1–255 characters |
| `content` | `object` | Required, any JSON object |

### List Projects

```
GET /api/projects
```

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | number (1–100) | `10` | Max projects to return |
| `offset` | number (≥ 0) | `0` | Pagination offset |
| `order` | `"asc"` \| `"desc"` | `"desc"` | Order by creation date |
| `qTitle` | string | — | Search by title (case-insensitive) |

### Get a Single Project

```
GET /api/projects/:id
```

Returns a project by its unique ID (cuid2).

### Standard Response Format

```ts
// Success
{
  "status": true,
  "message": "Optional message",
  "result": { ... }
}

// Error
{
  "status": false,
  "error": "Human-readable error message",
  "code": "NOT_FOUND | VALIDATION_ERROR | INTERNAL_ERROR"
}
```

## 📁 Project Structure

```
src/
├── app.ts                        # Hono app entry point with middleware & routes
├── config/
│   └── env.ts                    # Zod-validated environment config
├── db/
│   ├── index.ts                  # Database connection (Neon serverless)
│   ├── migrations/               # Drizzle migration files
│   └── schema/
│       └── project.ts            # Project table schema definition
├── lib/
│   └── response-helpers.ts       # Standardized JSON response utilities
├── middleware/
│   ├── rate-limit.ts             # Rate limiting middleware
│   ├── payload-limit.ts          # Request body size limiter
│   └── security-headers.ts       # Security headers middleware
├── routes/
│   └── projects.ts               # Project route handlers
├── services/
│   └── projectService.ts         # Business logic & database queries
└── types/
    └── schemas.ts                # Zod validation schemas & types
```

## 🗄️ Database Schema

### `project`

| Column | Type | Description |
|---|---|---|
| `id` | `text` (PK) | Unique cuid2 identifier |
| `title` | `text` | Project title (1–255 chars) |
| `content` | `jsonb` | CV data as flexible JSON |
| `created_at` | `timestamp` | Auto-set creation time |

**Indexes:** `idx_project_created_at`, `idx_project_title`

## 📄 License

MIT
