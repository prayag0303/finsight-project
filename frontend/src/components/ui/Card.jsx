export default function Card({ children, className = '', hover = false, onClick }) {
  const base = hover ? 'card-hover cursor-pointer' : 'card';
  return (
    <div className={`${base} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
