// Category badge colors from design spec
const CATEGORY_BADGE = {
  Food:          { bg: '#fff3cd', color: '#856404' },
  Groceries:     { bg: '#fff3cd', color: '#856404' },
  Travel:        { bg: '#cfe2ff', color: '#084298' },
  Shopping:      { bg: '#e8d5f5', color: '#5a189a' },
  Entertainment: { bg: '#fce4ec', color: '#880e4f' },
  Salary:        { bg: '#d1e7dd', color: '#0a3622' },
  EMI:           { bg: '#f8d7da', color: '#842029' },
  Utilities:     { bg: '#e2f0cb', color: '#386641' },
  Healthcare:    { bg: '#d1ecf1', color: '#0c5460' },
  Education:     { bg: '#e2d9f3', color: '#4a235a' },
  Investment:    { bg: '#d4edda', color: '#155724' },
  Transfer:      { bg: '#f0f0f0', color: '#555' },
  Others:        { bg: '#f0f0f0', color: '#555' },
};

export function CategoryBadge({ category }) {
  const style = CATEGORY_BADGE[category] || CATEGORY_BADGE.Others;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 500,
      background: style.bg,
      color: style.color,
      whiteSpace: 'nowrap',
    }}>
      {category}
    </span>
  );
}

export function TypeBadge({ type }) {
  const isCredit = type === 'CREDIT';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 500,
      background: isCredit ? '#d1e7dd' : '#f8d7da',
      color:      isCredit ? '#0a3622' : '#842029',
    }}>
      {isCredit ? 'Credit' : 'Debit'}
    </span>
  );
}

// SourceBadge kept for backward compat but not shown in table
export function SourceBadge({ source }) {
  return null;
}

export default function Badge({ children, variant = 'default' }) {
  const styles = {
    default: { bg: '#f0f0f0', color: '#555' },
    success: { bg: '#d1e7dd', color: '#0a3622' },
    warning: { bg: '#fff3cd', color: '#856404' },
    danger:  { bg: '#f8d7da', color: '#842029' },
    info:    { bg: '#cfe2ff', color: '#084298' },
  };
  const s = styles[variant] || styles.default;
  return (
    <span className="badge" style={{ background: s.bg, color: s.color }}>
      {children}
    </span>
  );
}
