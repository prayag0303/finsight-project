export const CATEGORIES = [
  'Food','Groceries','Travel','Shopping','Entertainment',
  'Healthcare','Education','Utilities','EMI','Salary',
  'Investment','Transfer','Others',
];

export const CATEGORY_COLORS = {
  Food:          '#f97316',
  Groceries:     '#22c55e',
  Travel:        '#3b82f6',
  Shopping:      '#a855f7',
  Entertainment: '#ec4899',
  Healthcare:    '#14b8a6',
  Education:     '#f59e0b',
  Utilities:     '#64748b',
  EMI:           '#ef4444',
  Salary:        '#10b981',
  Investment:    '#6366f1',
  Transfer:      '#78716c',
  Others:        '#94a3b8',
};

export const CATEGORY_ICONS = {
  Food:          '🍔',
  Groceries:     '🛒',
  Travel:        '✈️',
  Shopping:      '🛍️',
  Entertainment: '🎬',
  Healthcare:    '🏥',
  Education:     '📚',
  Utilities:     '💡',
  EMI:           '🏦',
  Salary:        '💰',
  Investment:    '📈',
  Transfer:      '↔️',
  Others:        '📦',
};

export const TRANSACTION_TYPES = ['CREDIT', 'DEBIT'];

export const ALERT_TYPE_LABELS = {
  DUPLICATE:        'Duplicate',
  LARGE_TRANSACTION:'Large Transaction',
  SPENDING_SPIKE:   'Spending Spike',
};

export const ALERT_TYPE_COLORS = {
  DUPLICATE:        'bg-amber-50 text-amber-700 border-amber-200',
  LARGE_TRANSACTION:'bg-red-50 text-red-700 border-red-200',
  SPENDING_SPIKE:   'bg-orange-50 text-orange-700 border-orange-200',
};

export const SAVINGS_PRIORITY_COLORS = {
  HIGH:   'bg-red-50 text-red-700',
  MEDIUM: 'bg-amber-50 text-amber-700',
  LOW:    'bg-gray-100 text-gray-500',
};

export const NAV_ITEMS = [
  { to: '/dashboard',     label: 'Dashboard',       icon: 'grid',           group: 'Overview' },
  { to: '/transactions',  label: 'Transactions',    icon: 'list',           group: 'Overview' },
  { to: '/budgets',       label: 'Budget',          icon: 'target',         group: 'Plan' },
  { to: '/subscriptions', label: 'Subscriptions',   icon: 'repeat',         group: 'Plan' },
  { to: '/fraud-alerts',  label: 'Fraud alerts',    icon: 'shield',         group: 'Insights' },
  { to: '/savings',       label: 'Savings',         icon: 'piggy-bank',     group: 'Insights' },
  { to: '/insights',      label: 'AI insights',     icon: 'sparkles',       group: 'Insights' },
  { to: '/chat',          label: 'Ask FinSight',    icon: 'message-circle', group: 'Insights' },
];

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export const SUGGESTED_CHAT_QUESTIONS = [
  'How much did I spend on food this month?',
  'What is my biggest expense category?',
  'Show me unusual transactions',
  'How much have I saved this month?',
  'Which subscriptions cost the most?',
  'Am I overspending on food delivery?',
  'What is my savings rate?',
  'How can I save more money?',
];
