export default function InsightCard({ insights, highlights = [] }) {
  if (!insights) return null;
  return (
    <div className="card p-5" style={{ background: '#f8f5ff', border: '0.5px solid #e9d5ff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 15 }}>✨</span>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>AI Monthly Summary</h3>
      </div>
      <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 12 }}>{insights}</p>
      {highlights.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {highlights.map((h, i) => (
            <span key={i} style={{ padding: '3px 10px', background: '#ede9fe', border: '0.5px solid #ddd6fe', borderRadius: 99, fontSize: 11, color: '#7c3aed' }}>
              {h}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
