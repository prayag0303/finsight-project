export const formatCurrency = (amount, compact = false) => {
  const num = parseFloat(amount) || 0;
  if (compact) {
    if (num >= 1_00_000) return `₹${(num / 1_00_000).toFixed(1)}L`;
    if (num >= 1_000)    return `₹${(num / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatDate = (dateStr, options = {}) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...options,
  });
};

export const formatShortDate = (dateStr) =>
  formatDate(dateStr, { day: 'numeric', month: 'short', year: undefined });

export const formatMonthYear = (yyyyMM) => {
  if (!yyyyMM) return '';
  const [year, month] = yyyyMM.split('-');
  const date = new Date(year, parseInt(month, 10) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

export const formatPercent = (value, decimals = 1) => {
  const num = parseFloat(value) || 0;
  return `${num.toFixed(decimals)}%`;
};

export const formatChange = (change) => {
  const num = parseFloat(change) || 0;
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(1)}%`;
};

export const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const confidence = (score) => {
  const pct = Math.round((parseFloat(score) || 0) * 100);
  if (pct >= 90) return { label: `${pct}%`, color: 'text-emerald-400' };
  if (pct >= 70) return { label: `${pct}%`, color: 'text-amber-400' };
  return { label: `${pct}%`, color: 'text-rose-400' };
};
