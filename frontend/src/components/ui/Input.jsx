export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#777' }}>{label}</label>}
      <input className={`input-field ${error ? 'border-red-300 focus:ring-red-200' : ''} ${className}`} {...props} />
      {error && <p style={{ fontSize: 12, color: '#dc2626' }}>{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#777' }}>{label}</label>}
      <select className={`input-field ${error ? 'border-red-300' : ''} ${className}`} {...props}>
        {children}
      </select>
      {error && <p style={{ fontSize: 12, color: '#dc2626' }}>{error}</p>}
    </div>
  );
}
