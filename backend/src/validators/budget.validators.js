const { body, query } = require('express-validator');
const { CATEGORIES } = require('../config/constants');

const createBudgetValidators = [
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),

  body('month')
    .notEmpty().withMessage('Month is required')
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/).withMessage('Month must be in YYYY-MM format'),

  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
];

const updateBudgetValidators = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
];

const listBudgetValidators = [
  query('month')
    .optional()
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/).withMessage('Month must be in YYYY-MM format'),
];

module.exports = { createBudgetValidators, updateBudgetValidators, listBudgetValidators };
