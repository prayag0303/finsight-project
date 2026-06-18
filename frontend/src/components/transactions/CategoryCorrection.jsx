import { useState } from 'react';
import Modal from '../ui/Modal';
import { Select } from '../ui/Input';
import Button from '../ui/Button';
import { CategoryBadge } from '../ui/Badge';
import { useUpdateTransaction } from '../../hooks/useTransactions';
import { CATEGORIES } from '../../utils/constants';

export default function CategoryCorrection({ transaction, onClose }) {
  const [category, setCategory] = useState(transaction.category);
  const { mutate: update, isPending } = useUpdateTransaction();

  const handleSave = () => {
    update({ id: transaction.id, data: { category } }, { onSuccess: onClose });
  };

  return (
    <Modal isOpen title="Correct Category" onClose={onClose} size="sm">
      <div className="space-y-4">
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={transaction.description}>
          {transaction.description}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#777' }}>
          Current: <CategoryBadge category={transaction.category} />
        </div>
        <Select label="New Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <p style={{ fontSize: 12, color: '#aaa' }}>
          This correction will be remembered for "{transaction.merchant}" in future transactions.
        </p>
        <div className="flex gap-3 pt-1">
          <Button onClick={handleSave} loading={isPending} disabled={category === transaction.category}>
            Save correction
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
