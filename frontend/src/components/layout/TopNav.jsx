import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const MenuIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function TopNav({ onMenuClick }) {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <header style={{
      height: 50,
      background: '#fff',
      borderBottom: '0.5px solid #ececec',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 12,
      position: 'sticky',
      top: 0,
      zIndex: 30,
      flexShrink: 0,
    }}>
      <button
        onClick={onMenuClick}
        className="lg:hidden"
        style={{ color: '#777', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
      >
        <MenuIcon />
      </button>

      <p style={{ fontSize: 14, fontWeight: 500, color: '#111', flex: 1 }}>
        {greeting()}, {firstName}
      </p>
    </header>
  );
}
