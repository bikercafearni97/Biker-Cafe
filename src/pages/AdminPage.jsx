import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  CheckCircle2,
  Clock3,
  Inbox,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { auth } from '../firebase';
import {
  ADMIN_UID,
  deleteEnquiry,
  ENQUIRY_STATUSES,
  subscribeEnquiries,
  updateEnquiryStatus,
} from '../services/enquiriesService';
import { buildWhatsAppUrl, CLIENT_PLACEHOLDER_INFO } from '../data/showroomPlaceholders';
import MagneticButton from '../components/ui/MagneticButton';
import WhatsAppIcon from '../components/ui/WhatsAppIcon';
import PageSeo from '../components/seo/PageSeo';
import './AdminPage.css';

const STATUS_FILTER_TABS = [
  { id: 'all', label: 'All Enquiries' },
  ...ENQUIRY_STATUSES,
];

function formatEnquiryDate(createdAt) {
  if (!createdAt) return 'Just now';
  const date = typeof createdAt.toDate === 'function' ? createdAt.toDate() : new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'Recent';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function buildCustomerContactActions(enquiry) {
  const raw = (enquiry.contact || '').trim();
  const actions = [];

  if (raw.includes('@')) {
    const subject = `Re: Your ${enquiry.topic} Enquiry — ${CLIENT_PLACEHOLDER_INFO.brandName} ${CLIENT_PLACEHOLDER_INFO.locationLabel}`;
    const body = `Hi ${enquiry.name},\n\nThank you for contacting ${CLIENT_PLACEHOLDER_INFO.brandName} — ${CLIENT_PLACEHOLDER_INFO.locationLabel} regarding "${enquiry.topic}".\n\n`;
    actions.push({
      key: 'email',
      label: 'Email',
      href: `mailto:${raw}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      external: false,
      icon: Mail,
    });
  }

  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 10 && digits.length <= 15) {
    const normalizedPhone = digits.length === 10 ? `91${digits}` : digits;
    const replyMsg = `Hi ${enquiry.name}, thank you for contacting ${CLIENT_PLACEHOLDER_INFO.brandName} (${CLIENT_PLACEHOLDER_INFO.locationLabel}) regarding ${enquiry.topic}.`;
    actions.push({
      key: 'call',
      label: 'Call',
      href: `tel:+${normalizedPhone}`,
      external: false,
      icon: Phone,
    });
    actions.push({
      key: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(replyMsg)}`,
      external: true,
      icon: WhatsAppIcon,
    });
  } else if (actions.length === 0) {
    actions.push({
      key: 'showroom-wa',
      label: 'Open WhatsApp',
      href: buildWhatsAppUrl(`Follow-up for ${enquiry.name} (${enquiry.contact})`),
      external: true,
      icon: WhatsAppIcon,
    });
  }

  return actions;
}

export default function AdminPage() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  const [enquiries, setEnquiries] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(true);
  const [enquiriesError, setEnquiriesError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [actionError, setActionError] = useState('');

  const isAuthorizedAdmin = Boolean(user && user.uid === ADMIN_UID);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.uid !== ADMIN_UID) {
        await signOut(auth).catch(() => {});
        setUser(null);
        setEnquiries([]);
        setAuthError(
          'Access denied. Only the authorized BIKER CAFE – ARNI owner account can open this dashboard.'
        );
        setAuthReady(true);
        return;
      }

      setUser(firebaseUser || null);
      if (!firebaseUser) {
        setEnquiries([]);
        setLoadingEnquiries(false);
      } else {
        setAuthError('');
        setLoadingEnquiries(true);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthorizedAdmin) return undefined;

    const unsubscribe = subscribeEnquiries(
      (items) => {
        setEnquiries(items);
        setEnquiriesError('');
        setLoadingEnquiries(false);
      },
      (err) => {
        setEnquiriesError(
          err?.code === 'permission-denied'
            ? 'Firestore permission denied. Confirm firestore.rules are published for the owner UID.'
            : 'Unable to load enquiries from Firestore.'
        );
        setLoadingEnquiries(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthorizedAdmin]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (signingIn) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setAuthError('Enter both your owner email and password.');
      return;
    }

    setAuthError('');
    setSigningIn(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      if (credential.user.uid !== ADMIN_UID) {
        await signOut(auth).catch(() => {});
        setAuthError(
          'Access denied. Only the authorized BIKER CAFE – ARNI owner account can open this dashboard.'
        );
      } else {
        setPassword('');
      }
    } catch (err) {
      const code = err?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-email'
      ) {
        setAuthError('Invalid owner email or password.');
      } else if (code === 'auth/too-many-requests') {
        setAuthError('Too many failed sign-in attempts. Please wait a moment and try again.');
      } else {
        setAuthError('Sign-in failed. Check your connection and try again.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setActionError('');
    setConfirmDeleteId('');
    await signOut(auth);
  };

  const handleStatusChange = async (enquiryId, nextStatus) => {
    setActionError('');
    setUpdatingId(enquiryId);
    try {
      await updateEnquiryStatus(enquiryId, nextStatus);
    } catch {
      setActionError('Failed to update enquiry status. Check permissions and connection.');
    } finally {
      setUpdatingId('');
    }
  };

  const handleConfirmDelete = async (enquiryId) => {
    setActionError('');
    setDeletingId(enquiryId);
    try {
      await deleteEnquiry(enquiryId);
      setConfirmDeleteId('');
    } catch {
      setActionError('Failed to delete enquiry. Check permissions and connection.');
    } finally {
      setDeletingId('');
    }
  };

  const counts = useMemo(() => {
    const summary = { all: enquiries.length, new: 0, 'in-progress': 0, resolved: 0 };
    for (const item of enquiries) {
      const st = item.status || 'new';
      if (Object.hasOwn(summary, st)) {
        summary[st] += 1;
      }
    }
    return summary;
  }, [enquiries]);

  const filteredEnquiries = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return enquiries.filter((item) => {
      const statusMatches = statusFilter === 'all' || (item.status || 'new') === statusFilter;
      if (!statusMatches) return false;
      if (!q) return true;
      const haystack = `${item.name || ''} ${item.contact || ''} ${item.topic || ''} ${
        item.message || ''
      } ${item.id || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [enquiries, searchTerm, statusFilter]);

  return (
    <div className="admin-page">
      <PageSeo
        title="Owner Portal | BIKER CAFE — ARNI"
        description="Private showroom owner enquiry management dashboard."
        robots="noindex, nofollow"
      />
      <section className="admin-hero">
        <div className="container">
          <span className="eyebrow">
            {CLIENT_PLACEHOLDER_INFO.brandName} // {CLIENT_PLACEHOLDER_INFO.locationLabel} Owner Portal
          </span>
          <div className="admin-hero__row">
            <div>
              <h1 className="admin-hero__title">
                CUSTOMER <span className="metallic-text">ENQUIRIES</span>
              </h1>
              <p className="admin-hero__copy">
                Private showroom inquiry console secured by Firebase Authentication &amp; UID-locked
                Firestore rules.
              </p>
            </div>
            {isAuthorizedAdmin && (
              <div className="admin-hero__user">
                <span className="admin-hero__badge">
                  <ShieldCheck size={15} aria-hidden="true" />
                  Verified Owner ({user.email || ADMIN_UID})
                </span>
                <button type="button" className="admin-signout-btn" onClick={handleSignOut}>
                  <LogOut size={15} aria-hidden="true" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="admin-body section-pad">
        <div className="container">
          {!authReady ? (
            <div className="admin-state-card">
              <Loader2 size={24} className="admin-spin" aria-hidden="true" />
              <p>Verifying owner session...</p>
            </div>
          ) : !isAuthorizedAdmin ? (
            <div className="admin-login-card">
              <div className="admin-login-card__head">
                <span className="admin-login-card__icon" aria-hidden="true">
                  <Lock size={20} />
                </span>
                <div>
                  <h2>Owner Sign In</h2>
                  <p>Sign in with your authorized Firebase owner account to manage enquiries.</p>
                </div>
              </div>

              <form className="admin-login-form" onSubmit={handleLogin} noValidate>
                <div className="admin-field">
                  <label htmlFor="admin-email">Owner Email</label>
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="username"
                    placeholder="Bikercafearni97@gmail.com"
                    value={email}
                    onChange={(e) => {
                      setAuthError('');
                      setEmail(e.target.value);
                    }}
                    disabled={signingIn}
                    required
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="admin-password">Password</label>
                  <input
                    id="admin-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setAuthError('');
                      setPassword(e.target.value);
                    }}
                    disabled={signingIn}
                    required
                  />
                </div>

                {authError && (
                  <p className="admin-alert admin-alert--error" role="alert">
                    <ShieldAlert size={16} aria-hidden="true" />
                    <span>{authError}</span>
                  </p>
                )}

                <MagneticButton
                  type="submit"
                  variant="primary"
                  disabled={signingIn}
                  icon={signingIn ? Loader2 : Lock}
                >
                  {signingIn ? 'Signing In...' : 'Access Owner Dashboard'}
                </MagneticButton>
              </form>
            </div>
          ) : (
            <div className="admin-dashboard">
              {/* Summary Metrics */}
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <span className="admin-stat-card__label">Total Enquiries</span>
                  <strong className="admin-stat-card__val">{counts.all}</strong>
                </div>
                <div className="admin-stat-card admin-stat-card--new">
                  <span className="admin-stat-card__label">New</span>
                  <strong className="admin-stat-card__val">{counts.new}</strong>
                </div>
                <div className="admin-stat-card admin-stat-card--progress">
                  <span className="admin-stat-card__label">In Progress</span>
                  <strong className="admin-stat-card__val">{counts['in-progress']}</strong>
                </div>
                <div className="admin-stat-card admin-stat-card--resolved">
                  <span className="admin-stat-card__label">Resolved</span>
                  <strong className="admin-stat-card__val">{counts.resolved}</strong>
                </div>
              </div>

              {/* Search & Status Filters */}
              <div className="admin-toolbar">
                <div className="admin-search">
                  <Search size={16} aria-hidden="true" />
                  <input
                    type="search"
                    aria-label="Search enquiries"
                    placeholder="Search by customer name, phone/email, category, or message..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="admin-filter-tabs" role="tablist" aria-label="Filter by status">
                  {STATUS_FILTER_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={statusFilter === tab.id}
                      className={`admin-filter-tab ${
                        statusFilter === tab.id ? 'admin-filter-tab--active' : ''
                      }`}
                      onClick={() => setStatusFilter(tab.id)}
                    >
                      <span>{tab.label}</span>
                      <span className="admin-filter-tab__count">{counts[tab.id] ?? 0}</span>
                    </button>
                  ))}
                </div>
              </div>

              {(enquiriesError || actionError) && (
                <div className="admin-alert admin-alert--error" role="alert">
                  <ShieldAlert size={16} aria-hidden="true" />
                  <span>{enquiriesError || actionError}</span>
                </div>
              )}

              {loadingEnquiries ? (
                <div className="admin-state-card">
                  <Loader2 size={24} className="admin-spin" aria-hidden="true" />
                  <p>Loading customer enquiries...</p>
                </div>
              ) : filteredEnquiries.length === 0 ? (
                <div className="admin-state-card">
                  <Inbox size={26} aria-hidden="true" />
                  <p>
                    {enquiries.length === 0
                      ? 'No customer enquiries submitted yet.'
                      : 'No enquiries match your current search or status filter.'}
                  </p>
                </div>
              ) : (
                <div className="admin-enquiry-list">
                  {filteredEnquiries.map((item) => {
                    const currentStatus = item.status || 'new';
                    const contactActions = buildCustomerContactActions(item);
                    const isUpdating = updatingId === item.id;
                    const isConfirmingDelete = confirmDeleteId === item.id;
                    const isDeleting = deletingId === item.id;

                    return (
                      <article key={item.id} className="admin-enquiry-card">
                        <div className="admin-enquiry-card__top">
                          <div>
                            <div className="admin-enquiry-card__badges">
                              <span className={`admin-status-badge admin-status-badge--${currentStatus}`}>
                                {currentStatus === 'new' && <Sparkles size={12} aria-hidden="true" />}
                                {currentStatus === 'in-progress' && <Clock3 size={12} aria-hidden="true" />}
                                {currentStatus === 'resolved' && <CheckCircle2 size={12} aria-hidden="true" />}
                                {ENQUIRY_STATUSES.find((s) => s.id === currentStatus)?.label ||
                                  currentStatus}
                              </span>
                              <span className="admin-topic-badge">{item.topic}</span>
                            </div>
                            <h2 className="admin-enquiry-card__name">{item.name}</h2>
                            <p className="admin-enquiry-card__contact">{item.contact}</p>
                          </div>

                          <div className="admin-enquiry-card__meta">
                            <span>{formatEnquiryDate(item.createdAt)}</span>
                            <span className="admin-enquiry-card__id">ID: {item.id.slice(0, 8)}</span>
                          </div>
                        </div>

                        <p className="admin-enquiry-card__message">{item.message}</p>

                        <div className="admin-enquiry-card__footer">
                          <div className="admin-contact-actions">
                            {contactActions.map((act) => {
                              const ActionIcon = act.icon;
                              return (
                                <a
                                  key={act.key}
                                  href={act.href}
                                  target={act.external ? '_blank' : undefined}
                                  rel={act.external ? 'noopener noreferrer' : undefined}
                                  className="admin-action-link"
                                >
                                  <ActionIcon size={14} aria-hidden="true" />
                                  <span>{act.label}</span>
                                </a>
                              );
                            })}
                          </div>

                          <div className="admin-workflow-actions">
                            <label className="admin-status-select-wrap">
                              <span className="sr-only">Update status for {item.name}</span>
                              <select
                                value={currentStatus}
                                disabled={isUpdating || isDeleting}
                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                className="admin-status-select"
                              >
                                {ENQUIRY_STATUSES.map((st) => (
                                  <option key={st.id} value={st.id}>
                                    {st.label}
                                  </option>
                                ))}
                              </select>
                            </label>

                            {!isConfirmingDelete ? (
                              <button
                                type="button"
                                className="admin-delete-btn"
                                disabled={isUpdating || isDeleting}
                                onClick={() => setConfirmDeleteId(item.id)}
                              >
                                <Trash2 size={14} aria-hidden="true" />
                                <span>Delete</span>
                              </button>
                            ) : (
                              <div className="admin-delete-confirm">
                                <span>Delete permanently?</span>
                                <button
                                  type="button"
                                  className="admin-delete-confirm__yes"
                                  disabled={isDeleting}
                                  onClick={() => handleConfirmDelete(item.id)}
                                >
                                  {isDeleting ? 'Deleting...' : 'Confirm'}
                                </button>
                                <button
                                  type="button"
                                  className="admin-delete-confirm__cancel"
                                  disabled={isDeleting}
                                  onClick={() => setConfirmDeleteId('')}
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
