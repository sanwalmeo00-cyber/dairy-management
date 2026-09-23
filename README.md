# Dairy Management

Full-stack dairy management app with a separate Next.js frontend and TypeScript Express backend.

## Structure

```text
Dairy-management/
├── frontend/     # Next.js (App Router)
├── backend/      # Express + TypeScript + Prisma
├── package.json  # Root scripts
└── README.md
```

## Prerequisites

- [Bun](https://bun.sh) 1.3+
- PostgreSQL

## Setup

### 1. Install dependencies

```bash
bun run install:all
```

### 2. Environment

Copy example env files and fill in values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

**Backend** (`backend/.env`): set `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`.

**Frontend** (`frontend/.env.local`): set `NEXT_PUBLIC_API_URL` (safe for the browser only).

Do not commit real `.env` / `.env.local` files.

### 3. Database

```bash
cd backend
bunx prisma generate
bunx prisma migrate dev --name init
```

### 4. Run development

From the project root:

```bash
bun run dev
```

- Frontend: http://localhost:3000  
- Backend API: http://localhost:5000/api/v1  

## Backend request flow

```text
Request → Route → Middleware → Controller → Service → Prisma → Service → Controller → Response
```

API base path: `/api/v1/`

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Run frontend + backend |
| `bun run dev:backend` | Backend only |
| `bun run dev:frontend` | Frontend only |
| `bun run build` | Build both |
| `bun run lint` | Lint both |
