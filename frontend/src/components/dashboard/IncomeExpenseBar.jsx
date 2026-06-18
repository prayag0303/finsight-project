import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmtLabel = (yyyyMM) => {
  if (!yyyyMM) return '';
  const [year, mon] = yyyyMM.split('-').map(Number);
  return `${MONTHS[mon - 1]} ${String(year).slice(-2)}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '0.5px solid #e8e8e8', borderRadius: 8, padding: '8px 12px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <p style={{ color: '#aaa', fontWeight: 500, marginBottom: 4 }}>{fmtLabel(label)}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span style={{ fontWeight: 600 }}>{formatCurrency(p.value)}</span>
        </p>
      ))}
    </div>
  );
};

export default function IncomeExpenseBar({ data = [] }) {
  if (!data.length || data.every(d => d.income === 0 && d.expenses === 0)) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260, color: '#aaa', fontSize: 13 }}>No data</div>
  );

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={fmtLabel}
          tick={{ fill: '#aaa', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatCurrency(v, true)}
          tick={{ fill: '#aaa', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend formatter={(v) => <span style={{ fontSize: 12, color: '#777' }}>{v}</span>} />
        <Bar dataKey="income"   name="Income"   fill="#16a34a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="#dc2626" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
