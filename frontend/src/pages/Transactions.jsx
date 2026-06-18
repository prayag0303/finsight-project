import { useState } from 'react';
import { useTransactions, useReprocessCategories } from '../hooks/useTransactions';
import TransactionTable from '../components/transactions/TransactionTable';
import TransactionFilters from '../components/transactions/TransactionFilters';
import TransactionForm from '../components/transactions/TransactionForm';
import CSVUpload from '../components/transactions/CSVUpload';
import Button from '../components/ui/Button';

const DEFAULT_FILTERS = { page: 1, limit: 20 };

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
  </svg>
);

export default function Transactions() {
  const [filters, setFilters]    = useState(DEFAULT_FILTERS);
  const [showForm, setShowForm]  = useState(false);
  const [showCSV,  setShowCSV]   = useState(false);

  const { data, isLoading } = useTransactions(filters);
  const { mutate: reprocess, isPending: isReprocessing } = useReprocessCategories();

  return (
    <div className="space-y-4">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 13, color: '#aaa' }}>
            {data?.pagination?.total ? `${data.pagination.total} transactions` : ''}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="secondary"
              onClick={() => reprocess()}
              disabled={isReprocessing}
              icon={<RefreshIcon />}
              title="Re-run AI categorization on all uncategorised transactions"
            >
              {isReprocessing ? 'Reprocessing…' : 'Reprocess'}
            </Button>
            <Button variant="secondary" onClick={() => setShowCSV(true)}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}>
              Import CSV
            </Button>
            <Button onClick={() => setShowForm(true)}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}>
              Add Transaction
            </Button>
          </div>
        </div>
      </div>

      <TransactionFilters filters={filters} onChange={setFilters} />

      <TransactionTable
        data={data?.data}
        isLoading={isLoading}
        pagination={data?.pagination}
        onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
      />

      {showForm && <TransactionForm onClose={() => setShowForm(false)} />}
      {showCSV  && <CSVUpload      onClose={() => setShowCSV(false)}  />}
    </div>
  );
}
