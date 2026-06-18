import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Label } from 'recharts';
import { CATEGORY_COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div style={{ background: '#fff', border: '0.5px solid #e8e8e8', borderRadius: 8, padding: '8px 12px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <p style={{ color: '#aaa', marginBottom: 2 }}>{name}</p>
      <p style={{ fontWeight: 600, color: '#111' }}>{formatCurrency(value)}</p>
    </div>
  );
};

const renderPctLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function CategoryPie({ data = [], total = null }) {
  if (!data.length) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, gap: 8, color: '#aaa', fontSize: 13 }}>
      <span style={{ fontSize: 32 }}>📊</span>
      <p>No transactions this month</p>
    </div>
  );

  const chartData = data.slice(0, 6).map((d) => ({
    name: d.category,
    value: parseFloat(d.total),
  }));

  const centerTotal = total ?? chartData.reduce((s, d) => s + d.value, 0);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="48%"
          innerRadius={62}
          outerRadius={105}
          paddingAngle={2}
          dataKey="value"
          labelLine={false}
          label={renderPctLabel}
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#d0d0d0'} stroke="transparent" />
          ))}
          <Label
            content={({ viewBox }) => {
              const { cx, cy } = viewBox;
              return (
                <g>
                  <text x={cx} y={cy - 6} fill="#111" textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={700}>
                    {formatCurrency(centerTotal, true)}
                  </text>
                  <text x={cx} y={cy + 11} fill="#aaa" textAnchor="middle" dominantBaseline="central" fontSize={10}>
                    spent
                  </text>
                </g>
              );
            }}
            position="center"
          />
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(v) => <span style={{ fontSize: 12, color: '#777' }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
