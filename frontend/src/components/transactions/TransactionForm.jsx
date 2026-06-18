import { useState } from 'react';
import Modal from '../ui/Modal';
import Input, { Select } from '../ui/Input';
import Button from '../ui/Button';
import { CATEGORIES } from '../../utils/constants';
import { useCreateTransaction } from '../../hooks/useTransactions';

const defaultForm = { amount: '', description: '', merchant: '', date: new Date().toISOString().slice(0,10), type: 'DEBIT', category: 'Others', notes: '' };

export default function TransactionForm({ onClose }) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const { mutate: create, isPending } = useCreateTransaction();

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) e.amount = 'Enter a valid amount';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.date) e.date = 'Date is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    create({ ...form, amount: parseFloat(form.amount) }, { onSuccess: onClose });
  };

  return (
    <Modal isOpen title="Add Transaction" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Amount (₹)" type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={set('amount')} error={errors.amount} />
          <Select label="Type" value={form.type} onChange={set('type')}>
            <option value="DEBIT">Debit (Expense)</option>
            <option value="CREDIT">Credit (Income)</option>
          </Select>
        </div>
        <Input label="Description" placeholder="e.g. ZOMATO ORDER #12345" value={form.description} onChange={set('description')} error={errors.description} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Merchant (optional)" placeholder="e.g. Zomato" value={form.merchant} onChange={set('merchant')} />
          <Input label="Date" type="date" value={form.date} onChange={set('date')} error={errors.date} />
        </div>
        <Select label="Category" value={form.category} onChange={set('category')}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Input label="Notes (optional)" placeholder="Optional note" value={form.notes} onChange={set('notes')} />
        <div className="flex gap-3 pt-1">
          <Button type="submit" loading={isPending}>Add Transaction</Button>
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
