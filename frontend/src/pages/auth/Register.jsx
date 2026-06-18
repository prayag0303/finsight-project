import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Pill = ({ dotColor, children }) => (
  <div style={{ background: '#1a1a1a', borderRadius: 8, padding: '10px 13px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0 }} />
    <span style={{ fontSize: 12, color: '#777' }}>{children}</span>
  </div>
);

const B = ({ children }) => <strong style={{ color: '#ccc', fontWeight: 500 }}>{children}</strong>;

const AuthInput = ({ type = 'text', placeholder, value, onChange, autoComplete, required }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    autoComplete={autoComplete}
    required={required}
    className="auth-input"
    style={{
      width: '100%', background: '#fafafa', border: '0.5px solid #e8e8e8',
      borderRadius: 7, padding: '9px 12px', fontSize: 13, color: '#111',
      outline: 'none', display: 'block', fontFamily: 'inherit',
      transition: 'border-color 0.1s, background 0.1s',
    }}
    onFocus={(e) => { e.target.style.borderColor = '#aaa'; e.target.style.background = '#fff'; }}
    onBlur={(e) => { e.target.style.borderColor = '#e8e8e8'; e.target.style.background = '#fafafa'; }}
  />
);

export default function Register() {
  const { register, isLoading } = useAuth();
  const [form, setForm]   = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => { document.title = 'Create account — FinSight'; }, []);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (form.password.length < 8) errs.password = 'Use at least 8 characters';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    const result = await register(form.name, form.email, form.password);
    if (!result.success) {
      const msg = result.message || '';
      if (msg.toLowerCase().includes('email')) setErrors({ email: msg });
      else setErrors({ password: msg });
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">

      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <div
        className="w-full md:w-1/2 flex flex-col min-h-[200px] p-8 md:py-[48px] md:px-[44px]"
        style={{ background: '#111', justifyContent: 'space-between' }}
      >
        <div>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 52 }}>
            <div style={{ width: 30, height: 30, background: '#fff', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>F</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#fff', letterSpacing: '-0.3px' }}>FinSight</span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 500, color: '#fff', letterSpacing: '-0.6px', lineHeight: 1.3, marginBottom: 12, whiteSpace: 'pre-line' }}>
            {'Know where every\nrupee goes.'}
          </h1>
          <p style={{ fontSize: 12, color: '#888', lineHeight: 1.7, marginBottom: 36 }}>
            Most people have no idea how much they spend on food, subscriptions, or impulse buys. FinSight shows you — clearly.
          </p>

          {/* Pills — desktop only */}
          <div className="hidden md:block">
            <Pill dotColor="#4ade80"><B>Upload once,</B> get 12 months of insights</Pill>
            <Pill dotColor="#c084fc"><B>Subscription detector</B> finds hidden recurring costs</Pill>
            <Pill dotColor="#fb923c"><B>Savings engine</B> finds where to cut back</Pill>
          </div>
        </div>

        {/* Bottom note — desktop only */}
        <div className="hidden md:block" style={{ paddingTop: 40 }}>
          <p style={{ fontSize: 11, color: '#444' }}>Free to use. No credit card required.</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <div
        className="w-full md:w-1/2 flex flex-col justify-center px-6 py-8 md:px-[52px] md:py-[48px]"
        style={{ background: '#fff' }}
      >
        <div style={{ maxWidth: 380, width: '100%', margin: '0 auto' }}>
          <h2 style={{ fontSize: 17, fontWeight: 500, color: '#111', letterSpacing: '-0.4px', marginBottom: 4 }}>
            Create your account
          </h2>
          <p style={{ fontSize: 12, color: '#aaa', marginBottom: 28, lineHeight: 1.5 }}>
            Start understanding your money in minutes
          </p>

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div style={{ marginBottom: 13 }}>
              <label style={{ fontSize: 11, color: '#666', fontWeight: 500, display: 'block', marginBottom: 5, letterSpacing: '0.01em' }}>
                Full name
              </label>
              <AuthInput placeholder="Your name" value={form.name} onChange={set('name')} autoComplete="name" required />
              {errors.name && <p style={{ fontSize: 11, color: '#c0392b', marginTop: 4 }}>{errors.name}</p>}
            </div>

            {/* Email */}
            <div style={{ marginBottom: 13 }}>
              <label style={{ fontSize: 11, color: '#666', fontWeight: 500, display: 'block', marginBottom: 5, letterSpacing: '0.01em' }}>
                Email address
              </label>
              <AuthInput type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" required />
              {errors.email && <p style={{ fontSize: 11, color: '#c0392b', marginTop: 4 }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 13 }}>
              <label style={{ fontSize: 11, color: '#666', fontWeight: 500, display: 'block', marginBottom: 5, letterSpacing: '0.01em' }}>
                Password
              </label>
              <AuthInput type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} autoComplete="new-password" required />
              <p style={{ fontSize: 10, color: '#ccc', marginTop: 4 }}>Use something you don't use elsewhere</p>
              {errors.password && <p style={{ fontSize: 11, color: '#c0392b', marginTop: 4 }}>{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', background: '#111', color: '#fff', border: 'none',
                borderRadius: 7, padding: '10px', fontSize: 13, fontWeight: 500,
                cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: 4,
                letterSpacing: '0.01em', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, fontFamily: 'inherit',
                transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = '#333'; }}
              onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.background = '#111'; }}
            >
              {isLoading && (
                <svg style={{ width: 14, height: 14 }} className="animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              )}
              Create account
            </button>

            <p style={{ fontSize: 10, color: '#bbb', textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
              By signing up you agree to our{' '}
              <a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#999', textDecoration: 'none' }}>Terms</a>
              {' '}and{' '}
              <a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#999', textDecoration: 'none' }}>Privacy policy</a>
            </p>
          </form>

          <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 18 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#111', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
