const CATEGORIES = [
  'Food', 'Groceries', 'Travel', 'Shopping', 'Entertainment',
  'Healthcare', 'Education', 'Utilities', 'EMI', 'Salary',
  'Investment', 'Transfer', 'Others',
];

const TRANSACTION_TYPES = ['CREDIT', 'DEBIT'];

const CATEGORY_SOURCES = [
  'MERCHANT_LEARNING', 'RULE_ENGINE', 'ML_CLASSIFIER', 'GEMINI', 'FALLBACK', 'MANUAL',
];

const ALERT_TYPES = ['DUPLICATE', 'LARGE_TRANSACTION', 'SPENDING_SPIKE'];

const FREQUENCIES = ['WEEKLY', 'MONTHLY', 'YEARLY'];

const SUPPORTED_BANKS = ['HDFC', 'SBI', 'ICICI', 'AXIS', 'KOTAK', 'GENERIC'];

const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
};

// Gemini confidence threshold — below this, fall back to next layer
const AI_CONFIDENCE_THRESHOLD = 0.70;

// Subscription detection — coefficient of variation threshold
const SUBSCRIPTION_COV_THRESHOLD = 0.10;

// Subscription detection — minimum months required
const SUBSCRIPTION_MIN_MONTHS = 3;

// Fraud detection — large transaction multiplier
const FRAUD_LARGE_TX_MULTIPLIER = 3;

// Fraud detection — duplicate window in hours
const FRAUD_DUPLICATE_WINDOW_HOURS = 24;

module.exports = {
  CATEGORIES,
  TRANSACTION_TYPES,
  CATEGORY_SOURCES,
  ALERT_TYPES,
  FREQUENCIES,
  SUPPORTED_BANKS,
  PAGINATION_DEFAULTS,
  AI_CONFIDENCE_THRESHOLD,
  SUBSCRIPTION_COV_THRESHOLD,
  SUBSCRIPTION_MIN_MONTHS,
  FRAUD_LARGE_TX_MULTIPLIER,
  FRAUD_DUPLICATE_WINDOW_HOURS,
};
