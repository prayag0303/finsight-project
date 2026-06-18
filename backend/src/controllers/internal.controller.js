// Internal endpoints called by the AI service for Gemini function calling.
// Protected by X-Internal-Key — never called by the browser.

const dashboardService = require('../services/dashboard.service');
const budgetService = require('../services/budget.service');
const { prisma } = require('../config/database');
const { success } = require('../utils/response');

const getCategoryTotal = async (req, res, next) => {
  try {
    const { userId, category, month } = req.query;
    const data = await dashboardService.getCategoryTotal(userId, category, month);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

const getMonthlySummary = async (req, res, next) => {
  try {
    const { userId, month } = req.query;
    const data = await dashboardService.getSummary(userId, month);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

const getTopCategory = async (req, res, next) => {
  try {
    const { userId, month } = req.query;
    const breakdown = await dashboardService.getCategoryBreakdown(userId, month);
    success(res, { topCategory: breakdown[0] || null, breakdown });
  } catch (err) {
    next(err);
  }
};

const getBudgetStatus = async (req, res, next) => {
  try {
    const { userId, month } = req.query;
    const data = await budgetService.getBudgetStatus(userId, month);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

const getSubscriptionList = async (req, res, next) => {
  try {
    const { userId } = req.query;
    const subscriptions = await prisma.subscription.findMany({
      where: { userId, isActive: true },
      orderBy: { averageAmount: 'desc' },
    });
    success(res, subscriptions);
  } catch (err) {
    next(err);
  }
};

const getAnomalies = async (req, res, next) => {
  try {
    const { userId } = req.query;
    const alerts = await prisma.fraudAlert.findMany({
      where: { userId, isResolved: false },
      include: {
        transaction: { select: { amount: true, description: true, merchant: true, date: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    success(res, alerts);
  } catch (err) {
    next(err);
  }
};

const getSpendingTrend = async (req, res, next) => {
  try {
    const { userId, months } = req.query;
    const data = await dashboardService.getSpendingTrend(userId, parseInt(months) || 6);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCategoryTotal,
  getMonthlySummary,
  getTopCategory,
  getBudgetStatus,
  getSubscriptionList,
  getAnomalies,
  getSpendingTrend,
};
