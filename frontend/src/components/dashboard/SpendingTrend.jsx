import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '0.5px solid #e8e8e8', borderRadius: 8, padding: '8px 12px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <p style={{ color: '#aaa', fontWeight: 500, marginBottom: 4 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span style={{ fontWeight: 600 }}>{formatCurrency(p.value)}</span>
        </p>
      ))}
    </div>
  );
};

export default function SpendingTrend({ data = [] }) {
  if (!data.length) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260, color: '#aaa', fontSize: 13 }}>No data</div>
  );

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fill: '#aaa', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v) => formatCurrency(v, true)} tick={{ fill: '#aaa', fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
        <Tooltip content={<CustomTooltip />} />
        <Legend formatter={(v) => <span style={{ fontSize: 12, color: '#777' }}>{v}</span>} />
        <Line type="monotone" dataKey="income"   name="Income"   stroke="#16a34a" strokeWidth={2} dot={{ r: 3, fill: '#16a34a' }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#dc2626" strokeWidth={2} dot={{ r: 3, fill: '#dc2626' }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
