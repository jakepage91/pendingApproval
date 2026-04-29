# pendingApproval

A lightweight internal tool for submitting decisions, approvals, and questions to your manager — with a Linear-style triage board.

## Users
- **Team**: Jake, Arsh, Ioana — submit requests, view status, and close their own items
- **Manager**: Lorena — triage, respond, and move items through the pipeline

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the fallback port shown in terminal if `3000` is already in use).

The database is SQLite (file: `dev.db` in project root). The first page load seeds 3 demo items automatically.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page — choose Team Portal or Lorena's Board |
| `/login` | Login page |
| `/team` | Team portal — submit and track requests |
| `/manager` | Manager board — triage, respond, change status |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘N` | Open New Request form (Team portal) |
| `Escape` | Close detail panel or modal |

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Prisma + SQLite
