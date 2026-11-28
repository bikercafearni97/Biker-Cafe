import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Heart,
  Layers,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Package,
  Palette,
  ShieldCheck,
  ShoppingBag,
  User as UserIcon,
  X,
  Compass,
  Info,
  Phone,
  Home,
  Store,
  Users,
} from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useCustomerData } from '../../context/CustomerDataContext';
import { useSmartEnquiry } from '../../context/SmartEnquiryContext';
import { useCart } from '../../context/CartContext';
import MultiHelmetEnquiryDrawer from '../ui/MultiHelmetEnquiryDrawer';
import CustomerNotificationBell from '../notifications/CustomerNotificationBell';
import BikerCafeLogo from '../brand/BikerCafeLogo';
import './Navbar.css';

const NAV_ITEMS = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Showroom', to: '/showroom', matchPrefix: '/showroom', icon: Store },
  { label: 'Community', to: '/community', icon: Users },
  { label: 'Finder', to: '/helmet-finder', icon: Compass },
  { label: 'Compare', to: '/compare', icon: Layers },
  { label: 'About', to: '/about', icon: Info },
  { label: 'Contact', to: '/contact', icon: Phone },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [enquiryDrawerOpen, setEnquiryDrawerOpen] = useState(false);

  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setMobileOpen(false);
    setAccountMenuOpen(false);
  }

  const { user, loading, isAdmin, signOut } = useCustomerAuth();
  const { wishlist, compareList, addresses } = useCustomerData();
  const { enquiryItems } = useSmartEnquiry();
  const { totalCount: cartTotal, openCartDrawer } = useCart();

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleNavClick = (item, e) => {
    setMobileOpen(false);
    setAccountMenuOpen(false);
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
        {/* Mobile Left: Hamburger + Logo */}
        <div className="nav-left-group">
          <button
            type="button"
            className="nav-mobile-toggle"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="nav-drawer"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/" className="nav-brand" aria-label="Biker Cafe Home">
            <BikerCafeLogo size="sm" showSubtitle />
          </Link>
        </div>

        {/* Desktop Centered Navigation Links */}
        <nav className="nav-links" aria-label="Primary Navigation">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            return (
              <span key={item.label} className="nav-item-wrapper">
                <Link
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
                  {item.to === '/compare' && compareList.length > 0 && (
                    <span className="nav-pill-badge">{compareList.length}</span>
                  )}
                </Link>

                {/* Show Admin Dashboard directly beside Home for authenticated admin only */}
                {item.label === 'Home' && !loading && isAdmin && user && (
                  <Link
                    to="/admin"
                    className={`nav-link nav-link--admin ${location.pathname === '/admin' ? 'is-active' : ''}`}
                    onClick={() => {
                      setMobileOpen(false);
                      setAccountMenuOpen(false);
                    }}
                  >
                    {location.pathname === '/admin' && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="nav-link__pill"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <ShieldCheck size={14} className="nav-link__icon" />
                    <span className="nav-link__text">Admin</span>
                  </Link>
                )}
              </span>
            );
          })}
        </nav>

        {/* Right Action Icons */}
        <div className="nav-actions">
          {/* Customer Notifications (Desktop & Tablet only - in drawer on mobile) */}
          <div className="nav-action-desktop-only">
            <CustomerNotificationBell />
          </div>

          {/* Wishlist Shortcut (Desktop & Tablet only - in drawer on mobile) */}
          <Link to="/wishlist" className="nav-action-btn nav-action-btn--wishlist nav-action-desktop-only" aria-label="View Saved Wishlist">
            <Heart size={18} />
            {wishlist.length > 0 && <span className="nav-action-badge">{wishlist.length}</span>}
          </Link>

          {/* Shopping Cart Trigger */}
          <button
            type="button"
            className="nav-action-btn"
            onClick={openCartDrawer}
            aria-label="View Shopping Cart"
            title="Shopping Cart"
          >
            <ShoppingBag size={18} />
            {cartTotal > 0 && (
              <span className="nav-action-badge nav-action-badge--red">
                {cartTotal > 9 ? '9+' : cartTotal}
              </span>
            )}
          </button>

          {/* Smart WhatsApp Multi-Enquiry Trigger (Desktop) */}
          <button
            type="button"
            className="nav-action-btn nav-action-btn--enquiry nav-action-desktop-only"
            onClick={() => setEnquiryDrawerOpen(true)}
            aria-label="View compiled WhatsApp enquiry items"
            title="Compiled WhatsApp Enquiry List"
          >
            <MessageSquare size={18} />
            {enquiryItems.length > 0 && (
              <span className="nav-action-badge nav-action-badge--green">
                {enquiryItems.length}
              </span>
            )}
          </button>

          {/* Account Dropdown */}
          <div className="nav-account-wrap">
            <button
              type="button"
              className="nav-account-btn"
              onClick={() => setAccountMenuOpen((prev) => !prev)}
              aria-expanded={accountMenuOpen}
              aria-label={user ? `Account menu for ${user.displayName || 'Rider'}` : 'Account options'}
              title={user?.displayName || (user ? 'My Account' : 'Sign In')}
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Account'}
                  className="nav-avatar"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserIcon size={18} />
              )}
              <span className="nav-account-btn__text">
                {user ? (user.displayName ? (user.displayName.split(' ')[0].length > 10 ? `${user.displayName.split(' ')[0].slice(0, 9)}…` : user.displayName.split(' ')[0]) : 'Rider') : 'Login'}
              </span>
            </button>

            <AnimatePresence>
              {accountMenuOpen && (
                <motion.div
                  className="nav-account-dropdown"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                >
                  {user ? (
                    <>
                      <div className="nav-dropdown-header">
                        <strong>{user.displayName || 'Rider Member'}</strong>
                        <span>{user.email}</span>
                      </div>
                      <div className="nav-dropdown-divider" />
                      <Link
                        to="/profile#orders"
                        className="nav-dropdown-item"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <Package size={15} />
                        <span>My Orders</span>
                      </Link>
                      <Link
                        to="/profile#addresses"
                        className="nav-dropdown-item"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <MapPin size={15} />
                        <span>Address Management</span>
                      </Link>
                      <Link
                        to="/profile"
                        className="nav-dropdown-item"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <UserIcon size={15} />
                        <span>Profile &amp; Settings</span>
                      </Link>
                      <Link
                        to="/wishlist"
                        className="nav-dropdown-item"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <Heart size={15} />
                        <span>My Wishlist ({wishlist.length})</span>
                      </Link>
                      <Link
                        to="/compare"
                        className="nav-dropdown-item"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <Layers size={15} />
                        <span>Compare Helmets</span>
                      </Link>
                      <Link
                        to="/profile"
                        className="nav-dropdown-item"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <Palette size={15} />
                        <span>Theme Studio</span>
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="nav-dropdown-item nav-dropdown-item--admin"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          <ShieldCheck size={15} />
                          <span>Showroom Admin</span>
                        </Link>
                      )}
                      <div className="nav-dropdown-divider" />
                      <button
                        type="button"
                        className="nav-dropdown-item nav-dropdown-item--signout"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          signOut();
                        }}
                      >
                        <LogOut size={15} />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <div className="nav-dropdown-guest">
                      <p>Sign in to sync your wishlist, recent views, and theme preferences.</p>
                      <Link
                        to="/profile"
                        className="nav-dropdown-login-btn"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        Sign In with Google
                      </Link>
                      <div className="nav-dropdown-divider" />
                      <Link
                        to="/wishlist"
                        className="nav-dropdown-item"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <Heart size={15} />
                        <span>Guest Wishlist ({wishlist.length})</span>
                      </Link>
                      <Link
                        to="/profile"
                        className="nav-dropdown-item"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <Palette size={15} />
                        <span>Theme Settings</span>
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Slide-out Mobile Navigation Drawer & Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="nav-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              id="nav-drawer"
              className="nav-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              aria-label="Mobile Navigation Menu"
            >
              <div className="nav-drawer__header">
                <BikerCafeLogo size="sm" showSubtitle />
                <button
                  type="button"
                  className="nav-drawer__close-btn"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User Profile Mini Banner in Drawer */}
              <div className="nav-drawer__user-banner">
                {user ? (
                  <div className="drawer-user-info">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'Account'} className="drawer-avatar" />
                    ) : (
                      <div className="drawer-avatar-placeholder">
                        <UserIcon size={18} />
                      </div>
                    )}
                    <div className="drawer-user-text">
                      <strong className="drawer-user-name">{user.displayName || 'Rider Member'}</strong>
                      <span className="drawer-user-email">{user.email}</span>
                    </div>
                  </div>
                ) : (
                  <div className="drawer-guest-banner">
                    <p>Experience member perks, saved addresses, and live order tracking.</p>
                    <Link
                      to="/profile"
                      className="drawer-login-cta"
                      onClick={() => setMobileOpen(false)}
                    >
                      Sign In / Register
                    </Link>
                  </div>
                )}
              </div>

              {/* Main Navigation Links */}
              <div className="nav-drawer__nav-list">
                <span className="drawer-section-label">MAIN NAVIGATION</span>
                {NAV_ITEMS.map((item) => {
                  const active = isItemActive(item);
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      className={`nav-drawer__link ${active ? 'is-active' : ''}`}
                      onClick={(e) => handleNavClick(item, e)}
                    >
                      <span className="drawer-link-left">
                        {IconComponent && <IconComponent size={18} className="drawer-link-icon" />}
                        <span>{item.label}</span>
                      </span>
                      {item.to === '/compare' && compareList.length > 0 && (
                        <span className="nav-pill-badge">{compareList.length}</span>
                      )}
                    </Link>
                  );
                })}

                {/* Authenticated Admin link */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`nav-drawer__link nav-drawer__link--admin ${location.pathname === '/admin' ? 'is-active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="drawer-link-left">
                      <ShieldCheck size={18} className="drawer-link-icon" />
                      <span>Admin Management</span>
                    </span>
                    <span className="drawer-admin-tag">OWNER</span>
                  </Link>
                )}

                {/* Customer Actions Section */}
                <div className="nav-drawer__divider" />
                <span className="drawer-section-label">RIDER ACTIONS</span>

                {/* Notifications Link for Logged In Riders */}
                {user && (
                  <Link
                    to="/profile"
                    className="nav-drawer__link"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="drawer-link-left">
                      <Bell size={18} className="drawer-link-icon" />
                      <span>Notifications &amp; Updates</span>
                    </span>
                  </Link>
                )}

                <button
                  type="button"
                  className="nav-drawer__link nav-drawer__link--btn"
                  onClick={() => {
                    setMobileOpen(false);
                    openCartDrawer();
                  }}
                >
                  <span className="drawer-link-left">
                    <ShoppingBag size={18} className="drawer-link-icon" />
                    <span>Shopping Cart</span>
                  </span>
                  {cartTotal > 0 && (
                    <span className="nav-action-badge nav-action-badge--red drawer-badge">
                      {cartTotal}
                    </span>
                  )}
                </button>

                <Link
                  to="/wishlist"
                  className="nav-drawer__link"
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="drawer-link-left">
                    <Heart size={18} className="drawer-link-icon" />
                    <span>My Wishlist</span>
                  </span>
                  {wishlist.length > 0 && (
                    <span className="drawer-count-tag">{wishlist.length}</span>
                  )}
                </Link>

                <Link
                  to="/profile#orders"
                  className="nav-drawer__link"
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="drawer-link-left">
                    <Package size={18} className="drawer-link-icon" />
                    <span>My Orders &amp; Tracking</span>
                  </span>
                </Link>

                <Link
                  to="/profile#addresses"
                  className="nav-drawer__link"
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="drawer-link-left">
                    <MapPin size={18} className="drawer-link-icon" />
                    <span>Saved Addresses</span>
                  </span>
                  {addresses.length > 0 && (
                    <span className="drawer-count-tag">{addresses.length}</span>
                  )}
                </Link>

                <Link
                  to="/profile"
                  className="nav-drawer__link"
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="drawer-link-left">
                    <UserIcon size={18} className="drawer-link-icon" />
                    <span>Profile &amp; Rider Account</span>
                  </span>
                </Link>

                <button
                  type="button"
                  className="nav-drawer__link nav-drawer__link--btn"
                  onClick={() => {
                    setMobileOpen(false);
                    setEnquiryDrawerOpen(true);
                  }}
                >
                  <span className="drawer-link-left">
                    <MessageSquare size={18} className="drawer-link-icon" />
                    <span>WhatsApp Inquiry Box</span>
                  </span>
                  {enquiryItems.length > 0 && (
                    <span className="drawer-count-tag green">{enquiryItems.length}</span>
                  )}
                </button>

                {user && (
                  <button
                    type="button"
                    className="nav-drawer__signout-btn"
                    onClick={() => {
                      setMobileOpen(false);
                      signOut();
                    }}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>

              <div className="nav-drawer__footer">
                <span>BIKER CAFE ARNI — OFFICIAL SHOWROOM</span>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <MultiHelmetEnquiryDrawer
        isOpen={enquiryDrawerOpen}
        onClose={() => setEnquiryDrawerOpen(false)}
      />
    </header>
  );
}
