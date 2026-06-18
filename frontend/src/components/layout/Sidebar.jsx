import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { NAV_ITEMS } from '../../utils/constants';

// ─── SVG icons ───────────────────────────────────────────────────────────────
const ICONS = {
  grid:           <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  list:           <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  target:         <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  repeat:         <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>,
  shield:         <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  'piggy-bank':   <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8.7 3.3 1.8 4.5-.4 1-.9 2.5-.8 3.5h3c.3-.6.6-1.2.9-1.5 1 .2 2 .3 3.1.3 1 0 1.9-.1 2.8-.3.4.4.7 1 .9 1.5h3c.1-1-.3-2.4-.8-3.5C20.3 15.3 21 13.8 21 12c0-3-2.1-5-2-7"/></svg>,
  sparkles:       <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M5 17l.7 2.3L8 20l-2.3.7L5 23l-.7-2.3L2 20l2.3-.7L5 17z"/></svg>,
  'message-circle': <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
};

// Build groups from NAV_ITEMS
const GROUP_ORDER = ['Overview', 'Plan', 'Insights'];
const GROUPS = GROUP_ORDER.map((label) => ({
  label,
  items: NAV_ITEMS.filter((item) => item.group === label),
}));

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();

  return (
    <aside style={{
      width: 200,
      background: '#fff',
      borderRight: '0.5px solid #ececec',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '0.5px solid #ececec' }}>
        <p style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.3px', color: '#111', lineHeight: 1 }}>
          FinSight
        </p>
        <p style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>your money, understood</p>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {GROUPS.map(({ label, items }) => (
          <div key={label} style={{ marginBottom: 6 }}>
            <p style={{
              fontSize: 10,
              color: '#bbb',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 500,
              padding: '4px 16px 6px',
            }}>
              {label}
            </p>
            {items.map(({ to, label: itemLabel, icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span style={{ opacity: 0.7 }}>{ICONS[icon]}</span>
                <span>{itemLabel}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div style={{ padding: '10px 12px', borderTop: '0.5px solid #ececec' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px' }}>
          <div style={{
            width: 28, height: 28,
            borderRadius: '50%',
            background: '#111',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </p>
            <p style={{ fontSize: 10, color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            style={{ color: '#bbb', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#bbb')}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
