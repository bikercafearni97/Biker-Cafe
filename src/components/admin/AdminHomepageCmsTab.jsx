import { useState, useEffect } from 'react';
import {
  Bell,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  ExternalLink,
  Layers,
  Image,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  getAnnouncementContent,
  saveAnnouncementContent,
  getPromotionsContent,
  savePromotionsContent,
  getHighlightsContent,
  saveHighlightsContent,
} from '../../services/homepageCmsService';
import MediaUploader from './MediaUploader';
import MagneticButton from '../ui/MagneticButton';
import './AdminHomepageCmsTab.css';

export default function AdminHomepageCmsTab() {
  const [activeSubTab, setActiveSubTab] = useState('announcement');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Data states
  const [announcement, setAnnouncement] = useState({
    enabled: true,
    text: '',
    linkText: '',
    linkUrl: '',
    badge: '',
    bgColor: '#161922',
    accentColor: '#e11d2a',
  });
  const [promotions, setPromotions] = useState([]);
  const [highlights, setHighlights] = useState([]);

  // Modals state
  const [promoModal, setPromoModal] = useState({ isOpen: false, item: null, isEdit: false });
  const [highlightModal, setHighlightModal] = useState({ isOpen: false, item: null, isEdit: false });

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const [annRes, promoRes, hlRes] = await Promise.all([
          getAnnouncementContent(),
          getPromotionsContent(),
          getHighlightsContent(),
        ]);
        if (!cancelled) {
          setAnnouncement(annRes);
          setPromotions(promoRes);
          setHighlights(hlRes);
        }
      } catch (err) {
        if (!cancelled) {
          setStatusMessage({ type: 'error', text: 'Failed to load CMS content from Firestore: ' + err.message });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const triggerMessage = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage({ type: '', text: '' });
    }, 4500);
  };

  // ── Announcement Handlers ──
  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveAnnouncementContent(announcement);
      triggerMessage('success', 'Announcement bar updated successfully! Changes are live on homepage.');
    } catch (err) {
      triggerMessage('error', 'Error updating announcement bar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Promotions Handlers ──
  const handleSavePromo = async (promoData) => {
    setSaving(true);
    try {
      let updated;
      if (promoModal.isEdit) {
        updated = promotions.map((p) => (p.id === promoData.id ? promoData : p));
      } else {
        const newPromo = { ...promoData, id: 'promo-' + Date.now() };
        updated = [...promotions, newPromo];
      }
      await savePromotionsContent(updated);
      setPromotions(updated);
      setPromoModal({ isOpen: false, item: null, isEdit: false });
      triggerMessage('success', 'Promotional cards updated successfully!');
    } catch (err) {
      triggerMessage('error', 'Failed to save promotion: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePromo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promotional banner?')) return;
    setSaving(true);
    try {
      const updated = promotions.filter((p) => p.id !== id);
      await savePromotionsContent(updated);
      setPromotions(updated);
      triggerMessage('success', 'Promotional banner deleted.');
    } catch (err) {
      triggerMessage('error', 'Failed to delete banner: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePromoActive = async (id) => {
    try {
      const updated = promotions.map((p) => (p.id === id ? { ...p, active: !p.active } : p));
      await savePromotionsContent(updated);
      setPromotions(updated);
      triggerMessage('success', 'Promotional status updated.');
    } catch (err) {
      triggerMessage('error', 'Failed to toggle status: ' + err.message);
    }
  };

  // ── Highlights Handlers ──
  const handleSaveHighlight = async (hlData) => {
    setSaving(true);
    try {
      let updated;
      if (highlightModal.isEdit) {
        updated = highlights.map((h) => (h.id === hlData.id ? hlData : h));
      } else {
        const newHl = { ...hlData, id: 'hl-' + Date.now() };
        updated = [...highlights, newHl];
      }
      await saveHighlightsContent(updated);
      setHighlights(updated);
      setHighlightModal({ isOpen: false, item: null, isEdit: false });
      triggerMessage('success', 'Craft highlights updated successfully!');
    } catch (err) {
      triggerMessage('error', 'Failed to save highlight: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHighlight = async (id) => {
    if (!window.confirm('Delete this craft highlight?')) return;
    try {
      const updated = highlights.filter((h) => h.id !== id);
      await saveHighlightsContent(updated);
      setHighlights(updated);
      triggerMessage('success', 'Craft highlight deleted.');
    } catch (err) {
      triggerMessage('error', 'Failed to delete: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="admin-state-card">
        <Loader2 size={24} className="admin-spin" aria-hidden="true" />
        <p>Loading homepage CMS configurations...</p>
      </div>
    );
  }

  return (
    <div className="admin-cms-tab">
      <div className="cms-header">
        <div>
          <h2 className="cms-header__title">HOMEPAGE CONTENT MANAGEMENT (CMS)</h2>
          <p className="cms-header__desc">
            Directly control live promotional banners, announcement ticker, and craft highlights on the homepage.
          </p>
        </div>
      </div>

      {statusMessage.text && (
        <div
          className={`admin-alert ${
            statusMessage.type === 'error' ? 'admin-alert--error' : 'admin-alert--success'
          }`}
          role="alert"
        >
          {statusMessage.type === 'error' ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Sub navigation */}
      <div className="cms-subnav">
        <button
          type="button"
          className={`cms-subnav-btn ${activeSubTab === 'announcement' ? 'cms-subnav-btn--active' : ''}`}
          onClick={() => setActiveSubTab('announcement')}
        >
          <Bell size={15} />
          Announcement Bar / Ticker
        </button>
        <button
          type="button"
          className={`cms-subnav-btn ${activeSubTab === 'promotions' ? 'cms-subnav-btn--active' : ''}`}
          onClick={() => setActiveSubTab('promotions')}
        >
          <Sparkles size={15} />
          Promotional Banners ({promotions.length})
        </button>
        <button
          type="button"
          className={`cms-subnav-btn ${activeSubTab === 'highlights' ? 'cms-subnav-btn--active' : ''}`}
          onClick={() => setActiveSubTab('highlights')}
        >
          <Layers size={15} />
          Craft Highlights ({highlights.length})
        </button>
      </div>

      {/* ── SubTab 1: Announcement Bar ── */}
      {activeSubTab === 'announcement' && (
        <div className="cms-card">
          <div className="cms-card__title">
            <Bell size={18} />
            <span>Top Announcement Bar &amp; Showroom Notice</span>
          </div>

          <form onSubmit={handleSaveAnnouncement} className="cms-form-grid">
            <div className="admin-field" style={{ gridColumn: '1 / -1' }}>
              <label>
                <input
                  type="checkbox"
                  checked={announcement.enabled}
                  onChange={(e) => setAnnouncement({ ...announcement, enabled: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Show Announcement Bar on Homepage
              </label>
            </div>

            <div className="admin-field" style={{ gridColumn: '1 / -1' }}>
              <label>Announcement Message</label>
              <textarea
                rows={3}
                value={announcement.text}
                onChange={(e) => setAnnouncement({ ...announcement, text: e.target.value })}
                placeholder="e.g. VISIT BIKER CAFE SHOWROOM IN ARNI — NEW 2026 AXOR HELMET BATCH NOW IN STOCK!"
                required
              />
            </div>

            <div className="admin-field">
              <label>Badge Label</label>
              <input
                type="text"
                value={announcement.badge || ''}
                onChange={(e) => setAnnouncement({ ...announcement, badge: e.target.value })}
                placeholder="e.g. NEW ARRIVALS, FLASH SALE"
              />
            </div>

            <div className="admin-field">
              <label>Action Button Text (Optional)</label>
              <input
                type="text"
                value={announcement.linkText || ''}
                onChange={(e) => setAnnouncement({ ...announcement, linkText: e.target.value })}
                placeholder="e.g. Explore Showroom"
              />
            </div>

            <div className="admin-field">
              <label>Action Destination Link</label>
              <input
                type="text"
                value={announcement.linkUrl || ''}
                onChange={(e) => setAnnouncement({ ...announcement, linkUrl: e.target.value })}
                placeholder="e.g. /showroom or /helmet-finder"
              />
            </div>

            <div className="admin-field">
              <label>Accent Color</label>
              <input
                type="color"
                value={announcement.accentColor || '#e11d2a'}
                onChange={(e) => setAnnouncement({ ...announcement, accentColor: e.target.value })}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
              <h4 style={{ color: 'var(--silver-bright)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Live Bar Preview:
              </h4>
              <div
                className="cms-preview-banner"
                style={{
                  backgroundColor: announcement.bgColor || '#161922',
                  borderColor: announcement.accentColor || '#e11d2a',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                  {announcement.badge && (
                    <span
                      style={{
                        background: announcement.accentColor || '#e11d2a',
                        color: '#fff',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                      }}
                    >
                      {announcement.badge}
                    </span>
                  )}
                  <span style={{ color: 'var(--silver-bright)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {announcement.text || 'Preview announcement text...'}
                  </span>
                </div>
                {announcement.linkText && (
                  <span
                    style={{
                      color: announcement.accentColor || '#e11d2a',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {announcement.linkText} &rarr;
                  </span>
                )}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
              <MagneticButton type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Announcement Bar'}
              </MagneticButton>
            </div>
          </form>
        </div>
      )}

      {/* ── SubTab 2: Promotional Banners ── */}
      {activeSubTab === 'promotions' && (
        <div className="cms-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="cms-card__title">
              <Sparkles size={18} />
              <span>Promotional Showcase Cards</span>
            </div>
            <button
              type="button"
              className="admin-action-btn admin-action-btn--primary"
              onClick={() =>
                setPromoModal({
                  isOpen: true,
                  isEdit: false,
                  item: {
                    title: '',
                    subtitle: '',
                    badge: 'SPECIAL OFFER',
                    description: '',
                    imageUrl: '',
                    ctaText: 'View Details',
                    ctaLink: '/showroom',
                    active: true,
                    sortOrder: promotions.length + 1,
                  },
                })
              }
            >
              <Plus size={15} />
              Add Promotional Banner
            </button>
          </div>

          <div className="cms-promo-grid">
            {promotions.map((promo) => (
              <div key={promo.id} className="cms-promo-card">
                {promo.imageUrl ? (
                  <img src={promo.imageUrl} alt={promo.title} className="cms-promo-card__img" />
                ) : (
                  <div className="cms-promo-card__img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Image size={32} style={{ color: 'var(--silver-dim)' }} />
                  </div>
                )}
                <div className="cms-promo-card__body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="cms-promo-card__badge">{promo.badge || 'PROMOTION'}</span>
                    <span style={{ fontSize: '0.72rem', color: promo.active ? 'var(--green-bright, #22c55e)' : 'var(--silver-dim)' }}>
                      {promo.active ? '● Active' : '○ Inactive'}
                    </span>
                  </div>
                  <h4 className="cms-promo-card__title">{promo.title}</h4>
                  <p className="cms-promo-card__subtitle">{promo.subtitle}</p>
                  <p className="cms-promo-card__desc">{promo.description}</p>
                </div>
                <div className="cms-promo-card__footer">
                  <span style={{ fontSize: '0.75rem', color: 'var(--silver-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ExternalLink size={12} /> {promo.ctaLink}
                  </span>
                  <div className="cms-actions-row">
                    <button
                      type="button"
                      className="cms-btn-icon"
                      title={promo.active ? 'Deactivate' : 'Activate'}
                      onClick={() => handleTogglePromoActive(promo.id)}
                    >
                      {promo.active ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button
                      type="button"
                      className="cms-btn-icon"
                      title="Edit banner"
                      onClick={() => setPromoModal({ isOpen: true, isEdit: true, item: promo })}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="cms-btn-icon cms-btn-icon--danger"
                      title="Delete banner"
                      onClick={() => handleDeletePromo(promo.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SubTab 3: Craft Highlights ── */}
      {activeSubTab === 'highlights' && (
        <div className="cms-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="cms-card__title">
              <Layers size={18} />
              <span>Aerodynamic &amp; Craft Highlights (Homepage Feature Section)</span>
            </div>
            <button
              type="button"
              className="admin-action-btn admin-action-btn--primary"
              onClick={() =>
                setHighlightModal({
                  isOpen: true,
                  isEdit: false,
                  item: {
                    title: `0${highlights.length + 1} // NEW SPECIFICATION`,
                    detail: '',
                    active: true,
                  },
                })
              }
            >
              <Plus size={15} />
              Add Craft Highlight
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {highlights.map((hl) => (
              <div
                key={hl.id}
                style={{
                  background: 'var(--bg-surface)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <strong style={{ display: 'block', color: 'var(--red-bright)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', wordBreak: 'break-word' }}>
                    {hl.title}
                  </strong>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--silver-primary)', fontSize: '0.88rem', wordBreak: 'break-word' }}>
                    {hl.detail}
                  </p>
                </div>
                <div className="cms-actions-row">
                  <button
                    type="button"
                    className="cms-btn-icon"
                    onClick={() => setHighlightModal({ isOpen: true, isEdit: true, item: hl })}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    className="cms-btn-icon cms-btn-icon--danger"
                    onClick={() => handleDeleteHighlight(hl.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Promo Modal ── */}
      {promoModal.isOpen && (
        <div className="cms-modal-backdrop">
          <div className="cms-modal">
            <div className="cms-modal__head">
              <h3>{promoModal.isEdit ? 'Edit Promotional Banner' : 'Create Promotional Banner'}</h3>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSavePromo(promoModal.item);
              }}
            >
              <div className="cms-modal__body">
                <div className="admin-field">
                  <label>Title *</label>
                  <input
                    type="text"
                    required
                    value={promoModal.item.title}
                    onChange={(e) =>
                      setPromoModal({
                        ...promoModal,
                        item: { ...promoModal.item, title: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="admin-field">
                  <label>Subtitle / Offer Headline</label>
                  <input
                    type="text"
                    value={promoModal.item.subtitle}
                    onChange={(e) =>
                      setPromoModal({
                        ...promoModal,
                        item: { ...promoModal.item, subtitle: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="admin-field">
                  <label>Badge</label>
                  <input
                    type="text"
                    value={promoModal.item.badge}
                    onChange={(e) =>
                      setPromoModal({
                        ...promoModal,
                        item: { ...promoModal.item, badge: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="admin-field">
                  <label>Description</label>
                  <textarea
                    rows={2}
                    value={promoModal.item.description}
                    onChange={(e) =>
                      setPromoModal({
                        ...promoModal,
                        item: { ...promoModal.item, description: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="admin-field">
                  <label>Banner Image (Upload or Direct URL)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={promoModal.item.imageUrl}
                    onChange={(e) =>
                      setPromoModal({
                        ...promoModal,
                        item: { ...promoModal.item, imageUrl: e.target.value },
                      })
                    }
                  />
                  <div style={{ marginTop: '0.5rem' }}>
                    <MediaUploader
                      onUploadSuccess={(url) =>
                        setPromoModal({
                          ...promoModal,
                          item: { ...promoModal.item, imageUrl: url },
                        })
                      }
                      folderPath="homepageBanners"
                    />
                  </div>
                </div>
                <div className="admin-field">
                  <label>Button Text</label>
                  <input
                    type="text"
                    value={promoModal.item.ctaText}
                    onChange={(e) =>
                      setPromoModal({
                        ...promoModal,
                        item: { ...promoModal.item, ctaText: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="admin-field">
                  <label>Destination Route</label>
                  <input
                    type="text"
                    value={promoModal.item.ctaLink}
                    onChange={(e) =>
                      setPromoModal({
                        ...promoModal,
                        item: { ...promoModal.item, ctaLink: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="admin-field">
                  <label>
                    <input
                      type="checkbox"
                      checked={promoModal.item.active}
                      onChange={(e) =>
                        setPromoModal({
                          ...promoModal,
                          item: { ...promoModal.item, active: e.target.checked },
                        })
                      }
                      style={{ marginRight: '0.5rem' }}
                    />
                    Active / Published
                  </label>
                </div>
              </div>
              <div className="cms-modal__footer">
                <button
                  type="button"
                  className="admin-cancel-btn"
                  onClick={() => setPromoModal({ isOpen: false, item: null, isEdit: false })}
                >
                  Cancel
                </button>
                <MagneticButton type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Banner'}
                </MagneticButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Highlight Modal ── */}
      {highlightModal.isOpen && (
        <div className="cms-modal-backdrop">
          <div className="cms-modal">
            <div className="cms-modal__head">
              <h3>{highlightModal.isEdit ? 'Edit Craft Highlight' : 'Add Craft Highlight'}</h3>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveHighlight(highlightModal.item);
              }}
            >
              <div className="cms-modal__body">
                <div className="admin-field">
                  <label>Specification Code &amp; Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01 // VISOR OPTICS"
                    value={highlightModal.item.title}
                    onChange={(e) =>
                      setHighlightModal({
                        ...highlightModal,
                        item: { ...highlightModal.item, title: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="admin-field">
                  <label>Technical Detail</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Pinlock 70 MaxVision Ready, Anti-Scratch UV400..."
                    value={highlightModal.item.detail}
                    onChange={(e) =>
                      setHighlightModal({
                        ...highlightModal,
                        item: { ...highlightModal.item, detail: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div className="cms-modal__footer">
                <button
                  type="button"
                  className="admin-cancel-btn"
                  onClick={() => setHighlightModal({ isOpen: false, item: null, isEdit: false })}
                >
                  Cancel
                </button>
                <MagneticButton type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Highlight'}
                </MagneticButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
