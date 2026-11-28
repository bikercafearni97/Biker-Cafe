import { useState, useEffect, useCallback } from 'react';
import {
  Star,
  CheckCircle,
  EyeOff,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
} from 'lucide-react';
import {
  getAllReviewsForAdmin,
  setReviewStatus,
  deleteReview,
} from '../../services/reviewsService';
import './AdminReviewsTab.css';

export default function AdminReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllReviewsForAdmin();
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews for admin:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getAllReviewsForAdmin()
      .then((data) => {
        if (active) {
          setReviews(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error(err);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleUpdateStatus = async (reviewId, newStatus) => {
    setActionLoading(true);
    try {
      await setReviewStatus(reviewId, newStatus);
      showNotice(`Review status updated to "${newStatus}"`);
      await fetchReviews();
    } catch (err) {
      alert('Failed to update review status: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
    setActionLoading(true);
    try {
      await deleteReview(reviewId);
      showNotice('Review deleted permanently.');
      await fetchReviews();
    } catch (err) {
      alert('Failed to delete review: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchProduct = r.productTitle?.toLowerCase().includes(q);
      const matchAuthor = r.userName?.toLowerCase().includes(q);
      const matchComment = r.comment?.toLowerCase().includes(q);
      return matchProduct || matchAuthor || matchComment;
    }
    return true;
  });

  const pendingCount = reviews.filter((r) => r.status === 'pending').length;
  const reportedCount = reviews.filter((r) => r.isReported).length;

  return (
    <div className="admin-reviews-tab">
      {/* Metrics Row */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Total Reviews</span>
          <strong className="admin-stat-card__val">{reviews.length}</strong>
        </div>
        <div className="admin-stat-card admin-stat-card--new">
          <span className="admin-stat-card__label">Pending Approval</span>
          <strong className="admin-stat-card__val">{pendingCount}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Reported by Community</span>
          <strong className="admin-stat-card__val">{reportedCount}</strong>
        </div>
      </div>

      {notice && (
        <div className="admin-reviews-notice">
          <CheckCircle size={16} />
          <span>{notice}</span>
        </div>
      )}

      {/* Controls */}
      <div className="admin-reviews-controls">
        <div className="admin-reviews-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search reviews by model, author, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="admin-reviews-filter-row">
          <div className="filter-select-wrapper">
            <Filter size={14} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Moderation Status</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved &amp; Live</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          <button
            type="button"
            className="admin-reviews-refresh"
            onClick={fetchReviews}
            title="Refresh Reviews"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-reviews-loading">
          <RefreshCw size={24} className="spin" />
          <p>Loading customer reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="admin-reviews-empty">
          <Star size={36} />
          <p>No reviews found matching your moderation filter.</p>
        </div>
      ) : (
        <div className="admin-reviews-table-wrapper">
          <table className="admin-reviews-table">
            <thead>
              <tr>
                <th>Product Model</th>
                <th>Rider Author</th>
                <th>Rating</th>
                <th>Review Details</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((rev) => (
                <tr key={rev.id} className={rev.isReported ? 'is-reported' : ''}>
                  <td className="cell-product">
                    <strong>{rev.productTitle}</strong>
                    <span className="model-id">ID: {rev.productId}</span>
                  </td>
                  <td className="cell-author">
                    <strong>{rev.userName}</strong>
                    {rev.isVerifiedPurchase && (
                      <span className="verified-badge-mini">
                        <ShieldCheck size={11} /> Verified
                      </span>
                    )}
                  </td>
                  <td className="cell-stars">
                    <div className="stars-mini">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          className={s <= rev.rating ? 'star-filled' : 'star-empty'}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="cell-comment">
                    {rev.title && <strong className="comment-headline">{rev.title}</strong>}
                    <p className="comment-body">{rev.comment}</p>
                    {rev.isReported && (
                      <div className="reported-banner">
                        <AlertTriangle size={12} />
                        <span>Reported: {rev.reportReason || 'Inappropriate content'}</span>
                      </div>
                    )}
                  </td>
                  <td className="cell-status">
                    <span className={`moderation-chip ${rev.status}`}>{rev.status}</span>
                  </td>
                  <td className="cell-actions">
                    {rev.status !== 'approved' && (
                      <button
                        type="button"
                        className="btn-action approve"
                        onClick={() => handleUpdateStatus(rev.id, 'approved')}
                        disabled={actionLoading}
                        title="Approve & Publish Review"
                      >
                        <CheckCircle size={15} />
                      </button>
                    )}
                    {rev.status !== 'hidden' && (
                      <button
                        type="button"
                        className="btn-action hide"
                        onClick={() => handleUpdateStatus(rev.id, 'hidden')}
                        disabled={actionLoading}
                        title="Hide Review from Showroom"
                      >
                        <EyeOff size={15} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-action delete"
                      onClick={() => handleDelete(rev.id)}
                      disabled={actionLoading}
                      title="Permanently Delete Review"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
