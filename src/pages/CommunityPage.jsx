import { useState, useEffect } from 'react';
import {
  Users,
  Compass,
  Calendar,
  Heart,
  MessageSquare,
  Plus,
  Send,
  MapPin,
  Shield,
  Loader2,
  Bike,
  Sparkles,
  Navigation,
} from 'lucide-react';
import {
  getCommunityPosts,
  createCommunityPost,
  togglePostLike,
  addPostComment,
  getCommunityEvents,
  toggleEventRsvp,
  POST_CATEGORIES,
} from '../services/communityService';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import MagneticButton from '../components/ui/MagneticButton';
import MediaUploader from '../components/admin/MediaUploader';
import PageSeo from '../components/seo/PageSeo';
import './CommunityPage.css';

export default function CommunityPage() {
  const { user } = useCustomerAuth();
  const [activeTab, setActiveTab] = useState('stories'); // 'stories' | 'events'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Post Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [postForm, setPostForm] = useState({
    title: '',
    category: 'ride-story',
    location: '',
    motorcycle: '',
    helmetUsed: '',
    content: '',
    images: [],
  });

  // Comments toggled per post
  const [openComments, setOpenComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const [postsRes, eventsRes] = await Promise.all([
          getCommunityPosts({ category: selectedCategory }),
          getCommunityEvents(),
        ]);
        if (!cancelled) {
          setPosts(postsRes);
          setEvents(eventsRes);
        }
      } catch (err) {
        console.warn('Error loading community data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in or register to publish your ride story.');
      return;
    }
    setSubmittingPost(true);
    try {
      const created = await createCommunityPost(user, postForm);
      setPosts([created, ...posts]);
      setShowCreateModal(false);
      setPostForm({
        title: '',
        category: 'ride-story',
        location: '',
        motorcycle: '',
        helmetUsed: '',
        content: '',
        images: [],
      });
    } catch (err) {
      alert('Failed to post story: ' + err.message);
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleLikePost = async (postId) => {
    if (!user) {
      alert('Please sign in to like community posts.');
      return;
    }
    try {
      const isLikedNow = await togglePostLike(postId, user.uid);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const likes = p.likes || [];
          return {
            ...p,
            likeCount: isLikedNow ? (p.likeCount || 0) + 1 : Math.max(0, (p.likeCount || 1) - 1),
            likes: isLikedNow ? [...likes, user.uid] : likes.filter((uid) => uid !== user.uid),
          };
        })
      );
    } catch (err) {
      console.warn('Like failed:', err);
    }
  };

  const handleAddComment = async (postId) => {
    if (!user) {
      alert('Please sign in to comment.');
      return;
    }
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    try {
      const newComment = await addPostComment(postId, user, text);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            commentCount: (p.commentCount || 0) + 1,
            comments: [...(p.comments || []), newComment],
          };
        })
      );
      setCommentInputs({ ...commentInputs, [postId]: '' });
    } catch (err) {
      alert('Failed to add comment: ' + err.message);
    }
  };

  const handleRsvp = async (eventId) => {
    if (!user) {
      alert('Please sign in to join or RSVP for this ride event.');
      return;
    }
    try {
      const isAttending = await toggleEventRsvp(eventId, user);
      setEvents((prev) =>
        prev.map((ev) => {
          if (ev.id !== eventId) return ev;
          const currentAttendees = ev.attendees || [];
          return {
            ...ev,
            attendeeCount: isAttending
              ? (ev.attendeeCount || 0) + 1
              : Math.max(0, (ev.attendeeCount || 1) - 1),
            attendees: isAttending
              ? [...currentAttendees, { userId: user.uid, name: user.displayName || 'Rider' }]
              : currentAttendees.filter((a) => a.userId !== user.uid),
          };
        })
      );
    } catch (err) {
      alert('RSVP error: ' + err.message);
    }
  };

  return (
    <div className="community-page">
      <PageSeo
        title="Rider Community & Meetups | BIKER CAFE — ARNI"
        description="Connect with fellow motorcyclists in Arni. Read verified ride stories, gear reviews, motorcycle modifications, and join weekend group rides."
        robots="index, follow"
      />

      <section className="community-hero">
        <div className="container">
          <span className="eyebrow">ARNI RIDER BROTHERHOOD</span>
          <div className="community-hero__row">
            <div>
              <h1 className="community-hero__title">
                RIDER <span className="metallic-text">COMMUNITY</span>
              </h1>
              <p className="community-hero__lead">
                The open road connects us. Share your journeys, helmet fitment insights, track day stories, and join upcoming showroom meetups and weekend breakfast rides.
              </p>
            </div>
            <div>
              <MagneticButton
                variant="primary"
                icon={Plus}
                onClick={() => {
                  if (!user) alert('Please sign in to publish your story.');
                  else setShowCreateModal(true);
                }}
              >
                Share Ride Story
              </MagneticButton>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          {/* Main Navigation Tabs */}
          <div className="community-nav-tabs" role="tablist">
            <button
              type="button"
              className={`community-tab-btn ${activeTab === 'stories' ? 'community-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('stories')}
            >
              <Compass size={16} />
              Rider Stories &amp; Gear Posts ({posts.length})
            </button>
            <button
              type="button"
              className={`community-tab-btn ${activeTab === 'events' ? 'community-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              <Calendar size={16} />
              Meetups &amp; Weekend Rides ({events.length})
            </button>
          </div>

          {/* Sub Categories for Stories */}
          {activeTab === 'stories' && (
            <div className="community-categories">
              {POST_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`community-cat-pill ${
                    selectedCategory === cat.id ? 'community-cat-pill--active' : ''
                  }`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="admin-state-card">
              <Loader2 size={24} className="admin-spin" aria-hidden="true" />
              <p>Loading community dispatches...</p>
            </div>
          ) : activeTab === 'stories' ? (
            posts.length === 0 ? (
              <div className="admin-state-card">
                <Users size={32} style={{ color: 'var(--silver-dim)' }} />
                <h3>No stories in this category yet</h3>
                <p>Be the first rider from Arni to share your ride experience or helmet gear review!</p>
              </div>
            ) : (
              <div className="community-grid">
                {posts.map((post) => {
                  const hasLiked = user && (post.likes || []).includes(user.uid);
                  const showComments = openComments[post.id];
                  return (
                    <article key={post.id} className="community-card">
                      <div className="community-card__head">
                        <div className="community-card__author">
                          {post.authorPhoto ? (
                            <img
                              src={post.authorPhoto}
                              alt={post.authorName}
                              className="community-card__avatar"
                            />
                          ) : (
                            <div className="community-card__avatar">
                              <Bike size={18} />
                            </div>
                          )}
                          <div className="community-card__author-info">
                            <strong>{post.authorName || 'Rider'}</strong>
                            <span>{post.location || 'Arni / Tamil Nadu'}</span>
                          </div>
                        </div>
                        <span className="community-card__badge">
                          {post.category?.replace('-', ' ').toUpperCase() || 'STORY'}
                        </span>
                      </div>

                      {post.images && post.images.length > 0 && (
                        <div className="community-card__media">
                          <img src={post.images[0].url || post.images[0]} alt={post.title} loading="lazy" />
                        </div>
                      )}

                      <div className="community-card__body">
                        <h3 className="community-card__title">{post.title}</h3>
                        <div className="community-card__tags">
                          {post.motorcycle && (
                            <span className="community-card__tag">
                              <Bike size={12} /> {post.motorcycle}
                            </span>
                          )}
                          {post.helmetUsed && (
                            <span className="community-card__tag">
                              <Shield size={12} /> {post.helmetUsed}
                            </span>
                          )}
                        </div>
                        <p className="community-card__desc">{post.content}</p>
                      </div>

                      <div className="community-card__footer">
                        <div className="community-card__actions">
                          <button
                            type="button"
                            className={`community-action-btn ${hasLiked ? 'community-action-btn--liked' : ''}`}
                            onClick={() => handleLikePost(post.id)}
                          >
                            <Heart size={15} fill={hasLiked ? 'currentColor' : 'none'} />
                            <span>{post.likeCount || 0}</span>
                          </button>
                          <button
                            type="button"
                            className="community-action-btn"
                            onClick={() =>
                              setOpenComments({
                                ...openComments,
                                [post.id]: !openComments[post.id],
                              })
                            }
                          >
                            <MessageSquare size={15} />
                            <span>{post.commentCount || (post.comments?.length || 0)}</span>
                          </button>
                        </div>
                      </div>

                      {showComments && (
                        <div className="community-comments-panel">
                          {(post.comments || []).map((comm) => (
                            <div key={comm.id} className="community-comment">
                              <strong>{comm.authorName}:</strong>
                              <span>{comm.text}</span>
                            </div>
                          ))}
                          <div className="community-comment-input">
                            <input
                              type="text"
                              placeholder="Write a comment..."
                              value={commentInputs[post.id] || ''}
                              onChange={(e) =>
                                setCommentInputs({
                                  ...commentInputs,
                                  [post.id]: e.target.value,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddComment(post.id);
                              }}
                            />
                            <button
                              type="button"
                              className="admin-action-btn admin-action-btn--primary"
                              onClick={() => handleAddComment(post.id)}
                            >
                              <Send size={13} />
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )
          ) : (
            /* Events & Meetups Tab */
            events.length === 0 ? (
              <div className="admin-state-card">
                <Calendar size={32} style={{ color: 'var(--silver-dim)' }} />
                <h3>No upcoming group rides scheduled</h3>
                <p>Check back soon or follow BIKER CAFE WhatsApp community for sudden weekend ride calls.</p>
              </div>
            ) : (
              <div className="community-events-grid">
                {events.map((ev) => {
                  const isUserAttending =
                    user && (ev.attendees || []).some((a) => a.userId === user.uid);
                  return (
                    <article key={ev.id} className="community-event-card">
                      <span className="community-event-card__badge">
                        <Sparkles size={12} /> {ev.status?.toUpperCase() || 'UPCOMING RIDE'}
                      </span>
                      <h3 className="community-event-card__title">{ev.title}</h3>
                      <p style={{ fontSize: '0.86rem', color: 'var(--silver-muted)', margin: 0 }}>
                        {ev.description}
                      </p>

                      <div className="community-event-card__details">
                        <div className="community-event-row">
                          <Calendar size={14} />
                          <span>{ev.eventDate} @ {ev.time}</span>
                        </div>
                        <div className="community-event-row">
                          <MapPin size={14} />
                          <span>Meetup: {ev.meetupPoint}</span>
                        </div>
                        {ev.destination && (
                          <div className="community-event-row">
                            <Navigation size={14} />
                            <span>Destination: {ev.destination} ({ev.distance || 'Approx 80km'})</span>
                          </div>
                        )}
                        <div className="community-event-row">
                          <Users size={14} />
                          <span>{ev.attendeeCount || 0} Riders Confirmed</span>
                        </div>
                      </div>

                      <div style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
                        <MagneticButton
                          variant={isUserAttending ? 'silver' : 'primary'}
                          onClick={() => handleRsvp(ev.id)}
                        >
                          {isUserAttending ? 'Attending ✓ (Leave Ride)' : 'Join Group Ride (RSVP)'}
                        </MagneticButton>
                      </div>
                    </article>
                  );
                })}
              </div>
            )
          )}
        </div>
      </section>

      {/* Share Post Modal */}
      {showCreateModal && (
        <div className="cms-modal-backdrop">
          <div className="cms-modal">
            <div className="cms-modal__head">
              <h3>Share Your Ride Story</h3>
            </div>
            <form onSubmit={handleCreatePost}>
              <div className="cms-modal__body">
                <div className="admin-field">
                  <label>Story Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Monsoon Ride to Jawadhu Hills in Axor Apex"
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  />
                </div>

                <div className="admin-field">
                  <label>Category</label>
                  <select
                    value={postForm.category}
                    onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                  >
                    <option value="ride-story">Ride Story</option>
                    <option value="gear-review">Gear Experience &amp; Helmet Fitment</option>
                    <option value="route-guide">Route &amp; Destination Guide</option>
                    <option value="bike-mods">Motorcycle Modifications</option>
                  </select>
                </div>

                <div className="admin-field">
                  <label>Motorcycle Model</label>
                  <input
                    type="text"
                    placeholder="e.g. KTM Duke 390 / Royal Enfield Hunter 350"
                    value={postForm.motorcycle}
                    onChange={(e) => setPostForm({ ...postForm, motorcycle: e.target.value })}
                  />
                </div>

                <div className="admin-field">
                  <label>Helmet / Protective Gear Used</label>
                  <input
                    type="text"
                    placeholder="e.g. AXOR Apex Venom Carbon"
                    value={postForm.helmetUsed}
                    onChange={(e) => setPostForm({ ...postForm, helmetUsed: e.target.value })}
                  />
                </div>

                <div className="admin-field">
                  <label>Your Story / Experience *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Share the road conditions, visor performance, highway cruising tips..."
                    value={postForm.content}
                    onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                  />
                </div>

                <div className="admin-field">
                  <label>Ride Photo (Upload or URL)</label>
                  <MediaUploader
                    onUploadSuccess={(url) =>
                      setPostForm({
                        ...postForm,
                        images: [{ url, isPrimary: true }],
                      })
                    }
                    folderPath="communityPosts"
                  />
                </div>
              </div>

              <div className="cms-modal__footer">
                <button
                  type="button"
                  className="admin-cancel-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <MagneticButton type="submit" variant="primary" disabled={submittingPost}>
                  {submittingPost ? 'Publishing...' : 'Publish Story'}
                </MagneticButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
