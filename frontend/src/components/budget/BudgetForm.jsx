import { useState } from 'react';
import Modal from '../ui/Modal';
import Input, { Select } from '../ui/Input';
import Button from '../ui/Button';
import { CATEGORIES } from '../../utils/constants';
import { useCreateBudget, useUpdateBudget } from '../../hooks/useBudgets';
import { currentMonth } from '../../utils/formatters';

export default function BudgetForm({ budget, onClose }) {
  const isEdit = !!budget;
  const [form, setForm] = useState({
    category: budget?.category || 'Food',
    amount:   budget?.amount   || '',
    month:    budget?.month    || currentMonth(),
  });
  const [errors, setErrors] = useState({});
  const { mutate: create, isPending: creating } = useCreateBudget();
  const { mutate: update, isPending: updating } = useUpdateBudget();
  const isPending = creating || updating;

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setErrors({ amount: 'Enter a valid budget amount' }); return;
    }
    const payload = { ...form, amount: parseFloat(form.amount) };
    if (isEdit) {
      update({ id: budget.id, data: payload }, { onSuccess: onClose });
    } else {
      create(payload, { onSuccess: onClose });
    }
  };

  return (
    <Modal isOpen title={isEdit ? 'Edit Budget' : 'Set Budget'} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="Category" value={form.category} onChange={set('category')} disabled={isEdit}>
          {CATEGORIES.filter((c) => !['Salary','Investment','Transfer'].includes(c)).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Input label="Monthly Limit (₹)" type="number" min="1" placeholder="5000" value={form.amount} onChange={set('amount')} error={errors.amount} />
        <Input label="Month" type="month" value={form.month} onChange={set('month')} />
        <div className="flex gap-3 pt-1">
          <Button type="submit" loading={isPending}>{isEdit ? 'Update Budget' : 'Set Budget'}</Button>
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
