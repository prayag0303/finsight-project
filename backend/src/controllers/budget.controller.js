const budgetService = require('../services/budget.service');
const { success, created } = require('../utils/response');

const findAll = async (req, res, next) => {
  try {
    const budgets = await budgetService.findAll(req.user.userId, req.query.month);
    success(res, budgets);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const budget = await budgetService.create(req.user.userId, req.body);
    created(res, budget, 'Budget created');
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const budget = await budgetService.update(req.user.userId, req.params.id, req.body.amount);
    success(res, budget, 'Budget updated');
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await budgetService.remove(req.user.userId, req.params.id);
    success(res, null, 'Budget deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { findAll, create, update, remove };
