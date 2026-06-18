const dashboardService = require('../services/dashboard.service');
const { success } = require('../utils/response');

const getSummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getSummary(req.user.userId, req.query.month);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

const getCharts = async (req, res, next) => {
  try {
    const [categoryBreakdown, monthlyTrend] = await Promise.all([
      dashboardService.getCategoryBreakdown(req.user.userId, req.query.month),
      dashboardService.getMonthlyTrend(req.user.userId, 6),
    ]);
    success(res, { categoryBreakdown, monthlyTrend });
  } catch (err) {
    next(err);
  }
};

const getTrends = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months) || 12;
    const [monthlyTrend, categoryTrend] = await Promise.all([
      dashboardService.getMonthlyTrend(req.user.userId, months),
      dashboardService.getCategoryTrend(req.user.userId, months),
    ]);
    success(res, { monthlyTrend, categoryTrend });
  } catch (err) {
    next(err);
  }
};

const getLatestMonth = async (req, res, next) => {
  try {
    const month = await dashboardService.getLatestMonth(req.user.userId);
    success(res, month ? { month } : null);
  } catch (err) {
    next(err);
  }
};

const getMonthsWithData = async (req, res, next) => {
  try {
    const months = await dashboardService.getMonthsWithData(req.user.userId);
    success(res, { months });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getCharts, getTrends, getLatestMonth, getMonthsWithData };
