import { Link } from 'react-router-dom';
import {
  Clock,
  Heart,
  Layers,
  LogOut,
  MapPin,
  Palette,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useCustomerData } from '../context/CustomerDataContext';
import ThemeStudio from '../components/ui/ThemeStudio';
import AddressManager from '../components/address/AddressManager';
import CustomerOrdersSection from '../components/profile/CustomerOrdersSection';
import CustomerLoyaltySection from '../components/profile/CustomerLoyaltySection';
import PageSeo from '../components/seo/PageSeo';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, isAdmin, signOut, signInWithGoogle, loading, authError } = useCustomerAuth();
  const { wishlist, recentViewed, compareList, addresses } = useCustomerData();

  if (loading) {
    return (
      <div className="profile-loading container section-pad">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-guest container section-pad">
        <PageSeo
          title="Sign In | BIKER CAFE"
          description="Customer profile and saved gear at BIKER CAFE Arni."
          robots="noindex, nofollow"
        />
        <div className="profile-guest__card">
          <div className="profile-guest__icon">
            <UserIcon size={28} />
          </div>
          <h1>RIDER SIGN IN</h1>
          <p>
            Sign in with Google to sync your helmet wishlist, theme preferences, and recently
            viewed models across your devices.
          </p>

          {authError && <div className="profile-error">{authError}</div>}

          <button
            type="button"
            className="profile-google-btn"
            onClick={signInWithGoogle}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="profile-guest__guest-options">
            <span>Or explore your local guest preferences:</span>
            <div className="profile-guest__links">
              <Link to="/wishlist">Local Wishlist ({wishlist.length})</Link>
              <span>•</span>
              <Link to="/compare">Compare ({compareList.length})</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <PageSeo
        title={`${user.displayName || 'Customer'} Profile | BIKER CAFE`}
        description="Manage your saved wishlist, recent views, and theme preferences."
        robots="noindex, nofollow"
      />

      <section className="profile-hero section-pad">
        <div className="container">
          <div className="profile-header-card">
            <div className="profile-user-info">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User Profile'}
                  className="profile-avatar"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="profile-avatar profile-avatar--fallback">
                  <UserIcon size={32} />
                </div>
              )}

              <div>
                <div className="profile-name-row">
                  <h1 className="profile-name">{user.displayName || 'Rider Member'}</h1>
                  {isAdmin && (
                    <span className="profile-badge--admin">
                      <ShieldCheck size={14} aria-hidden="true" />
                      Showroom Admin
                    </span>
                  )}
                </div>
                <p className="profile-email">{user.email}</p>
              </div>
            </div>

            <div className="profile-header-actions">
              {isAdmin && (
                <Link to="/admin" className="profile-admin-btn">
                  Open Admin Dashboard
                </Link>
              )}
              <button type="button" className="profile-signout-btn" onClick={signOut}>
                <LogOut size={16} aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          <div className="profile-stats-grid">
            <Link to="/wishlist" className="profile-stat-box">
              <Heart size={20} className="profile-stat-box__icon" />
              <div>
                <strong className="profile-stat-box__val">{wishlist.length}</strong>
                <span className="profile-stat-box__label">Saved in Wishlist</span>
              </div>
            </Link>

            <Link to="/compare" className="profile-stat-box">
              <Layers size={20} className="profile-stat-box__icon" />
              <div>
                <strong className="profile-stat-box__val">{compareList.length} / 3</strong>
                <span className="profile-stat-box__label">Comparing Helmets</span>
              </div>
            </Link>

            <div className="profile-stat-box">
              <Clock size={20} className="profile-stat-box__icon" />
              <div>
                <strong className="profile-stat-box__val">{recentViewed.length}</strong>
                <span className="profile-stat-box__label">Recently Viewed</span>
              </div>
            </div>

            <div className="profile-stat-box">
              <MapPin size={20} className="profile-stat-box__icon" />
              <div>
                <strong className="profile-stat-box__val">{addresses.length}</strong>
                <span className="profile-stat-box__label">Saved Addresses</span>
              </div>
            </div>
          </div>

          <div className="profile-sections-grid">
            {/* Recently Viewed */}
            <div className="profile-section-card">
              <div className="profile-section-card__head">
                <Clock size={18} aria-hidden="true" />
                <h2>Recently Viewed Helmets</h2>
              </div>

              {recentViewed.length === 0 ? (
                <p className="profile-empty-text">No helmets viewed yet during this session.</p>
              ) : (
                <div className="profile-recent-list">
                  {recentViewed.map((item) => (
                    <Link
                      key={item.id}
                      to={`/showroom/${item.id}`}
                      className="profile-recent-item"
                    >
                      <img src={item.image} alt={item.title} width={48} height={48} />
                      <div className="profile-recent-item__info">
                        <strong>{item.title}</strong>
                        <span>{item.category} · {item.priceLabel}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Studio Settings */}
            <div className="profile-section-card">
              <div className="profile-section-card__head">
                <Palette size={18} aria-hidden="true" />
                <h2>Theme Studio Preferences</h2>
              </div>
              <p className="profile-subtext">
                Customize appearance mode and racing accents. Saved directly to your rider profile.
              </p>
              <ThemeStudio />
            </div>

            {/* Stage 6.6 Delivery Addresses */}
            <div className="profile-section-card profile-section-card--full">
              <AddressManager />
            </div>

            {/* Stage 6.8 Customer Orders */}
            <div className="profile-section-card profile-section-card--full">
              <CustomerOrdersSection />
            </div>

            {/* Stage 6.15 Rider Loyalty Program */}
            <div className="profile-section-card profile-section-card--full">
              <CustomerLoyaltySection user={user} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
