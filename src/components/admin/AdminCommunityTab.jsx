import { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Eye,
  EyeOff,
  Pin,
} from 'lucide-react';
import {
  getCommunityPosts,
  setPostStatus,
  deleteCommunityPost,
  togglePostPin,
  getCommunityEvents,
  saveCommunityEvent,
  deleteCommunityEvent,
} from '../../services/communityService';
import MagneticButton from '../ui/MagneticButton';
import './AdminCommunityTab.css';
import './AdminHomepageCmsTab.css';

export default function AdminCommunityTab() {
  const [activeSubTab, setActiveSubTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Event modal state
  const [eventModal, setEventModal] = useState({ isOpen: false, item: null });
  const [savingEvent, setSavingEvent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const [postsRes, eventsRes] = await Promise.all([
          getCommunityPosts({ includePending: true, maxLimit: 50 }),
          getCommunityEvents(),
        ]);
        if (!cancelled) {
          setPosts(postsRes);
          setEvents(eventsRes);
        }
      } catch (err) {
        if (!cancelled) {
          setStatusMessage({ type: 'error', text: 'Error loading community data: ' + err.message });
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
    setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
  };

  // ── Post Handlers ──
  const handleToggleStatus = async (post) => {
    const nextStatus = post.status === 'approved' ? 'hidden' : 'approved';
    try {
      await setPostStatus(post.id, nextStatus);
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: nextStatus } : p)));
      triggerMessage('success', `Post status set to ${nextStatus}.`);
    } catch (err) {
      triggerMessage('error', 'Failed to update post status: ' + err.message);
    }
  };

  const handleTogglePin = async (post) => {
    try {
      await togglePostPin(post.id, post.isPinned);
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, isPinned: !p.isPinned } : p)));
      triggerMessage('success', post.isPinned ? 'Post unpinned.' : 'Post pinned to top!');
    } catch (err) {
      triggerMessage('error', 'Failed to toggle pin: ' + err.message);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Permanently delete this community post?')) return;
    try {
      await deleteCommunityPost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      triggerMessage('success', 'Post removed.');
    } catch (err) {
      triggerMessage('error', 'Failed to delete post: ' + err.message);
    }
  };

  // ── Event Handlers ──
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setSavingEvent(true);
    try {
      const saved = await saveCommunityEvent(eventModal.item);
      if (eventModal.item.id) {
        setEvents((prev) => prev.map((ev) => (ev.id === saved.id ? saved : ev)));
      } else {
        setEvents((prev) => [...prev, saved]);
      }
      setEventModal({ isOpen: false, item: null });
      triggerMessage('success', 'Group ride event published successfully!');
    } catch (err) {
      triggerMessage('error', 'Failed to save event: ' + err.message);
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this group ride event?')) return;
    try {
      await deleteCommunityEvent(eventId);
      setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
      triggerMessage('success', 'Event deleted.');
    } catch (err) {
      triggerMessage('error', 'Failed to delete event: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="admin-state-card">
        <Loader2 size={24} className="admin-spin" aria-hidden="true" />
        <p>Loading community moderation data...</p>
      </div>
    );
  }

  return (
    <div className="admin-community-tab">
      <div className="cms-header">
        <div>
          <h2 className="cms-header__title">RIDER COMMUNITY MODERATION &amp; EVENTS</h2>
          <p className="cms-header__desc">
            Moderate rider posts, feature high-quality ride stories, and schedule showroom group rides and meetups.
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

      <div className="cms-subnav">
        <button
          type="button"
          className={`cms-subnav-btn ${activeSubTab === 'posts' ? 'cms-subnav-btn--active' : ''}`}
          onClick={() => setActiveSubTab('posts')}
        >
          <Users size={15} />
          Rider Stories ({posts.length})
        </button>
        <button
          type="button"
          className={`cms-subnav-btn ${activeSubTab === 'events' ? 'cms-subnav-btn--active' : ''}`}
          onClick={() => setActiveSubTab('events')}
        >
          <Calendar size={15} />
          Group Rides &amp; Meetups ({events.length})
        </button>
      </div>

      {/* Subtab 1: Moderation for Posts */}
      {activeSubTab === 'posts' && (
        <div className="cms-card">
          <div className="cms-card__title">
            <Users size={18} />
            <span>Submitted Stories &amp; Gear Posts</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {posts.length === 0 ? (
              <p style={{ color: 'var(--silver-muted)', fontSize: '0.85rem' }}>No community stories submitted yet.</p>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="community-item-card">
                  <div className="community-item-content">
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '3px',
                          background: post.status === 'approved' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: post.status === 'approved' ? 'var(--green-bright, #22c55e)' : 'var(--red-bright)',
                        }}
                      >
                        {post.status?.toUpperCase() || 'APPROVED'}
                      </span>
                      {post.isPinned && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--red-bright)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Pin size={10} /> PINNED
                        </span>
                      )}
                      <strong style={{ color: 'var(--silver-bright)', fontSize: '0.88rem', wordBreak: 'break-word' }}>{post.title}</strong>
                    </div>
                    <div className="community-item-meta">
                      <span>By <strong style={{ color: 'var(--silver-bright)' }}>{post.authorName}</strong></span>
                      <span>Bike: {post.motorcycle || 'N/A'}</span>
                      <span>Helmet: {post.helmetUsed || 'N/A'}</span>
                      <span>{post.likeCount || 0} Likes</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--silver-dim)', margin: '0.35rem 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {post.content}
                    </p>
                  </div>

                  <div className="cms-actions-row">
                    <button
                      type="button"
                      className="cms-btn-icon"
                      title={post.isPinned ? 'Unpin' : 'Pin to top'}
                      onClick={() => handleTogglePin(post)}
                    >
                      <Pin size={14} style={{ color: post.isPinned ? 'var(--red-bright)' : 'inherit' }} />
                    </button>
                    <button
                      type="button"
                      className="cms-btn-icon"
                      title={post.status === 'approved' ? 'Hide from public' : 'Approve & publish'}
                      onClick={() => handleToggleStatus(post)}
                    >
                      {post.status === 'approved' ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button
                      type="button"
                      className="cms-btn-icon cms-btn-icon--danger"
                      title="Permanently delete"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Subtab 2: Events & Meetups */}
      {activeSubTab === 'events' && (
        <div className="cms-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="cms-card__title">
              <Calendar size={18} />
              <span>Showroom Group Rides &amp; Breakfast Meetups</span>
            </div>
            <button
              type="button"
              className="admin-action-btn admin-action-btn--primary"
              onClick={() =>
                setEventModal({
                  isOpen: true,
                  item: {
                    title: '',
                    description: '',
                    location: 'Arni, Tamil Nadu',
                    destination: '',
                    distance: '75 km',
                    eventDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
                    time: '06:00 AM',
                    meetupPoint: 'BIKER CAFE Showroom, Arni',
                    bannerUrl: '',
                  },
                })
              }
            >
              <Plus size={15} />
              Schedule Group Ride
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {events.length === 0 ? (
              <p style={{ color: 'var(--silver-muted)', fontSize: '0.85rem' }}>No group rides scheduled yet.</p>
            ) : (
              events.map((ev) => (
                <div key={ev.id} className="community-item-card">
                  <div className="community-item-content">
                    <strong style={{ color: 'var(--silver-bright)', fontSize: '1rem', display: 'block', wordBreak: 'break-word' }}>
                      {ev.title}
                    </strong>
                    <div className="community-item-meta">
                      <span>📅 {ev.eventDate} @ {ev.time}</span>
                      <span>📍 Meetup: {ev.meetupPoint}</span>
                      <span>🏁 Dest: {ev.destination || 'Open Highway'}</span>
                      <span>👥 {ev.attendeeCount || 0} Riders</span>
                    </div>
                  </div>

                  <div className="cms-actions-row">
                    <button
                      type="button"
                      className="cms-btn-icon cms-btn-icon--danger"
                      onClick={() => handleDeleteEvent(ev.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Group Ride Creation Modal */}
      {eventModal.isOpen && (
        <div className="cms-modal-backdrop">
          <div className="cms-modal">
            <div className="cms-modal__head">
              <h3>Schedule Group Ride / Meetup</h3>
            </div>
            <form onSubmit={handleSaveEvent}>
              <div className="cms-modal__body">
                <div className="admin-field">
                  <label>Ride Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sunday Breakfast Ride to Jawadhu Hills"
                    value={eventModal.item.title}
                    onChange={(e) =>
                      setEventModal({
                        ...eventModal,
                        item: { ...eventModal.item, title: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="admin-field">
                  <label>Description &amp; Route Brief</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of the pace, safety gear requirements (full face helmet mandatory), breakfast stop..."
                    value={eventModal.item.description}
                    onChange={(e) =>
                      setEventModal({
                        ...eventModal,
                        item: { ...eventModal.item, description: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="admin-field">
                  <label>Date *</label>
                  <input
                    type="date"
                    required
                    value={eventModal.item.eventDate}
                    onChange={(e) =>
                      setEventModal({
                        ...eventModal,
                        item: { ...eventModal.item, eventDate: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="admin-field">
                  <label>Meetup Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 05:45 AM Gathering, 06:15 AM Rollout"
                    value={eventModal.item.time}
                    onChange={(e) =>
                      setEventModal({
                        ...eventModal,
                        item: { ...eventModal.item, time: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="admin-field">
                  <label>Meetup Point</label>
                  <input
                    type="text"
                    placeholder="e.g. BIKER CAFE Showroom, Arni"
                    value={eventModal.item.meetupPoint}
                    onChange={(e) =>
                      setEventModal({
                        ...eventModal,
                        item: { ...eventModal.item, meetupPoint: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="admin-field">
                  <label>Destination &amp; Approximate Distance</label>
                  <input
                    type="text"
                    placeholder="e.g. Jawadhu Hills Viewpoint (Approx 85 km roundtrip)"
                    value={eventModal.item.destination}
                    onChange={(e) =>
                      setEventModal({
                        ...eventModal,
                        item: { ...eventModal.item, destination: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="cms-modal__footer">
                <button
                  type="button"
                  className="admin-cancel-btn"
                  onClick={() => setEventModal({ isOpen: false, item: null })}
                >
                  Cancel
                </button>
                <MagneticButton type="submit" variant="primary" disabled={savingEvent}>
                  {savingEvent ? 'Publishing...' : 'Publish Group Ride'}
                </MagneticButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
