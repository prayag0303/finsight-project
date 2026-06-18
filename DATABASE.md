# FinSight — Database Design

## Table of Contents
1. [ER Diagram](#1-er-diagram)
2. [Table Schemas](#2-table-schemas)
3. [Relationships & Constraints](#3-relationships--constraints)
4. [Indexing Strategy](#4-indexing-strategy)
5. [Query Strategy](#5-query-strategy)
6. [Enum Definitions](#6-enum-definitions)

---

## 1. ER Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           FINSIGHT DATABASE                                      │
│                                                                                  │
│  ┌─────────────────┐                                                             │
│  │     USERS       │                                                             │
│  ├─────────────────┤                                                             │
│  │ PK id (uuid)    │◄────────────────────────────────────────────────────┐       │
│  │    name         │                                                     │       │
│  │    email (UQ)   │                                                     │       │
│  │    password     │                                                     │       │
│  │    created_at   │                                                     │       │
│  │    updated_at   │                                                     │       │
│  └────────┬────────┘                                                     │       │
│           │ 1                                                            │       │
│     ┌─────┼──────────────────────────────────────────────────────┐      │       │
│     │     │                                                      │      │       │
│     │ N   │ N                    N │                   N │       │ N    │       │
│     ▼     ▼                      ▼                     ▼        ▼      │       │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │  TRANSACTIONS    │  │   BUDGETS    │  │  SUBSCRIPTIONS   │  │   CHAT_     │ │
│  ├──────────────────┤  ├──────────────┤  ├──────────────────┤  │   HISTORY   │ │
│  │PK id (uuid)      │  │PK id (uuid)  │  │PK id (uuid)      │  ├─────────────┤ │
│  │FK user_id        │  │FK user_id    │  │FK user_id        │  │PK id (uuid) │ │
│  │   amount         │  │   category   │  │   merchant       │  │FK user_id   │ │
│  │   description    │  │   month      │  │   average_amount │  │   role      │ │
│  │   merchant       │  │   amount     │  │   frequency      │  │   content   │ │
│  │   date           │  │   created_at │  │   last_charged   │  │   fn_calls  │ │
│  │   type           │  │   updated_at │  │   next_expected  │  │   created_at│ │
│  │   category       │  │              │  │   is_active      │  └─────────────┘ │
│  │   confidence     │  │ UQ(user_id,  │  │   tx_count       │                  │
│  │   source         │  │  category,   │  │   category       │                  │
│  │   is_corrected   │  │  month)      │  │   created_at     │                  │
│  │   notes          │  └──────────────┘  │                  │                  │
│  │   created_at     │                    │ UQ(user_id,      │                  │
│  │   updated_at     │                    │    merchant)     │                  │
│  └─────────┬────────┘                    └──────────────────┘                  │
│            │ 1                                                                  │
│            │ N                                                                  │
│            ▼                                                                    │
│  ┌──────────────────┐   ┌──────────────────────┐                               │
│  │  FRAUD_ALERTS    │   │  MERCHANT_LEARNING   │                               │
│  ├──────────────────┤   ├──────────────────────┤                               │
│  │PK id (uuid)      │   │PK id (uuid)          │                               │
│  │FK user_id        │──►│FK user_id            │                               │
│  │FK transaction_id │   │   merchant_name      │                               │
│  │   alert_type     │   │   category           │                               │
│  │   description    │   │   correction_count   │                               │
│  │   is_resolved    │   │   created_at         │                               │
│  │   created_at     │   │   updated_at         │                               │
│  │   updated_at     │   │                      │                               │
│  └──────────────────┘   │ UQ(user_id,          │                               │
│                          │    merchant_name)    │                               │
│                          └──────────────────────┘                               │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Table Schemas

### 2.1 users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid() | Surrogate primary key |
| name | VARCHAR | NOT NULL | Display name |
| email | VARCHAR | NOT NULL, UNIQUE | Login email |
| password | VARCHAR | NOT NULL | bcrypt hash (cost 12) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Account creation time |
| updated_at | TIMESTAMPTZ | AUTO-UPDATE | Last profile update |

**Design notes:**
- Email is unique — used as login identifier
- Password stored as bcrypt hash only — never plaintext
- UUID over serial INT: prevents enumeration attacks on user IDs

---

### 2.2 transactions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Surrogate key |
| user_id | UUID | FK → users.id, NOT NULL, CASCADE | Owner |
| amount | DECIMAL(12,2) | NOT NULL, CHECK > 0 | Transaction value in INR |
| description | TEXT | NOT NULL | Raw bank narration |
| merchant | VARCHAR | NULLABLE | Extracted merchant name |
| date | DATE | NOT NULL | Transaction date (no time needed) |
| type | ENUM | NOT NULL | CREDIT or DEBIT |
| category | ENUM | DEFAULT 'Others' | AI or manual category |
| confidence | FLOAT | DEFAULT 0, CHECK 0–1 | AI confidence score |
| source | ENUM | DEFAULT 'FALLBACK' | Which pipeline layer categorized |
| is_corrected | BOOLEAN | DEFAULT false | User manually fixed the category |
| notes | TEXT | NULLABLE | Optional user note |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Row insert time |
| updated_at | TIMESTAMPTZ | AUTO-UPDATE | Last modification |

**Design notes:**
- `date` is DATE (not TIMESTAMPTZ) — bank statements have date, not time
- `amount` is DECIMAL(12,2) — avoids floating point errors for currency
- `merchant` is nullable — some descriptions have no identifiable merchant
- `confidence` stored per-transaction — enables confidence-aware chatbot responses
- `source` stored — allows auditing which pipeline layer handled each transaction
- `is_corrected` flag — tells the pipeline to skip AI for this transaction next time

---

### 2.3 budgets

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Surrogate key |
| user_id | UUID | FK → users.id, CASCADE | Owner |
| category | ENUM | NOT NULL | Budget category |
| month | VARCHAR(7) | NOT NULL | "YYYY-MM" format, e.g. "2024-01" |
| amount | DECIMAL(12,2) | NOT NULL, CHECK > 0 | Budget limit in INR |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | AUTO-UPDATE | |

**Unique constraint:** `(user_id, category, month)` — one budget per category per month per user.

**Design notes:**
- `month` stored as string "YYYY-MM" — simpler than storing first/last day, easy to query with `LIKE '2024-%'`
- No FK to transactions — budget usage is computed at query time via aggregation

---

### 2.4 subscriptions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Surrogate key |
| user_id | UUID | FK → users.id, CASCADE | Owner |
| merchant | VARCHAR | NOT NULL | Subscription service name |
| average_amount | DECIMAL(12,2) | NOT NULL | Mean charge amount |
| frequency | ENUM | DEFAULT 'MONTHLY' | WEEKLY / MONTHLY / YEARLY |
| last_charged | DATE | NOT NULL | Most recent charge date |
| next_expected | DATE | NULLABLE | Predicted next charge |
| is_active | BOOLEAN | DEFAULT true | Whether still active |
| transaction_count | INTEGER | DEFAULT 0 | How many times charged |
| category | ENUM | DEFAULT 'Others' | Category of subscription |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | AUTO-UPDATE | |

**Unique constraint:** `(user_id, merchant)` — one subscription record per merchant per user.

---

### 2.5 fraud_alerts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Surrogate key |
| user_id | UUID | FK → users.id, CASCADE | Owner |
| transaction_id | UUID | FK → transactions.id, CASCADE | Flagged transaction |
| alert_type | ENUM | NOT NULL | DUPLICATE / LARGE_TRANSACTION / SPENDING_SPIKE |
| description | TEXT | NOT NULL | Human-readable alert message |
| is_resolved | BOOLEAN | DEFAULT false | User dismissed / acknowledged |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | AUTO-UPDATE | |

**Design notes:**
- Cascade on transaction delete — no orphan alerts if transaction is removed
- `is_resolved` allows user to dismiss alerts without deleting them

---

### 2.6 chat_history

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Surrogate key |
| user_id | UUID | FK → users.id, CASCADE | Owner |
| role | ENUM | NOT NULL | USER or ASSISTANT |
| content | TEXT | NOT NULL | Message text |
| function_calls | JSONB | NULLABLE | Gemini function call metadata |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Message timestamp |

**Design notes:**
- No `updated_at` — chat messages are immutable
- `function_calls` stored as JSONB — preserves full Gemini function call/result trace for debugging
- Conversation context built by fetching last N messages for a user, ordered by created_at

---

### 2.7 merchant_learning

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Surrogate key |
| user_id | UUID | FK → users.id, CASCADE | Owner |
| merchant_name | VARCHAR | NOT NULL | Normalized merchant string |
| category | ENUM | NOT NULL | User-confirmed category |
| correction_count | INTEGER | DEFAULT 1 | Times user confirmed this mapping |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | AUTO-UPDATE | |

**Unique constraint:** `(user_id, merchant_name)` — one mapping per merchant per user.

**Design notes:**
- `correction_count` increments on each user correction — high count = high-confidence mapping
- This table is the **first** layer checked in the AI categorization pipeline
- Periodically exported and merged into ML training data for retraining

---

## 3. Relationships & Constraints

### 3.1 Relationship Map

```
users (1) ────────< (N) transactions
users (1) ────────< (N) budgets
users (1) ────────< (N) subscriptions
users (1) ────────< (N) fraud_alerts
users (1) ────────< (N) chat_history
users (1) ────────< (N) merchant_learning
transactions (1) ─< (N) fraud_alerts
```

### 3.2 Cascade Behavior

| Parent | Child | On Delete |
|--------|-------|-----------|
| users | transactions | CASCADE — all user data removed |
| users | budgets | CASCADE |
| users | subscriptions | CASCADE |
| users | fraud_alerts | CASCADE |
| users | chat_history | CASCADE |
| users | merchant_learning | CASCADE |
| transactions | fraud_alerts | CASCADE — alert removed if transaction removed |

### 3.3 Unique Constraints

| Table | Constraint | Purpose |
|-------|-----------|---------|
| users | `(email)` | One account per email |
| budgets | `(user_id, category, month)` | One budget per category per month |
| subscriptions | `(user_id, merchant)` | One subscription entry per service |
| merchant_learning | `(user_id, merchant_name)` | One mapping per merchant per user |

### 3.4 Check Constraints (enforced in application layer via Prisma validators)

```sql
-- Amount must be positive
CONSTRAINT transactions_amount_positive CHECK (amount > 0)
CONSTRAINT budgets_amount_positive CHECK (amount > 0)

-- Confidence must be between 0 and 1
CONSTRAINT transactions_confidence_range CHECK (confidence >= 0 AND confidence <= 1)

-- Month must match YYYY-MM format
CONSTRAINT budgets_month_format CHECK (month ~ '^\d{4}-(0[1-9]|1[0-2])$')
```

---

## 4. Indexing Strategy

### 4.1 All Indexes

```sql
-- ═══════════════════════════════════════════════════
-- TRANSACTIONS TABLE
-- ═══════════════════════════════════════════════════

-- 1. user_id — PRIMARY SCOPING INDEX
CREATE INDEX idx_transactions_user_id
  ON transactions(user_id);

-- 2. category — CATEGORY AGGREGATION INDEX
CREATE INDEX idx_transactions_category
  ON transactions(category);

-- 3. merchant — MERCHANT LOOKUP + SUBSCRIPTION DETECTION INDEX
CREATE INDEX idx_transactions_merchant
  ON transactions(merchant);

-- 4. date — DATE RANGE FILTERING INDEX
CREATE INDEX idx_transactions_date
  ON transactions(date);

-- 5. created_at DESC — PAGINATION + RECENT-FIRST INDEX
CREATE INDEX idx_transactions_created_at
  ON transactions(created_at DESC);

-- 6. (user_id, date DESC) — COMPOSITE: USER + DATE RANGE
CREATE INDEX idx_transactions_user_date
  ON transactions(user_id, date DESC);

-- 7. (user_id, category) — COMPOSITE: USER + CATEGORY FILTER
CREATE INDEX idx_transactions_user_category
  ON transactions(user_id, category);

-- 8. (user_id, type) — COMPOSITE: INCOME VS EXPENSE SPLIT
CREATE INDEX idx_transactions_user_type
  ON transactions(user_id, type);

-- ═══════════════════════════════════════════════════
-- BUDGETS TABLE
-- ═══════════════════════════════════════════════════

-- 9. user_id — USER BUDGET LOOKUP
CREATE INDEX idx_budgets_user_id
  ON budgets(user_id);

-- 10. (user_id, month) — MONTHLY BUDGET LOOKUP
CREATE INDEX idx_budgets_user_month
  ON budgets(user_id, month);

-- ═══════════════════════════════════════════════════
-- FRAUD_ALERTS TABLE
-- ═══════════════════════════════════════════════════

-- 11. user_id
CREATE INDEX idx_fraud_alerts_user_id
  ON fraud_alerts(user_id);

-- 12. (user_id, is_resolved) — UNRESOLVED ALERTS DASHBOARD
CREATE INDEX idx_fraud_alerts_user_resolved
  ON fraud_alerts(user_id, is_resolved);

-- 13. (user_id, created_at DESC) — RECENT ALERTS FEED
CREATE INDEX idx_fraud_alerts_user_created
  ON fraud_alerts(user_id, created_at DESC);

-- 14. transaction_id — JOIN PERFORMANCE
CREATE INDEX idx_fraud_alerts_transaction_id
  ON fraud_alerts(transaction_id);

-- ═══════════════════════════════════════════════════
-- CHAT_HISTORY TABLE
-- ═══════════════════════════════════════════════════

-- 15. user_id
CREATE INDEX idx_chat_history_user_id
  ON chat_history(user_id);

-- 16. (user_id, created_at DESC) — CONVERSATION LOAD ORDER
CREATE INDEX idx_chat_history_user_created
  ON chat_history(user_id, created_at DESC);

-- ═══════════════════════════════════════════════════
-- SUBSCRIPTIONS TABLE
-- ═══════════════════════════════════════════════════

-- 17. user_id
CREATE INDEX idx_subscriptions_user_id
  ON subscriptions(user_id);

-- 18. (user_id, is_active) — ACTIVE SUBSCRIPTIONS VIEW
CREATE INDEX idx_subscriptions_user_active
  ON subscriptions(user_id, is_active);

-- ═══════════════════════════════════════════════════
-- MERCHANT_LEARNING TABLE
-- ═══════════════════════════════════════════════════

-- 19. user_id
CREATE INDEX idx_merchant_learning_user_id
  ON merchant_learning(user_id);

-- 20. (user_id, merchant_name) — PIPELINE LAYER 1 LOOKUP
CREATE INDEX idx_merchant_learning_user_merchant
  ON merchant_learning(user_id, merchant_name);
```

### 4.2 Index Rationale

#### Index 1 — `transactions(user_id)`
**Why:** Every single query on the transactions table is scoped to a specific user. Without this index, Postgres would sequential scan all rows. This is the most critical index in the entire database.

**Query it accelerates:**
```sql
SELECT * FROM transactions WHERE user_id = $1
```

---

#### Index 2 — `transactions(category)`
**Why:** The dashboard category pie chart and budget usage both aggregate transactions by category. Without this, every category aggregation is a full table scan.

**Query it accelerates:**
```sql
SELECT category, SUM(amount) FROM transactions
WHERE user_id = $1
GROUP BY category
```

---

#### Index 3 — `transactions(merchant)`
**Why:** Subscription detection groups transactions by merchant across users. Merchant learning lookups also filter by merchant name. Fraud duplicate detection also queries by merchant + amount + date.

**Query it accelerates:**
```sql
SELECT merchant, COUNT(*), AVG(amount)
FROM transactions
WHERE user_id = $1
GROUP BY merchant
HAVING COUNT(*) >= 3
```

---

#### Index 4 — `transactions(date)`
**Why:** Every time-based filter — monthly trend charts, date range filters, last-30-days views — requires a date range scan. A B-Tree index on DATE enables efficient range scans.

**Query it accelerates:**
```sql
SELECT * FROM transactions
WHERE user_id = $1
  AND date BETWEEN '2024-01-01' AND '2024-01-31'
```

---

#### Index 5 — `transactions(created_at DESC)`
**Why:** The transaction list page defaults to "most recent first." Pagination (LIMIT/OFFSET) on an unindexed created_at would scan and sort millions of rows. DESC order matches the sort direction so Postgres reads in B-Tree order without a filesort.

**Query it accelerates:**
```sql
SELECT * FROM transactions
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 20 OFFSET 0
```

---

#### Index 6 — `transactions(user_id, date DESC)`
**Why:** The most common combined query — fetch user's transactions in date order. A composite index allows Postgres to use index-only scans satisfying both the WHERE and ORDER BY in one pass. Eliminates the need to merge indexes 1 and 4 at query time.

**Query it accelerates:**
```sql
SELECT * FROM transactions
WHERE user_id = $1
ORDER BY date DESC
LIMIT 20
```

---

#### Index 7 — `transactions(user_id, category)`
**Why:** Dashboard category breakdown, budget usage check, and savings analysis all filter by `user_id AND category`. This composite index covers both predicates in a single index scan.

**Query it accelerates:**
```sql
SELECT SUM(amount) FROM transactions
WHERE user_id = $1 AND category = 'Food'
  AND date >= '2024-01-01'
```

---

#### Index 8 — `transactions(user_id, type)`
**Why:** The income vs. expense bar chart and dashboard summary split transactions by type (CREDIT/DEBIT). This composite index makes that split instant without scanning all user transactions.

**Query it accelerates:**
```sql
SELECT type, SUM(amount) FROM transactions
WHERE user_id = $1
GROUP BY type
```

---

#### Index 9 — `budgets(user_id)`
**Why:** Budget page always loads all budgets for a user. Foreign key joins also benefit.

---

#### Index 10 — `budgets(user_id, month)`
**Why:** Budget status is always checked for a specific user + month combination. This eliminates the need to filter all user budgets and then filter by month.

---

#### Index 11-13 — `fraud_alerts` indexes
**Why:** The fraud alert dashboard shows unresolved alerts (is_resolved = false) for a user, ordered by recency. The composite indexes on `(user_id, is_resolved)` and `(user_id, created_at DESC)` prevent scanning all alerts to find the relevant subset.

---

#### Index 14 — `fraud_alerts(transaction_id)`
**Why:** JOIN performance when loading a fraud alert with its associated transaction details. Without this, each JOIN requires a sequential scan of fraud_alerts.

---

#### Index 15-16 — `chat_history` indexes
**Why:** Chat conversation requires fetching recent messages for a user in chronological order. The composite index `(user_id, created_at DESC)` allows fetching the last N messages in one efficient index scan.

---

#### Index 17-18 — `subscriptions` indexes
**Why:** The subscriptions page shows only active subscriptions. `(user_id, is_active)` makes this instant. Most users will have `is_active = true` for all subscriptions, so partial filtering via index is essential.

---

#### Index 19-20 — `merchant_learning` indexes
**Why:** Merchant learning is **Layer 1** of the AI pipeline — called for every single transaction during categorization. The composite index `(user_id, merchant_name)` makes this lookup O(log n) instead of O(n). This is a hot-path lookup that runs thousands of times during CSV upload.

---

## 5. Query Strategy

### 5.1 Dashboard Summary Query

```sql
-- Total income, expenses, savings — one query
SELECT
  SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN type = 'DEBIT'  THEN amount ELSE 0 END) AS total_expenses,
  SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE -amount END) AS savings
FROM transactions
WHERE user_id = $1
  AND date >= date_trunc('month', CURRENT_DATE);

-- Uses: idx_transactions_user_type + idx_transactions_date
```

### 5.2 Category Breakdown Query

```sql
-- Pie chart data
SELECT
  category,
  SUM(amount) AS total,
  COUNT(*)    AS count
FROM transactions
WHERE user_id = $1
  AND type = 'DEBIT'
  AND date >= date_trunc('month', CURRENT_DATE)
GROUP BY category
ORDER BY total DESC;

-- Uses: idx_transactions_user_category
```

### 5.3 Monthly Trend Query (last 6 months)

```sql
-- Spending trend line chart
SELECT
  TO_CHAR(date, 'YYYY-MM') AS month,
  SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END) AS income,
  SUM(CASE WHEN type = 'DEBIT'  THEN amount ELSE 0 END) AS expenses
FROM transactions
WHERE user_id = $1
  AND date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY TO_CHAR(date, 'YYYY-MM')
ORDER BY month;

-- Uses: idx_transactions_user_date
```

### 5.4 Budget Usage Query

```sql
-- Budget vs. actual for current month
SELECT
  b.category,
  b.amount          AS budget_limit,
  COALESCE(SUM(t.amount), 0) AS spent,
  b.amount - COALESCE(SUM(t.amount), 0) AS remaining,
  ROUND(COALESCE(SUM(t.amount), 0) / b.amount * 100, 1) AS usage_pct
FROM budgets b
LEFT JOIN transactions t
  ON t.user_id = b.user_id
  AND t.category = b.category
  AND t.type = 'DEBIT'
  AND TO_CHAR(t.date, 'YYYY-MM') = b.month
WHERE b.user_id = $1
  AND b.month = $2
GROUP BY b.category, b.amount;

-- Uses: idx_budgets_user_month + idx_transactions_user_category
```

### 5.5 Subscription Detection Query

```sql
-- Detect recurring merchants (3+ months, low variance)
SELECT
  merchant,
  COUNT(DISTINCT TO_CHAR(date, 'YYYY-MM')) AS month_count,
  AVG(amount)   AS avg_amount,
  STDDEV(amount) AS std_amount,
  MAX(date)     AS last_date
FROM transactions
WHERE user_id = $1
  AND type = 'DEBIT'
  AND merchant IS NOT NULL
GROUP BY merchant
HAVING COUNT(DISTINCT TO_CHAR(date, 'YYYY-MM')) >= 3
   AND (STDDEV(amount) / NULLIF(AVG(amount), 0)) < 0.1;

-- Uses: idx_transactions_merchant + idx_transactions_user_type
```

### 5.6 Duplicate Transaction Detection Query

```sql
-- Fraud: same merchant + same amount within 24 hours
SELECT
  t1.id AS original_id,
  t2.id AS duplicate_id,
  t1.merchant,
  t1.amount,
  t1.date AS original_date,
  t2.date AS duplicate_date
FROM transactions t1
JOIN transactions t2
  ON t1.user_id = t2.user_id
  AND t1.merchant = t2.merchant
  AND t1.amount   = t2.amount
  AND t1.id      != t2.id
  AND ABS(EXTRACT(EPOCH FROM (t1.created_at - t2.created_at))) < 86400
WHERE t1.user_id = $1;

-- Uses: idx_transactions_merchant + idx_transactions_user_id
```

### 5.7 Transaction List with Pagination

```sql
-- Paginated, filtered transaction list
SELECT *
FROM transactions
WHERE user_id = $1
  AND ($2::text IS NULL OR category = $2::category)
  AND ($3::text IS NULL OR merchant ILIKE '%' || $3 || '%')
  AND ($4::date IS NULL OR date >= $4)
  AND ($5::date IS NULL OR date <= $5)
ORDER BY date DESC, created_at DESC
LIMIT $6 OFFSET $7;

-- Uses: idx_transactions_user_date + idx_transactions_user_category
```

### 5.8 Merchant Learning Lookup

```sql
-- Layer 1 of categorization pipeline
SELECT category, correction_count
FROM merchant_learning
WHERE user_id = $1
  AND merchant_name = $2
LIMIT 1;

-- Uses: idx_merchant_learning_user_merchant (unique index = instant lookup)
```

---

## 6. Enum Definitions

### Category
```
Food | Groceries | Travel | Shopping | Entertainment |
Healthcare | Education | Utilities | EMI | Salary |
Investment | Transfer | Others
```

### TransactionType
```
CREDIT | DEBIT
```

### CategorySource (which pipeline layer categorized the transaction)
```
MERCHANT_LEARNING | RULE_ENGINE | ML_CLASSIFIER | GEMINI | FALLBACK | MANUAL
```

### AlertType
```
DUPLICATE | LARGE_TRANSACTION | SPENDING_SPIKE
```

### Frequency
```
WEEKLY | MONTHLY | YEARLY
```

### ChatRole
```
USER | ASSISTANT
```

---

*Phase 2 — Database Design Complete*
*Awaiting approval before proceeding to Phase 3 — Backend Development*
