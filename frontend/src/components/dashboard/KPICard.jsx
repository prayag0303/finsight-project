import { formatCurrency } from '../../utils/formatters';

export default function KPICard({
  title, value, change, changeLabel, icon, color = 'blue',
  invertChange = false,
}) {
  const num = parseFloat(change);
  const isNeutral = change === undefined || change === null || isNaN(num);
  const isGood = invertChange ? num < 0 : num > 0;

  return (
    <div className="card p-5">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
          {title}
        </p>
        {icon && (
          <span style={{ fontSize: 16, opacity: 0.6 }}>{icon}</span>
        )}
      </div>
      <p style={{ fontSize: 21, fontWeight: 500, color: '#111', letterSpacing: '-0.5px', marginBottom: 4, lineHeight: 1 }}>
        {typeof value === 'number' ? formatCurrency(value) : (value ?? '—')}
      </p>
      {!isNeutral && (
        <p className={isGood ? 'stat-up' : 'stat-down'} style={{ fontSize: 12, marginTop: 2 }}>
          {num > 0 ? '↑' : '↓'} {Math.abs(num).toFixed(1)}%
          {changeLabel ? ` · ${changeLabel}` : ' vs last month'}
        </p>
      )}
      {isNeutral && changeLabel && (
        <p style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{changeLabel}</p>
      )}
    </div>
  );
}
