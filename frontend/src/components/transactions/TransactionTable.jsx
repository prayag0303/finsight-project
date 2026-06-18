import { useState } from 'react';
import { CategoryBadge, TypeBadge } from '../ui/Badge';
import { formatCurrency, formatShortDate } from '../../utils/formatters';
import { useDeleteTransaction } from '../../hooks/useTransactions';
import CategoryCorrection from './CategoryCorrection';
import { TableRowSkeleton } from '../ui/Skeleton';

export default function TransactionTable({ data, isLoading, pagination, onPageChange }) {
  const [correcting, setCorrecting] = useState(null);
  const { mutate: deleteTransaction } = useDeleteTransaction();

  if (isLoading) return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm"><tbody><TableRowSkeleton rows={8} /></tbody></table>
    </div>
  );

  if (!data?.length) return (
    <div className="card p-12 text-center">
      <p style={{ fontSize: 36, marginBottom: 10 }}>🧾</p>
      <p style={{ fontSize: 13, color: '#aaa' }}>No transactions found</p>
    </div>
  );

  return (
    <>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '0.5px solid #f0f0f0' }}>
                {['Date','Description','Merchant','Amount','Type','Category',''].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 500, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '0.5px solid #f8f8f8', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <td style={{ padding: '10px 16px', color: '#aaa', whiteSpace: 'nowrap' }}>{formatShortDate(tx.date)}</td>
                  <td style={{ padding: '10px 16px', maxWidth: 200 }}>
                    <p style={{ color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tx.description}>{tx.description}</p>
                    {tx.notes && <p style={{ fontSize: 11, color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.notes}</p>}
                  </td>
                  <td style={{ padding: '10px 16px', color: '#777', whiteSpace: 'nowrap' }}>{tx.merchant || '—'}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 600, whiteSpace: 'nowrap', color: tx.type === 'CREDIT' ? '#16a34a' : '#dc2626' }}>
                    {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                  <td style={{ padding: '10px 16px' }}><TypeBadge type={tx.type} /></td>
                  <td style={{ padding: '10px 16px' }}><CategoryBadge category={tx.category} /></td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button onClick={() => setCorrecting(tx)} className="btn-ghost" style={{ fontSize: 12, padding: '2px 6px' }} title="Correct category">✏️</button>
                      <button onClick={() => { if (confirm('Delete this transaction?')) deleteTransaction(tx.id); }} className="btn-ghost" style={{ fontSize: 12, padding: '2px 6px', color: '#dc2626' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <p style={{ fontSize: 12, color: '#aaa' }}>
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="btn-secondary"
              style={{ fontSize: 12, padding: '4px 12px', opacity: pagination.page <= 1 ? 0.4 : 1 }}
            >← Prev</button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="btn-secondary"
              style={{ fontSize: 12, padding: '4px 12px', opacity: pagination.page >= pagination.totalPages ? 0.4 : 1 }}
            >Next →</button>
          </div>
        </div>
      )}

      {correcting && (
        <CategoryCorrection transaction={correcting} onClose={() => setCorrecting(null)} />
      )}
    </>
  );
}
