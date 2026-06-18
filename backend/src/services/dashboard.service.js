const { prisma } = require('../config/database');

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthBounds = (month) => {
  const [year, mon] = month.split('-').map(Number);
  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 0, 23, 59, 59, 999);
  return { start, end };
};

// Returns the most recent YYYY-MM that has at least one transaction for this user
const getLatestMonth = async (userId) => {
  const result = await prisma.$queryRaw`
    SELECT TO_CHAR(date, 'YYYY-MM') AS month
    FROM transactions
    WHERE user_id = ${userId}
    ORDER BY date DESC
    LIMIT 1
  `;
  return result.length > 0 ? result[0].month : null;
};

// Returns sorted-descending list of all YYYY-MM strings that have transactions
const getMonthsWithData = async (userId) => {
  const result = await prisma.$queryRaw`
    SELECT DISTINCT TO_CHAR(date, 'YYYY-MM') AS month
    FROM transactions
    WHERE user_id = ${userId}
    ORDER BY month DESC
  `;
  return result.map((r) => r.month);
};

const getSummary = async (userId, month) => {
  const m = month || currentMonth();
  const { start, end } = getMonthBounds(m);

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lte: end } },
    select: { amount: true, type: true, category: true },
  });

  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryMap = {};

  for (const t of transactions) {
    const amt = parseFloat(t.amount);
    if (t.type === 'CREDIT') {
      totalIncome += amt;
    } else {
      totalExpenses += amt;
      categoryMap[t.category] = (categoryMap[t.category] || 0) + amt;
    }
  }

  const savings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0
    ? parseFloat(((savings / totalIncome) * 100).toFixed(1))
    : 0;

  const topEntry = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0];
  const topCategory = topEntry?.[0] || null;
  const topCategoryAmount = topEntry ? parseFloat(topEntry[1].toFixed(2)) : null;

  // MoM comparison — previous month
  const [prevYear, prevMon] = m.split('-').map(Number);
  const prevMonthDate = new Date(prevYear, prevMon - 2, 1);
  const prevMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const { start: prevStart, end: prevEnd } = getMonthBounds(prevMonth);

  const [prevExpAgg, prevIncAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: 'DEBIT', date: { gte: prevStart, lte: prevEnd } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'CREDIT', date: { gte: prevStart, lte: prevEnd } },
      _sum: { amount: true },
    }),
  ]);

  const prevExpenses = parseFloat(prevExpAgg._sum.amount || 0);
  const prevIncome   = parseFloat(prevIncAgg._sum.amount || 0);

  const expensesChangePct = prevExpenses > 0
    ? parseFloat(((totalExpenses - prevExpenses) / prevExpenses * 100).toFixed(1))
    : null;
  const incomeChangePct = prevIncome > 0
    ? parseFloat(((totalIncome - prevIncome) / prevIncome * 100).toFixed(1))
    : null;

  // ── Health Score ───────────────────────────────────────────────────────────
  // Component 1: savings rate (0-50 pts)
  const savingsComponent = Math.min(50, Math.max(0, savingsRate) * 0.5);

  // Component 2: budget adherence (0-30 pts)
  const budgets = await prisma.budget.findMany({
    where: { userId, month: m },
    select: { category: true, amount: true },
  });

  let adherenceScore = 50; // neutral when no budgets set
  if (budgets.length > 0) {
    const scores = budgets.map((b) => {
      const spent = categoryMap[b.category] || 0;
      const limit = parseFloat(b.amount);
      if (limit <= 0) return 100;
      // full score if within budget; decreases to 0 at 2× the limit
      return spent <= limit ? 100 : Math.max(0, (1 - (spent - limit) / limit) * 100);
    });
    adherenceScore = scores.reduce((a, s) => a + s, 0) / scores.length;
  }
  const adherenceComponent = adherenceScore * 0.3;

  // Component 3: anomaly penalty (0-20 pts)
  const anomalyCount = await prisma.fraudAlert.count({
    where: { userId, isResolved: false },
  });
  const anomalyComponent = Math.max(0, (100 - anomalyCount * 10) * 0.2);

  const healthScore = Math.max(0, Math.min(100,
    Math.round(savingsComponent + adherenceComponent + anomalyComponent)
  ));

  return {
    month: m,
    totalIncome:     parseFloat(totalIncome.toFixed(2)),
    totalExpenses:   parseFloat(totalExpenses.toFixed(2)),
    savings:         parseFloat(savings.toFixed(2)),
    savingsRate,
    topCategory,
    topCategoryAmount,
    expensesChangePct,
    incomeChangePct,
    momExpenseChange: expensesChangePct, // backward compat
    healthScore,
  };
};

const getCategoryBreakdown = async (userId, month) => {
  const m = month || currentMonth();
  const { start, end } = getMonthBounds(m);

  const transactions = await prisma.transaction.findMany({
    where: { userId, type: 'DEBIT', date: { gte: start, lte: end } },
    select: { category: true, amount: true },
  });

  const map = {};
  let total = 0;
  for (const t of transactions) {
    const amt = parseFloat(t.amount);
    total += amt;
    if (!map[t.category]) map[t.category] = { total: 0, count: 0 };
    map[t.category].total += amt;
    map[t.category].count += 1;
  }

  return Object.entries(map)
    .map(([category, { total: catTotal, count }]) => ({
      category,
      total:      parseFloat(catTotal.toFixed(2)),
      count,
      percentage: total > 0 ? parseFloat(((catTotal / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.total - a.total);
};

const getMonthlyTrend = async (userId, months = 6) => {
  const trend = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const { start, end } = getMonthBounds(month);

    const txs = await prisma.transaction.findMany({
      where: { userId, date: { gte: start, lte: end } },
      select: { amount: true, type: true },
    });

    let income = 0;
    let expenses = 0;
    for (const t of txs) {
      const amt = parseFloat(t.amount);
      if (t.type === 'CREDIT') income += amt;
      else expenses += amt;
    }

    trend.push({
      month,
      income:   parseFloat(income.toFixed(2)),
      expenses: parseFloat(expenses.toFixed(2)),
      savings:  parseFloat((income - expenses).toFixed(2)),
    });
  }

  return trend;
};

const getCategoryTrend = async (userId, months = 6) => {
  const now = new Date();
  const result = {};

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const { start, end } = getMonthBounds(month);

    const txs = await prisma.transaction.findMany({
      where: { userId, type: 'DEBIT', date: { gte: start, lte: end } },
      select: { category: true, amount: true },
    });

    for (const t of txs) {
      if (!result[t.category]) result[t.category] = [];
      const existing = result[t.category].find((r) => r.month === month);
      if (existing) {
        existing.total += parseFloat(t.amount);
      } else {
        result[t.category].push({ month, total: parseFloat(t.amount) });
      }
    }
  }

  return result;
};

const getCategoryTotal = async (userId, category, month) => {
  const m = month || currentMonth();
  const { start, end } = getMonthBounds(m);

  const result = await prisma.transaction.aggregate({
    where: { userId, category, type: 'DEBIT', date: { gte: start, lte: end } },
    _sum: { amount: true },
    _count: { id: true },
  });

  const confirmed = await prisma.transaction.aggregate({
    where: { userId, category, type: 'DEBIT', date: { gte: start, lte: end }, confidence: { gte: 0.7 } },
    _sum: { amount: true },
  });

  const potential = await prisma.transaction.aggregate({
    where: { userId, category, type: 'DEBIT', date: { gte: start, lte: end }, confidence: { lt: 0.7 } },
    _sum: { amount: true },
  });

  return {
    category,
    month: m,
    total:     parseFloat(result._sum.amount || 0).toFixed(2),
    count:     result._count.id,
    confirmed: parseFloat(confirmed._sum.amount || 0).toFixed(2),
    potential: parseFloat(potential._sum.amount || 0).toFixed(2),
  };
};

const getSpendingTrend = async (userId, months = 6) => getMonthlyTrend(userId, months);

module.exports = {
  getLatestMonth,
  getMonthsWithData,
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrend,
  getCategoryTrend,
  getCategoryTotal,
  getSpendingTrend,
};
