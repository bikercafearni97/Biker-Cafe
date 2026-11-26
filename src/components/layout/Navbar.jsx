import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import BikerCafeLogo from '../brand/BikerCafeLogo';
import './Navbar.css';

const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'Showroom', to: '/showroom', matchPrefix: '/showroom' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleNavClick = (item, e) => {
    setMobileOpen(false);
    if (item.hash && location.pathname === '/') {
      e.preventDefault();
      const target = document.querySelector(item.hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const isItemActive = (item) => {
    if (item.matchPrefix) return location.pathname.startsWith(item.matchPrefix);
    if (item.hash) return location.pathname === '/' && location.hash === item.hash;
    return location.pathname === item.to && !location.hash;
  };

  return (
    <header className="nav-wrap">
      <div className="container nav-inner">
        <Link to="/" className="nav-brand" aria-label="Biker Cafe Home">
          <BikerCafeLogo size="sm" showSubtitle />
        </Link>

        <nav className="nav-links" aria-label="Primary Navigation">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`nav-link ${active ? 'is-active' : ''}`}
                onClick={(e) => handleNavClick(item, e)}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="nav-link__pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="nav-link__text">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            className="nav-mobile-toggle"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="nav-drawer"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="nav-drawer"
            className="nav-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="container nav-drawer__inner">
              {NAV_ITEMS.map((item) => {
                const active = isItemActive(item);
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`nav-drawer__link ${active ? 'is-active' : ''}`}
                    onClick={(e) => handleNavClick(item, e)}
                  >
                    <span>{item.label}</span>
                    {active && <span className="nav-drawer__dot" aria-hidden="true" />}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
