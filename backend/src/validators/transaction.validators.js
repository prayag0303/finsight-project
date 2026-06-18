const { body, query } = require('express-validator');
const { CATEGORIES, TRANSACTION_TYPES } = require('../config/constants');

const createTransactionValidators = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 500 }).withMessage('Description must be under 500 characters'),

  body('merchant')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Merchant name must be under 100 characters'),

  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Date must be a valid ISO date (YYYY-MM-DD)'),

  body('type')
    .notEmpty().withMessage('Type is required')
    .isIn(TRANSACTION_TYPES).withMessage(`Type must be one of: ${TRANSACTION_TYPES.join(', ')}`),

  body('category')
    .optional()
    .isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),

  body('notes')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must be under 500 characters'),
];

const updateTransactionValidators = [
  body('amount')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must be under 500 characters'),

  body('merchant')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Merchant name must be under 100 characters'),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid ISO date (YYYY-MM-DD)'),

  body('type')
    .optional()
    .isIn(TRANSACTION_TYPES).withMessage(`Type must be one of: ${TRANSACTION_TYPES.join(', ')}`),

  body('category')
    .optional()
    .isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),

  body('notes')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must be under 500 characters'),
];

const listTransactionValidators = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1–100'),
  query('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
  query('type').optional().isIn(TRANSACTION_TYPES).withMessage('Invalid type'),
  query('startDate').optional().isISO8601().withMessage('startDate must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('endDate must be a valid date'),
];

module.exports = { createTransactionValidators, updateTransactionValidators, listTransactionValidators };
