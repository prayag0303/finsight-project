import { formatCurrency, formatShortDate } from '../../utils/formatters';
import { CATEGORY_ICONS } from '../../utils/constants';

export default function SubscriptionCard({ sub }) {
  const { merchant, averageAmount, frequency, lastCharged, nextExpected, transactionCount, category } = sub;

  return (
    <div className="card p-5">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: '#f5f5f5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17,
          }}>
            {CATEGORY_ICONS[category] || '🔄'}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{merchant}</p>
            <p style={{ fontSize: 12, color: '#aaa', marginTop: 1 }}>
              {frequency.charAt(0) + frequency.slice(1).toLowerCase()} · {transactionCount} charges
            </p>
          </div>
        </div>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{formatCurrency(averageAmount)}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 12, borderTop: '0.5px solid #f0f0f0' }}>
        <div>
          <p style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Last Charged</p>
          <p style={{ fontSize: 12, color: '#555' }}>{formatShortDate(lastCharged)}</p>
        </div>
        {nextExpected && (
          <div>
            <p style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Next Expected</p>
            <p style={{ fontSize: 12, color: '#555' }}>{formatShortDate(nextExpected)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
