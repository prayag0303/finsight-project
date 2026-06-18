import Input, { Select } from '../ui/Input';
import { CATEGORIES } from '../../utils/constants';

export default function TransactionFilters({ filters, onChange }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value, page: 1 });

  return (
    <div className="card p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="col-span-2">
          <Input
            placeholder="Search description or merchant..."
            value={filters.search || ''}
            onChange={set('search')}
          />
        </div>
        <Select value={filters.category || ''} onChange={set('category')}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={filters.type || ''} onChange={set('type')}>
          <option value="">All types</option>
          <option value="CREDIT">Credit</option>
          <option value="DEBIT">Debit</option>
        </Select>
        <Input type="date" value={filters.startDate || ''} onChange={set('startDate')} />
        <Input type="date" value={filters.endDate || ''}   onChange={set('endDate')} />
      </div>
    </div>
  );
}
