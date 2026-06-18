# FinSight — System Architecture

## Table of Contents
1. [High-Level Design](#1-high-level-design)
2. [Low-Level Design](#2-low-level-design)
3. [Service Communication Flow](#3-service-communication-flow)
4. [Data Flow Diagrams](#4-data-flow-diagrams)
5. [AI Pipeline Architecture](#5-ai-pipeline-architecture)
6. [Database Architecture](#6-database-architecture)
7. [Security Architecture](#7-security-architecture)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Folder Structure](#9-folder-structure)
10. [Architecture Decisions](#10-architecture-decisions)

---

## 1. High-Level Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FINSIGHT PLATFORM                              │
│                                                                         │
│  ┌──────────────────┐         ┌──────────────────────────────────────┐  │
│  │                  │  REST   │                                      │  │
│  │  React Frontend  │◄───────►│     Node.js / Express Backend        │  │
│  │  (Vite + Tailwind│  JSON   │     (Auth, Transactions, Budgets,    │  │
│  │   Recharts)      │         │      Dashboard, CSV Upload)          │  │
│  │                  │         │                                      │  │
│  │  Hosted: Vercel  │         │  Hosted: Render                      │  │
│  └──────────────────┘         └──────────┬───────────────────────────┘  │
│                                          │                              │
│                          ┌───────────────┴──────────────┐              │
│                          │                              │              │
│                  ┌───────▼────────┐          ┌──────────▼──────────┐   │
│                  │                │  HTTP     │                     │   │
│                  │  PostgreSQL DB │  REST     │  Python FastAPI     │   │
│                  │  via Prisma    │◄─────────►│  AI Service         │   │
│                  │                │           │                     │   │
│                  │  Hosted:       │           │  Hosted: Render     │   │
│                  │  Supabase      │           └──────────┬──────────┘   │
│                  └────────────────┘                      │             │
│                                                          │             │
│                                      ┌───────────────────▼───────────┐ │
│                                      │  AI Engines                   │ │
│                                      │  ┌─────────────┐ ┌─────────┐  │ │
│                                      │  │ Rule Engine │ │   ML    │  │ │
│                                      │  │ (Keywords)  │ │ Model   │  │ │
│                                      │  └─────────────┘ └─────────┘  │ │
│                                      │  ┌─────────────┐ ┌─────────┐  │ │
│                                      │  │   Gemini    │ │Analytics│  │ │
│                                      │  │   2.5 Flash │ │ Engine  │  │ │
│                                      │  └─────────────┘ └─────────┘  │ │
│                                      └───────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tier Responsibilities

| Tier | Technology | Responsibility |
|------|-----------|---------------|
| Presentation | React + Vite | UI rendering, state, charts, forms |
| API Gateway | Express.js | Auth, routing, validation, orchestration |
| Persistence | PostgreSQL + Prisma | Structured data, relationships, indexes |
| Intelligence | FastAPI + Python | AI categorization, fraud, insights, chat |
| External AI | Gemini 2.5 Flash | NLP fallback classification, chatbot |

---

## 2. Low-Level Design

### 2.1 Express Backend — Internal Structure

```
server.js
└── app.js  (Express setup, middleware chain)
    ├── Middleware Stack
    │   ├── helmet()          → Security headers
    │   ├── cors()            → Cross-origin policy
    │   ├── express.json()    → Body parsing
    │   ├── rateLimiter       → Per-IP rate limiting
    │   ├── requestLogger     → Winston request logs
    │   └── authMiddleware    → JWT verification (route-level)
    │
    ├── Routes Layer
    │   ├── /auth             → auth.routes.js
    │   ├── /transactions     → transaction.routes.js
    │   ├── /dashboard        → dashboard.routes.js
    │   ├── /budgets          → budget.routes.js
    │   └── /ai               → ai.routes.js
    │
    ├── Controller Layer      (HTTP in/out only)
    │   ├── auth.controller.js
    │   ├── transaction.controller.js
    │   ├── dashboard.controller.js
    │   ├── budget.controller.js
    │   └── ai.controller.js
    │
    ├── Service Layer         (business logic)
    │   ├── auth.service.js
    │   ├── transaction.service.js
    │   ├── dashboard.service.js
    │   ├── budget.service.js
    │   ├── csv.service.js
    │   └── ai.service.js     (HTTP client to FastAPI)
    │
    └── Data Layer
        └── Prisma Client     (ORM → PostgreSQL)
```

### 2.2 FastAPI AI Service — Internal Structure

```
main.py
└── FastAPI app
    ├── Routers
    │   ├── /categorize       → Single & batch categorization
    │   ├── /chat             → Finance chatbot with function calling
    │   ├── /insights         → Monthly AI insights
    │   ├── /anomalies        → Fraud & anomaly detection
    │   ├── /subscriptions    → Subscription detection
    │   └── /savings          → Savings opportunity engine
    │
    └── Services
        ├── categorization/
        │   ├── merchant_learning.py   (Layer 1 — DB-cached corrections)
        │   ├── rule_engine.py         (Layer 2 — keyword rules)
        │   ├── ml_classifier.py       (Layer 3 — TF-IDF + Naive Bayes)
        │   └── gemini_classifier.py   (Layer 4 — Gemini 2.5 Flash API)
        │
        ├── anomaly_detection.py       (Z-Score + Isolation Forest)
        ├── subscription_detector.py   (CoV analysis)
        ├── savings_engine.py          (rule-based opportunities)
        ├── insights_generator.py      (Gemini monthly report)
        └── chat_service.py            (Gemini function calling)
```

### 2.3 React Frontend — Internal Structure

```
src/
├── main.jsx              → ReactDOM.createRoot, providers
├── App.jsx               → Router, route guards
│
├── context/
│   ├── AuthContext.jsx   → User session, JWT storage
│   └── ThemeContext.jsx  → Dark/light mode
│
├── services/             → Axios wrappers (one file per domain)
│   ├── api.js            → Axios instance, interceptors, token injection
│   ├── auth.service.js
│   ├── transaction.service.js
│   ├── dashboard.service.js
│   ├── budget.service.js
│   └── ai.service.js
│
├── hooks/                → React Query hooks (one per domain)
│   ├── useAuth.js
│   ├── useTransactions.js
│   ├── useDashboard.js
│   ├── useBudgets.js
│   └── useChat.js
│
├── pages/                → Route-level components
│   ├── auth/Login.jsx
│   ├── auth/Register.jsx
│   ├── Dashboard.jsx
│   ├── Transactions.jsx
│   ├── Budgets.jsx
│   ├── Subscriptions.jsx
│   ├── FraudAlerts.jsx
│   ├── Savings.jsx
│   ├── Insights.jsx
│   └── Chat.jsx
│
└── components/           → Reusable UI components
    ├── layout/           → Sidebar, TopNav, Layout wrapper
    ├── ui/               → Button, Card, Input, Modal, Badge, Skeleton
    ├── dashboard/        → KPICard, SpendingTrend, CategoryPie, etc.
    ├── transactions/     → TransactionTable, Filters, CSVUpload
    ├── budget/           → BudgetCard, BudgetForm
    ├── subscriptions/    → SubscriptionCard
    ├── fraud/            → FraudAlertCard
    └── chat/             → ChatInterface, ChatMessage, ChatInput
```

---

## 3. Service Communication Flow

### 3.1 Request Lifecycle

```
Browser
  │
  │  1. HTTP/HTTPS (REST JSON)
  ▼
Express Backend (Render)
  │
  ├── 2a. Prisma ORM (TCP) ──────────► Supabase PostgreSQL
  │         returns rows/objects ◄──────
  │
  └── 2b. axios.post() (HTTP REST) ───► FastAPI AI Service (Render)
              returns AI result ◄────────
                    │
                    └── 3. Google AI SDK (HTTPS) ──► Gemini 2.5 Flash
                                response ◄───────────
```

### 3.2 Communication Protocols

| Connection | Protocol | Format | Auth |
|-----------|---------|--------|------|
| Browser → Backend | HTTPS REST | JSON | Bearer JWT |
| Backend → Supabase | TCP (Prisma) | Binary Protocol | DB connection string |
| Backend → AI Service | HTTP REST | JSON | Shared API key (INTERNAL_API_KEY) |
| AI Service → Gemini | HTTPS | JSON | GEMINI_API_KEY |

### 3.3 CSV Upload Flow

```
User selects CSV
      │
      ▼
Frontend (FormData multipart)
      │
      ▼
POST /transactions/upload
      │
      ▼
multer middleware → /uploads/tmp/<uuid>.csv
      │
      ▼
csv.service.js → parse rows → normalize columns
      │
      ▼
POST /categorize/batch (FastAPI)  ← sends array of descriptions
      │
      ├── Layer 1: merchant_learning check
      ├── Layer 2: rule_engine check
      ├── Layer 3: ml_classifier predict
      └── Layer 4: gemini_classifier (batches of 20)
      │
      ▼
Returns [{category, confidence}] for each row
      │
      ▼
Prisma: batch insert into transactions table
      │
      ▼
Delete temp file → respond 201
```

---

## 4. Data Flow Diagrams

### 4.1 Transaction Categorization Data Flow

```
INPUT: Raw CSV row
  description: "ZOMATO ORDER #12345"
  amount: 450
  date: "2024-01-15"
  type: "debit"
        │
        ▼
┌─────────────────────────────────────────┐
│           Categorization Pipeline        │
│                                         │
│  Step 1: Normalize text                 │
│  "zomato order 12345" → "zomato"        │
│                │                        │
│                ▼                        │
│  Step 2: Merchant learning lookup       │
│  merchant_learning table: ZOMATO = ?    │
│  → Not found, continue                  │
│                │                        │
│                ▼                        │
│  Step 3: Rule engine keyword match      │
│  ZOMATO → Food ✓ (confidence: 0.99)     │
│  → MATCHED, stop pipeline               │
│                                         │
└─────────────────────────────────────────┘
        │
        ▼
OUTPUT: { category: "Food", confidence: 0.99, source: "rule_engine" }
```

### 4.2 Dashboard Data Flow

```
Page load: Dashboard.jsx
      │
      ▼
useQuery(['dashboard-summary'])
      │
      ▼
GET /dashboard/summary (Bearer JWT)
      │
      ▼
dashboard.controller.js → dashboard.service.js
      │
      ├── Prisma: SUM(amount) WHERE type=credit AND user_id=X
      ├── Prisma: SUM(amount) WHERE type=debit AND user_id=X
      ├── Prisma: GROUP BY category, SUM(amount)
      └── Prisma: monthly aggregation last 6 months
      │
      ▼
Aggregate into single JSON response
      │
      ▼
{
  totalIncome: 85000,
  totalExpenses: 42300,
  savings: 42700,
  topCategory: "Food",
  monthlyTrend: [...],
  categoryBreakdown: [...]
}
      │
      ▼
React state → Recharts renders → User sees dashboard
```

### 4.3 Chatbot Data Flow

```
User: "How much did I spend on food this month?"
      │
      ▼
POST /ai/chat { message, userId }
      │
      ▼
Backend ai.controller.js
→ POST FastAPI /chat { message, userId }
      │
      ▼
chat_service.py → Gemini 2.5 Flash
  System prompt: "You are a financial assistant. Use function calls to query data."
  Available functions: get_category_total, get_monthly_summary, etc.
      │
      ▼
Gemini decides: call get_category_total(category="Food", month="current")
      │
      ▼
FastAPI calls backend: GET /dashboard/category-total?category=Food&month=2024-01
      │
      ▼
Backend queries Prisma → returns { total: 8450, count: 23 }
      │
      ▼
FastAPI returns structured data to Gemini
      │
      ▼
Gemini generates: "You spent ₹8,450 on Food this month across 23 transactions."
      │
      ▼
Response stored in chat_history → returned to frontend
```

---

## 5. AI Pipeline Architecture

### 5.1 Five-Layer Categorization Pipeline

```
Transaction Description Input
        │
        ▼
┌───────────────────────────────┐
│  Layer 1: Merchant Learning   │  ← checks merchant_learning table
│  "Previously corrected?"      │    for user-corrected mappings
│  Confidence: 1.00             │
└───────────┬───────────────────┘
            │ MISS
            ▼
┌───────────────────────────────┐
│  Layer 2: Rule Engine         │  ← keyword/regex matching
│  "Known keyword match?"       │    e.g. ZOMATO→Food, IRCTC→Travel
│  ~200+ rules                  │
│  Confidence: 0.95-0.99        │
└───────────┬───────────────────┘
            │ MISS
            ▼
┌───────────────────────────────┐
│  Layer 3: ML Classifier       │  ← TF-IDF Vectorizer
│  TF-IDF + Multinomial NB      │    + Multinomial Naive Bayes
│  Trained on 6000+ transactions│    Trained on Indian banking data
│  Target Accuracy: 85%+        │
└───────────┬───────────────────┘
            │ Confidence < 0.70
            ▼
┌───────────────────────────────┐
│  Layer 4: Gemini Fallback     │  ← Gemini 2.5 Flash
│  Batch: 20 txns per request   │    Cached results stored
│  Prompt: structured JSON out  │    to avoid re-calling
│  Confidence: 0.75-0.95        │
└───────────┬───────────────────┘
            │ API failure / uncertain
            ▼
┌───────────────────────────────┐
│  Layer 5: Default Fallback    │
│  Category: "Others"           │
│  Confidence: 0.00             │
└───────────────────────────────┘
        │
        ▼
{ category, confidence, source }
Stored in transactions table
```

### 5.2 Anomaly Detection Architecture

```
New Transaction Arrives
        │
        ├── Check 1: Duplicate Detection
        │   Same merchant + Same amount + Within 24 hours?
        │   → Alert: "Possible duplicate charge"
        │
        ├── Check 2: Large Transaction
        │   Amount > 3× user's average transaction?
        │   → Alert: "Unusually large transaction"
        │
        └── Check 3: Spending Spike
            │
            ├── history < 6 months?
            │   Use Z-Score
            │   z = (x - μ) / σ
            │   z > 2.5 → Alert
            │
            └── history ≥ 6 months?
                Use Isolation Forest
                sklearn IsolationForest(contamination=0.05)
                Scores < -0.2 → Alert
```

### 5.3 Subscription Detection Algorithm

```
For each unique merchant with ≥ 3 monthly transactions:
    amounts = [649, 649, 649, 649]
    mean = 649
    std  = 0
    CoV  = std / mean = 0.0  ← below 0.1 threshold

    → Detected as subscription
    → Store: { merchant, amount, frequency: "monthly" }
```

### 5.4 Savings Engine Rules

```
Rule 1: Food Delivery Overspend
  IF SUM(Food, month) > 5000
  THEN opportunity: "Reduce food delivery by 20% → Save ₹X/month"

Rule 2: Duplicate Subscriptions
  IF count(subscriptions) > 5
  THEN opportunity: "Review and cancel unused subscriptions"

Rule 3: Shopping Spike
  IF SUM(Shopping, this_month) > 1.3 × AVG(Shopping, last_3_months)
  THEN opportunity: "Shopping spend increased 30%. Set a budget."

Rule 4: High EMI Ratio
  IF SUM(EMI, month) > 0.4 × SUM(income, month)
  THEN opportunity: "EMIs exceed 40% of income. Consider refinancing."
```

---

## 6. Database Architecture

### 6.1 Entity Relationship Overview

```
users ──────────────────────────────────────────┐
  │ 1                                           │
  │                                             │
  ├──< transactions (many)                      │
  │         │                                   │
  │         └── merchant_learning (derived)     │
  │                                             │
  ├──< budgets (many, per category per month)   │
  │                                             │
  ├──< subscriptions (many, detected)           │
  │                                             │
  ├──< fraud_alerts (many)                      │
  │                                             │
  └──< chat_history (many)                      │
```

### 6.2 Tables Overview

| Table | Purpose | Key Indexes |
|-------|---------|-------------|
| users | Auth, profile | email (unique) |
| transactions | All financial entries | user_id, category, merchant, date, created_at |
| budgets | Monthly category limits | user_id, category, month |
| subscriptions | Detected recurring charges | user_id, merchant |
| fraud_alerts | Anomaly flags | user_id, transaction_id, created_at |
| chat_history | AI conversation log | user_id, created_at |
| merchant_learning | User-corrected mappings | user_id, merchant_name |

### 6.3 Index Strategy

```
-- Fast user-scoped queries (every query filters by user)
CREATE INDEX idx_transactions_user_id ON transactions(user_id);

-- Category aggregations for dashboard & budgets
CREATE INDEX idx_transactions_category ON transactions(category);

-- Merchant learning lookup & subscription grouping
CREATE INDEX idx_transactions_merchant ON transactions(merchant);

-- Date-range filtering (monthly views, trend charts)
CREATE INDEX idx_transactions_date ON transactions(date);

-- Pagination, audit, recent-first ordering
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Composite: the most common combined filter
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_user_category ON transactions(user_id, category);
```

---

## 7. Security Architecture

### 7.1 Authentication Flow

```
POST /auth/register
  │
  ├── Validate input (express-validator)
  ├── Check email uniqueness (Prisma)
  ├── bcrypt.hash(password, 12)
  ├── prisma.user.create()
  └── Return JWT (7-day expiry)

POST /auth/login
  │
  ├── Find user by email
  ├── bcrypt.compare(password, hash)
  ├── jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' })
  └── Return token in response body (stored in localStorage by client)

Protected Routes
  │
  ├── Authorization: Bearer <token> header required
  ├── authMiddleware.js verifies token
  ├── Attaches req.user = { userId, email }
  └── Controller proceeds with req.user.userId for all DB queries
```

### 7.2 Security Layers

```
Layer 1: Transport
  → HTTPS enforced on Vercel, Render, Supabase
  → Strict CORS: only allow frontend origin

Layer 2: Headers (Helmet.js)
  → X-Frame-Options: DENY
  → X-Content-Type-Options: nosniff
  → Content-Security-Policy
  → Referrer-Policy

Layer 3: Rate Limiting (express-rate-limit)
  → /auth/* : 10 requests / 15 minutes per IP
  → /api/*  : 100 requests / minute per IP

Layer 4: Input Validation
  → express-validator on all endpoints
  → Joi schemas for complex objects
  → multer limits: 10MB, CSV only

Layer 5: Data Access
  → Prisma parameterized queries (no raw SQL interpolation)
  → Every query scoped to req.user.userId
  → No admin endpoints in production

Layer 6: Secrets
  → All secrets in .env (never committed)
  → Render environment variables for production
  → Internal API key between backend ↔ AI service
```

### 7.3 Environment Variables

```
Backend (.env)
  DATABASE_URL          → Supabase PostgreSQL connection string
  JWT_SECRET            → Random 64-char secret
  INTERNAL_API_KEY      → Shared with AI service
  AI_SERVICE_URL        → FastAPI base URL
  PORT                  → 5000
  NODE_ENV              → development / production
  ALLOWED_ORIGINS       → Frontend URL(s)

AI Service (.env)
  GEMINI_API_KEY        → Google AI API key
  INTERNAL_API_KEY      → Must match backend
  BACKEND_URL           → Express backend URL
  PORT                  → 8000

Frontend (.env)
  VITE_API_URL          → Express backend URL
```

---

## 8. Deployment Architecture

### 8.1 Production Topology

```
                    ┌──────────────────┐
                    │     Vercel       │
                    │   (Frontend)     │
                    │  finsight.vercel │
                    │     .app         │
                    └────────┬─────────┘
                             │ HTTPS
                             ▼
                    ┌──────────────────┐
                    │     Render       │
                    │   (Backend)      │
                    │  api.finsight    │
                    │  .onrender.com   │
                    └────────┬─────────┘
                    /                  \
          DB calls /                    \ HTTP calls
                  /                      \
    ┌─────────────────┐        ┌──────────────────┐
    │    Supabase     │        │     Render        │
    │  (PostgreSQL)   │        │  (AI Service)     │
    │  db.supabase.co │        │  ai.finsight      │
    │                 │        │  .onrender.com    │
    └─────────────────┘        └────────┬──────────┘
                                        │ HTTPS
                                        ▼
                               ┌──────────────────┐
                               │  Google Gemini   │
                               │  2.5 Flash API   │
                               └──────────────────┘
```

### 8.2 Environment Separation

| Concern | Development | Production |
|---------|------------|-----------|
| Frontend | localhost:5173 | Vercel |
| Backend | localhost:5000 | Render |
| AI Service | localhost:8000 | Render |
| Database | Local PG or Supabase dev | Supabase |
| SSL | None needed | Automatic (all platforms) |
| Logs | Console | Winston → Render logs |

### 8.3 CI/CD Strategy

```
GitHub Repository
├── main branch → Production auto-deploys
│     ├── Vercel watches: frontend/ directory
│     └── Render watches: backend/ and ai-service/ directories
│
└── dev branch → Development / testing
```

---

## 9. Folder Structure

```
finsight/
│
├── ARCHITECTURE.md                  ← This file
├── README.md
│
├── frontend/                        ← React + Vite SPA
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx                 ← Entry point, providers
│       ├── App.jsx                  ← Router + protected routes
│       ├── index.css                ← Global styles + Tailwind
│       ├── context/
│       │   ├── AuthContext.jsx      ← JWT, user session
│       │   └── ThemeContext.jsx     ← Dark/light mode
│       ├── services/
│       │   ├── api.js               ← Axios instance, interceptors
│       │   ├── auth.service.js
│       │   ├── transaction.service.js
│       │   ├── dashboard.service.js
│       │   ├── budget.service.js
│       │   └── ai.service.js
│       ├── hooks/
│       │   ├── useAuth.js
│       │   ├── useTransactions.js
│       │   ├── useDashboard.js
│       │   ├── useBudgets.js
│       │   └── useChat.js
│       ├── pages/
│       │   ├── auth/
│       │   │   ├── Login.jsx
│       │   │   └── Register.jsx
│       │   ├── Dashboard.jsx        ← KPIs, charts, insights
│       │   ├── Transactions.jsx     ← Table, filters, CSV upload
│       │   ├── Budgets.jsx          ← Budget cards + planner
│       │   ├── Subscriptions.jsx    ← Detected subscriptions
│       │   ├── FraudAlerts.jsx      ← Anomaly alerts
│       │   ├── Savings.jsx          ← Savings opportunities
│       │   ├── Insights.jsx         ← Monthly AI report
│       │   └── Chat.jsx             ← AI finance chatbot
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Layout.jsx       ← Sidebar + TopNav wrapper
│       │   │   ├── Sidebar.jsx
│       │   │   └── TopNav.jsx
│       │   ├── ui/
│       │   │   ├── Button.jsx
│       │   │   ├── Card.jsx
│       │   │   ├── Input.jsx
│       │   │   ├── Modal.jsx
│       │   │   ├── Badge.jsx
│       │   │   ├── Skeleton.jsx     ← Loading states
│       │   │   └── EmptyState.jsx   ← Empty data states
│       │   ├── dashboard/
│       │   │   ├── KPICard.jsx
│       │   │   ├── SpendingTrend.jsx
│       │   │   ├── CategoryPie.jsx
│       │   │   ├── IncomeExpenseBar.jsx
│       │   │   └── InsightCard.jsx
│       │   ├── transactions/
│       │   │   ├── TransactionTable.jsx
│       │   │   ├── TransactionFilters.jsx
│       │   │   ├── TransactionForm.jsx  ← Manual entry
│       │   │   ├── CSVUpload.jsx
│       │   │   └── CategoryCorrection.jsx
│       │   ├── budget/
│       │   │   ├── BudgetCard.jsx
│       │   │   └── BudgetForm.jsx
│       │   ├── subscriptions/
│       │   │   └── SubscriptionCard.jsx
│       │   ├── fraud/
│       │   │   └── FraudAlertCard.jsx
│       │   └── chat/
│       │       ├── ChatInterface.jsx
│       │       ├── ChatMessage.jsx
│       │       └── ChatInput.jsx
│       └── utils/
│           ├── formatters.js        ← currency, date, % formatters
│           ├── validators.js        ← Client-side validation
│           └── constants.js         ← Categories, colors, routes
│
├── backend/                         ← Node.js + Express API
│   ├── .env.example
│   ├── package.json
│   ├── server.js                    ← HTTP server entry point
│   ├── uploads/                     ← Temp CSV storage (gitignored)
│   ├── prisma/
│   │   └── schema.prisma            ← Data model
│   └── src/
│       ├── app.js                   ← Express setup + middleware
│       ├── config/
│       │   ├── database.js          ← Prisma client singleton
│       │   └── constants.js         ← App-wide constants
│       ├── routes/
│       │   ├── index.js             ← Mount all routers
│       │   ├── auth.routes.js
│       │   ├── transaction.routes.js
│       │   ├── dashboard.routes.js
│       │   ├── budget.routes.js
│       │   └── ai.routes.js
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── transaction.controller.js
│       │   ├── dashboard.controller.js
│       │   ├── budget.controller.js
│       │   └── ai.controller.js
│       ├── services/
│       │   ├── auth.service.js
│       │   ├── transaction.service.js
│       │   ├── dashboard.service.js
│       │   ├── budget.service.js
│       │   ├── csv.service.js       ← CSV parse + normalize
│       │   └── ai.service.js        ← HTTP client to FastAPI
│       ├── middleware/
│       │   ├── auth.middleware.js   ← JWT verification
│       │   ├── errorHandler.js      ← Global error handler
│       │   ├── rateLimiter.js       ← express-rate-limit config
│       │   ├── validate.js          ← Validation result checker
│       │   └── logger.js            ← Winston HTTP logger
│       ├── validators/
│       │   ├── auth.validators.js
│       │   ├── transaction.validators.js
│       │   └── budget.validators.js
│       └── utils/
│           ├── jwt.js               ← Sign / verify helpers
│           ├── password.js          ← bcrypt helpers
│           ├── response.js          ← Standardized response shape
│           └── logger.js            ← Winston logger instance
│
└── ai-service/                      ← Python + FastAPI
    ├── .env.example
    ├── requirements.txt
    ├── main.py                      ← FastAPI entry point
    ├── models/                      ← Trained ML model files
    │   ├── transaction_classifier.pkl
    │   └── tfidf_vectorizer.pkl
    ├── training/
    │   └── train_classifier.py      ← Offline training script
    └── app/
        ├── __init__.py
        ├── core/
        │   ├── config.py            ← Settings from .env
        │   └── dependencies.py      ← Shared FastAPI dependencies
        ├── routers/
        │   ├── categorize.py        ← POST /categorize, /categorize/batch
        │   ├── chat.py              ← POST /chat
        │   ├── insights.py          ← GET /insights/monthly
        │   ├── anomalies.py         ← POST /anomalies/detect
        │   ├── subscriptions.py     ← POST /subscriptions/detect
        │   └── savings.py           ← POST /savings/opportunities
        ├── services/
        │   ├── categorization/
        │   │   ├── pipeline.py      ← Orchestrates all 5 layers
        │   │   ├── merchant_learning.py
        │   │   ├── rule_engine.py
        │   │   ├── ml_classifier.py
        │   │   └── gemini_classifier.py
        │   ├── anomaly_detection.py
        │   ├── subscription_detector.py
        │   ├── savings_engine.py
        │   ├── insights_generator.py
        │   └── chat_service.py
        ├── models/
        │   └── schemas.py           ← Pydantic request/response models
        └── utils/
            ├── text_preprocessing.py ← Clean/normalize descriptions
            └── gemini_client.py      ← Gemini SDK wrapper
```

---

## 10. Architecture Decisions

### Why Three Separate Services?

**Problem:** A monolith would tightly couple JavaScript (Node.js) with Python ML libraries.

**Decision:** Split into three independent deployable units.

- **Frontend (React/Vercel):** CDN-hosted, zero server cost, instant global delivery
- **Backend (Node/Render):** Handles auth, data, orchestration — no ML dependencies
- **AI Service (Python/Render):** scikit-learn, pandas, Gemini SDK — Python ecosystem only

**Trade-off:** Added latency for backend→AI calls (~50-100ms). Acceptable given ML inference benefit.

---

### Why PostgreSQL over MongoDB?

**Problem:** Financial data has strict relationships (users→transactions→budgets).

**Decision:** PostgreSQL with Prisma ORM.

- Relational integrity (foreign keys, constraints)
- Complex aggregation queries (GROUP BY category, monthly SUM)
- Supabase provides managed PostgreSQL with free tier
- ACID guarantees critical for financial records

**Trade-off:** Less flexible schema. Acceptable — finance data schema is stable.

---

### Why Five-Layer Categorization?

**Problem:** Gemini API has rate limits. ML alone won't handle all Indian bank formats.

**Decision:** Cascade through increasingly expensive/accurate layers.

- Layer 1 (Merchant Learning): O(1) DB lookup, user-personalized
- Layer 2 (Rules): O(rules) in-memory, covers 60-70% of transactions
- Layer 3 (ML): O(features) local inference, no API cost
- Layer 4 (Gemini): Only for ambiguous cases, batched to minimize calls
- Layer 5 (Fallback): Ensures 100% coverage

**Result:** Gemini called for ~5-10% of transactions → stays within free tier.

---

### Why React Query over Redux?

**Problem:** Dashboard, transactions, budgets all need server state with caching.

**Decision:** React Query (TanStack Query) handles server state; React Context for auth/theme.

- Built-in caching, stale-while-revalidate
- Background refetching
- Loading/error states out of the box
- No boilerplate compared to Redux Thunk

**Trade-off:** No centralized store for complex cross-component state. Not needed here.

---

### Why No Docker?

**Decision per requirements:** Direct deployment to Vercel/Render/Supabase.

- All three platforms handle runtime environments natively
- Render supports Python and Node.js directly
- Vercel handles React builds automatically
- Simplifies local development (no Docker Desktop required)

---

### Why JWT over Sessions?

**Decision:** Stateless JWT, 7-day expiry, stored in localStorage.

- No session store needed (no Redis dependency)
- Scales horizontally (any Render instance can verify)
- Simpler implementation for SaaS MVP

**Trade-off:** Cannot revoke tokens before expiry. Acceptable for this use case.

---

### Gemini Function Calling vs Direct DB Access

**Decision:** Gemini never touches the database.

Flow: Gemini → declares function call → Backend executes → Returns data → Gemini formats response.

**Why:**
- Security: AI cannot issue arbitrary queries
- Correctness: Prisma-validated, type-safe data only
- Auditability: All DB access through standard service layer

---

*Phase 1 — Architecture Complete*
*Awaiting approval before proceeding to Phase 2 — Database Design*
