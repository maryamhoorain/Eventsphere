import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, LogOut, Menu, Search, User, X } from 'lucide-react';
import { useSession } from '../../store/session';
import GlareHover from '../effects/GlareHover';

const LINKS = [
  { name: 'Home', to: '/' },
  { name: 'Events', to: '/events' },
  { name: 'Sessions', to: '/schedule' },
  { name: 'About', to: '/about' },
  { name: 'Feedback', to: '/feedback' },
];

// The dashboard is shared by every role, but it means something different
// depending on who is looking at it — label it accordingly instead of
// exposing separate routes.
const DASHBOARD_LABEL = {
  admin: 'Admin Dashboard',
  organizer: 'Organizer Dashboard',
  exhibitor: 'Exhibitor Dashboard',
};

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSession((s) => s.user);
  const logout = useSession((s) => s.logout);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState('');
  const menuRef = useRef(null);

  // Every nav link and action inside the mobile panel / account dropdown
  // already closes its own menu on click, so route changes are covered
  // without a dedicated effect.

  // Close the account dropdown when clicking outside of it.
  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  // Lock background scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  function isActive(to) {
    return to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
  }

  function submitSearch(e) {
    e.preventDefault();
    navigate(q.trim() ? `/events?q=${encodeURIComponent(q.trim())}` : '/events');
    setMobileOpen(false);
  }

  function handleLogout() {
    logout();
    setMenuOpen(false);
    setMobileOpen(false);
    navigate('/');
  }

  const dashboardLabel = user ? (DASHBOARD_LABEL[user.role] || 'Dashboard') : null;
  const initial = (user?.name || '').trim().charAt(0).toUpperCase() || 'U';

  return (
    <header className="glass-nav navbar sticky top-0 z-40">
      <div className="container navbar__row">
        <Link to="/" className="navbar__brand" onClick={() => setMobileOpen(false)}>
          <img src="/logo.jpg" alt="" className="navbar__logo" />
          <span className="navbar__brand-name">
            <span style={{ color: 'var(--accent)' }}>Event</span>Sphere
          </span>
        </Link>

        <nav className="navbar__links hide-mobile" aria-label="Primary">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`navbar__link${isActive(l.to) ? ' is-active' : ''}`}
              aria-current={isActive(l.to) ? 'page' : undefined}
            >
              {l.name}
            </Link>
          ))}
        </nav>

        <div className="navbar__actions">
          <form onSubmit={submitSearch} className="navbar__search hide-mobile" role="search">
            <Search size={15} className="navbar__search-icon" aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search events, tags…"
              aria-label="Search events"
              className="navbar__search-input"
            />
          </form>

          {user ? (
            <div className="navbar__menu hide-mobile" ref={menuRef}>
              <button
                type="button"
                className="navbar__menu-trigger"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="navbar__avatar">{initial}</span>
                <span className="navbar__menu-name">{(user.name || '').split(' ')[0]}</span>
                <ChevronDown size={14} style={{ opacity: 0.6 }} />
              </button>
              {menuOpen && (
                <div className="navbar__dropdown" role="menu">
                  <div className="navbar__dropdown-header">
                    <div className="navbar__dropdown-name">{user.name}</div>
                    <div className="navbar__dropdown-role">{user.role}</div>
                  </div>
                  {user.role !== 'attendee' && (
                    <Link to="/dashboard" className="navbar__dropdown-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                      <LayoutDashboard size={15} /> {dashboardLabel}
                    </Link>
                  )}
                  <Link to="/profile" className="navbar__dropdown-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                    <User size={15} /> Profile
                  </Link>
                  <button type="button" className="navbar__dropdown-item navbar__dropdown-item--danger" role="menuitem" onClick={handleLogout}>
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar__auth hide-mobile">
              <GlareHover className="navbar__glare-auth" width="auto" height="36px" borderRadius="10px" borderColor="rgba(56,189,248,.35)" background="rgba(15,23,42,.55)" glareColor="#38bdf8" glareOpacity={0.18}>
                <Link to="/login" className="navbar__glare-link">Log in</Link>
              </GlareHover>
              <GlareHover className="navbar__glare-auth" width="auto" height="36px" borderRadius="10px" borderColor="#2563eb" background="#2563eb" glareColor="#ffffff" glareOpacity={0.3}>
                <Link to="/register" className="navbar__glare-link navbar__glare-link--signup">Sign up</Link>
              </GlareHover>
            </div>
          )}

          <button
            type="button"
            className="navbar__toggle show-mobile"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <div className={`navbar__mobile${mobileOpen ? ' is-open' : ''}`}>
        <div className="navbar__mobile-inner">
          <nav className="navbar__mobile-links" aria-label="Primary mobile">
            {LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`navbar__mobile-link${isActive(l.to) ? ' is-active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {l.name}
              </Link>
            ))}
          </nav>

          <form onSubmit={submitSearch} className="navbar__search navbar__search--mobile" role="search">
            <Search size={16} className="navbar__search-icon" aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search events, tags…"
              aria-label="Search events"
              className="navbar__search-input"
            />
          </form>

          <div className="navbar__mobile-auth">
            {user ? (
              <>
                <div className="navbar__mobile-user">
                  <span className="navbar__avatar">{initial}</span>
                  <div>
                    <div className="navbar__dropdown-name">{user.name}</div>
                    <div className="navbar__dropdown-role">{user.role}</div>
                  </div>
                </div>
                {user.role !== 'attendee' && (
                  <Link to="/dashboard" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>
                    {dashboardLabel}
                  </Link>
                )}
                <Link to="/profile" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>
                  Profile
                </Link>
                <button type="button" className="btn btn-sm btn-ghost navbar__mobile-logout" onClick={handleLogout}>
                  <LogOut size={15} /> Logout
                </button>
              </>
            ) : (
              <div className="navbar__mobile-auth-buttons">
                <GlareHover className="navbar__mobile-glare" width="100%" height="42px" borderRadius="10px" borderColor="rgba(56,189,248,.35)" background="rgba(15,23,42,.55)" glareColor="#38bdf8" glareOpacity={0.18}>
                  <Link to="/login" className="navbar__glare-link" onClick={() => setMobileOpen(false)}>Log in</Link>
                </GlareHover>
                <GlareHover className="navbar__mobile-glare" width="100%" height="42px" borderRadius="10px" borderColor="#2563eb" background="#2563eb" glareColor="#ffffff" glareOpacity={0.3}>
                  <Link to="/register" className="navbar__glare-link navbar__glare-link--signup" onClick={() => setMobileOpen(false)}>Sign up</Link>
                </GlareHover>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
