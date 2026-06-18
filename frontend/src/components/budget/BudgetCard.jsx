import { formatCurrency, formatPercent } from '../../utils/formatters';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../utils/constants';
import { useDeleteBudget } from '../../hooks/useBudgets';

export default function BudgetCard({ budget, onEdit }) {
  const { mutate: remove } = useDeleteBudget();
  const { category, amount, spent = 0, remaining, usagePercent = 0 } = budget;
  const color = CATEGORY_COLORS[category] || '#d0d0d0';
  const isWarning  = usagePercent >= 80 && usagePercent < 100;
  const isExceeded = usagePercent >= 100;

  return (
    <div className="card p-5" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{CATEGORY_ICONS[category]}</span>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{category}</p>
        </div>
        {isExceeded && (
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#f8d7da', color: '#842029', fontWeight: 500 }}>
            Over budget
          </span>
        )}
        {isWarning && !isExceeded && (
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#fff3cd', color: '#856404', fontWeight: 500 }}>
            Near limit
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#777' }}>
          <span>{formatCurrency(spent)} spent</span>
          <span>{formatPercent(usagePercent)} used</span>
        </div>
        <div style={{ height: 6, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              borderRadius: 99,
              transition: 'width 0.5s',
              width: `${Math.min(usagePercent, 100)}%`,
              backgroundColor: isExceeded ? '#dc2626' : isWarning ? '#f59e0b' : color,
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: remaining < 0 ? '#dc2626' : '#777' }}>
            {remaining < 0 ? `${formatCurrency(Math.abs(remaining))} over` : `${formatCurrency(remaining)} left`}
          </span>
          <span style={{ color: '#aaa' }}>Limit: {formatCurrency(amount)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '0.5px solid #f0f0f0' }}>
        <button onClick={onEdit} className="btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>Edit</button>
        <button
          onClick={() => remove(budget.id)}
          className="btn-ghost"
          style={{ flex: 1, justifyContent: 'center', fontSize: 12, color: '#dc2626' }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
