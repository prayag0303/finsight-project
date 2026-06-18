const { prisma } = require('../config/database');
const AppError = require('../utils/AppError');

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthBounds = (month) => {
  const [year, mon] = month.split('-').map(Number);
  return {
    start: new Date(year, mon - 1, 1),
    end: new Date(year, mon, 0, 23, 59, 59, 999),
  };
};

const findAll = async (userId, month) => {
  const m = month || currentMonth();
  const { start, end } = getMonthBounds(m);

  const [budgets, spentData] = await Promise.all([
    prisma.budget.findMany({ where: { userId, month: m }, orderBy: { category: 'asc' } }),
    prisma.transaction.groupBy({
      by: ['category'],
      where: { userId, type: 'DEBIT', date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
  ]);

  const spentMap = {};
  for (const s of spentData) {
    spentMap[s.category] = parseFloat(s._sum.amount || 0);
  }

  return budgets.map((b) => {
    const spent = spentMap[b.category] || 0;
    const limit = parseFloat(b.amount);
    const remaining = limit - spent;
    const usagePct = limit > 0 ? parseFloat(((spent / limit) * 100).toFixed(1)) : 0;
    return {
      ...b,
      amount: limit,
      spent: parseFloat(spent.toFixed(2)),
      remaining: parseFloat(remaining.toFixed(2)),
      usagePercent: usagePct,
      isOverBudget: spent > limit,
      isNearLimit: usagePct >= 90 && spent <= limit,
    };
  });
};

const create = async (userId, data) => {
  try {
    return await prisma.budget.create({
      data: {
        userId,
        category: data.category,
        month: data.month,
        amount: parseFloat(data.amount),
      },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      throw new AppError(`A budget for ${data.category} in ${data.month} already exists.`, 409);
    }
    throw err;
  }
};

const update = async (userId, id, amount) => {
  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) throw new AppError('Budget not found.', 404);

  return prisma.budget.update({
    where: { id },
    data: { amount: parseFloat(amount) },
  });
};

const remove = async (userId, id) => {
  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) throw new AppError('Budget not found.', 404);
  await prisma.budget.delete({ where: { id } });
};

// Used by AI service function calling
const getBudgetStatus = async (userId, month) => {
  return findAll(userId, month);
};

module.exports = { findAll, create, update, remove, getBudgetStatus };
