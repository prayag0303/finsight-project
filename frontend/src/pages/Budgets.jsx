import { useState } from 'react';
import { useBudgets } from '../hooks/useBudgets';
import BudgetCard from '../components/budget/BudgetCard';
import BudgetForm from '../components/budget/BudgetForm';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { KPICardSkeleton } from '../components/ui/Skeleton';
import { currentMonth, formatMonthYear } from '../utils/formatters';

export default function Budgets() {
  const [month] = useState(currentMonth());
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);

  const { data: budgets, isLoading } = useBudgets(month);

  const openEdit = (b) => setEditing(b);
  const closeForm = () => { setShowForm(false); setEditing(null); };

  return (
    <div className="space-y-6">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 13, color: '#aaa' }}>{formatMonthYear(month)}</p>
        <Button onClick={() => setShowForm(true)}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}>
          Set Budget
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <KPICardSkeleton key={i} />)}
        </div>
      ) : budgets?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {budgets.map((b) => <BudgetCard key={b.id} budget={b} onEdit={() => openEdit(b)} />)}
        </div>
      ) : (
        <EmptyState
          icon="🎯"
          title="No budgets set"
          description="Set monthly spending limits to stay on track."
          action={() => setShowForm(true)}
          actionLabel="Set your first budget"
        />
      )}

      {(showForm || editing) && <BudgetForm budget={editing} onClose={closeForm} />}
    </div>
  );
}
