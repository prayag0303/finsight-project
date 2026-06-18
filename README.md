# FinSight — AI-Powered Personal Finance Intelligence Platform

> A production-grade SaaS fintech platform that acts as your AI-powered financial copilot.

## What is FinSight?

Most banking apps show you a list of transactions. FinSight gives you **intelligence**:

- **Where** is your money going (AI categorization with 85%+ accuracy)
- **Why** your spending changed (trend analysis and dynamic insights)
- **Which** subscriptions are quietly draining your wallet
- **Whether** any transaction looks suspicious (fraud detection)
- **How much** you could save (personalized savings recommendations)
- **Ask anything** about your finances (AI chatbot with function calling)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS, Recharts, React Query |
| Backend | Node.js, Express.js, Prisma ORM, JWT, bcrypt |
| Database | PostgreSQL (Supabase) |
| AI Service | Python, FastAPI, scikit-learn, Gemini 2.5 Flash |
| Deployment | Vercel (frontend), Render (backend + AI), Supabase (DB) |

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete system design.

## Project Structure

```
finsight/
├── frontend/       React + Vite SPA
├── backend/        Node.js + Express API
└── ai-service/     Python + FastAPI AI engine
```

## Modules

1. **Authentication** — JWT-based auth with bcrypt
2. **Transaction Management** — Manual entry + CSV upload (HDFC, SBI, ICICI, Axis, Kotak)
3. **AI Categorization** — 5-layer pipeline (Merchant Learning → Rules → ML → Gemini → Fallback)
4. **Dashboard** — KPIs, charts, dynamic insights
5. **Budget Planner** — Monthly category budgets with alerts
6. **Subscription Detector** — Auto-detects recurring expenses
7. **Fraud Detection** — Z-Score, Isolation Forest, duplicate detection
8. **Savings Engine** — Personalized saving recommendations
9. **Monthly Insights** — AI-generated financial reports
10. **Finance Chatbot** — Natural language queries with Gemini function calling

## Development Setup

See individual README files in each subdirectory after all phases are complete.

## Phases

- [x] Phase 1 — Architecture
- [ ] Phase 2 — Database Design
- [ ] Phase 3 — Backend Development
- [ ] Phase 4 — AI Service
- [ ] Phase 5 — Frontend
- [ ] Phase 6 — Deployment
