import { formatCurrency, formatDate } from '../../utils/formatters';

const TYPE_STYLES = {
  DUPLICATE:         { bg: '#fff3cd', color: '#856404', label: 'Possible duplicate' },
  LARGE_TRANSACTION: { bg: '#f8d7da', color: '#842029', label: 'Large transaction' },
  SPENDING_SPIKE:    { bg: '#fce4ec', color: '#880e4f', label: 'Spending spike' },
};

const TYPE_ICONS = {
  DUPLICATE:         '👯',
  LARGE_TRANSACTION: '💸',
  SPENDING_SPIKE:    '📈',
};

export default function FraudAlertCard({ alert, onResolve }) {
  const { alertType, description, transaction, isResolved, createdAt } = alert;
  const style = TYPE_STYLES[alertType] || { bg: '#f0f0f0', color: '#555', label: alertType };

  return (
    <div className="card p-5" style={{ opacity: isResolved ? 0.55 : 1 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 20, marginTop: 1 }}>{TYPE_ICONS[alertType]}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, fontWeight: 500,
              padding: '2px 8px', borderRadius: 99,
              background: style.bg, color: style.color,
            }}>
              {style.label}
            </span>
            {isResolved && (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#f0f0f0', color: '#777' }}>
                Resolved
              </span>
            )}
            <span style={{ fontSize: 11, color: '#aaa', marginLeft: 'auto' }}>{formatDate(createdAt)}</span>
          </div>

          {/* Description */}
          <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{description}</p>

          {/* Transaction details */}
          {transaction && (
            <div style={{
              marginTop: 10,
              background: '#fafafa',
              border: '0.5px solid #ebebeb',
              borderRadius: 8,
              padding: '10px 12px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8,
            }}>
              <div>
                <p style={{ fontSize: 10, color: '#aaa', marginBottom: 2 }}>Amount</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>{formatCurrency(transaction.amount)}</p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: '#aaa', marginBottom: 2 }}>Merchant</p>
                <p style={{ fontSize: 13, color: '#111' }}>{transaction.merchant || '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: '#aaa', marginBottom: 2 }}>Date</p>
                <p style={{ fontSize: 13, color: '#555' }}>{formatDate(transaction.date)}</p>
              </div>
            </div>
          )}

          {!isResolved && (
            <button
              onClick={() => onResolve(alert.id)}
              style={{ marginTop: 10, fontSize: 12, color: '#777', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#111')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#777')}
            >
              Mark as resolved →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
