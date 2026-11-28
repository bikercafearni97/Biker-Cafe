import { useState, useEffect } from 'react';
import {
  Star,
  CheckCircle,
  AlertCircle,
  Flag,
  User,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import {
  getProductReviews,
  submitProductReview,
  reportReview,
} from '../../services/reviewsService';
import './ProductReviewsSection.css';

export default function ProductReviewsSection({ productId, productTitle }) {
  const { user } = useCustomerAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review submission form state
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [headline, setHeadline] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reporting state
  const [reportingId, setReportingId] = useState(null);

  const loadReviews = async () => {
    if (!productId) return;
    try {
      const data = await getProductReviews(productId);
      setReviews(data);
    } catch (err) {
      console.warn('Could not load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    getProductReviews(productId)
      .then((data) => {
        if (active) {
          setReviews(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!user) {
      setFormError('Please sign in to write a product review.');
      return;
    }
    if (!comment || comment.trim().length < 5) {
      setFormError('Please write at least 5 characters in your review.');
      return;
    }

    setSubmitting(true);
    try {
      await submitProductReview({
        productId,
        productTitle,
        user,
        rating,
        title: headline,
        comment,
      });
      setSuccessMsg('Thank you! Your review has been submitted for showroom moderation.');
      setShowForm(false);
      setHeadline('');
      setComment('');
      setRating(5);
      await loadReviews();
    } catch (err) {
      setFormError(err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async (reviewId) => {
    const reason = window.prompt('Please specify reason for reporting this review (e.g. spam, offensive):');
    if (!reason) return;
    try {
      await reportReview(reviewId, reason);
      setReportingId(reviewId);
      alert('Review reported to showroom moderators.');
    } catch (err) {
      alert('Failed to report review: ' + err.message);
    }
  };

  // Average Rating Calculation
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1)
      : null;

  return (
    <section className="product-reviews-section">
      <div className="reviews-header">
        <div className="reviews-header__title-block">
          <MessageSquare size={22} className="reviews-icon" />
          <div>
            <h3>Rider Reviews &amp; Ratings</h3>
            <p>Verified feedback and track performance impressions for this helmet model.</p>
          </div>
        </div>

        {reviews.length > 0 && (
          <div className="reviews-rating-summary">
            <div className="rating-num-box">
              <span className="big-rating">{avgRating}</span>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={15}
                    className={star <= Math.round(avgRating) ? 'star-filled' : 'star-empty'}
                  />
                ))}
              </div>
              <span className="total-reviews-count">({reviews.length} reviews)</span>
            </div>
          </div>
        )}

        <div>
          {!showForm && (
            <button
              type="button"
              className="write-review-btn"
              onClick={() => {
                if (!user) {
                  alert('Please sign in with Google on your Profile page to write a review.');
                  return;
                }
                setShowForm(true);
              }}
            >
              Write a Review
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="reviews-alert success">
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form className="review-form-card" onSubmit={handleSubmit}>
          <h4>Write Your Rider Review</h4>

          {formError && (
            <div className="reviews-alert error">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          {/* Star Selector */}
          <div className="star-picker-row">
            <span>Overall Rating:</span>
            <div className="star-picker">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  className="star-btn"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  aria-label={`Rate ${star} star`}
                >
                  <Star
                    size={22}
                    className={
                      star <= (hoverRating || rating) ? 'star-filled' : 'star-empty'
                    }
                  />
                </button>
              ))}
            </div>
            <span className="star-label-desc">
              {rating === 5 && 'Excellent / Track Grade'}
              {rating === 4 && 'Very Good / High Quality'}
              {rating === 3 && 'Average / Standard Fit'}
              {rating === 2 && 'Below Expectation'}
              {rating === 1 && 'Unsatisfactory'}
            </span>
          </div>

          <div className="review-form-input">
            <label htmlFor="review-headline">Review Headline (Optional)</label>
            <input
              id="review-headline"
              type="text"
              placeholder="e.g. Incredible aerodynamic stability at highway speeds"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="review-form-input">
            <label htmlFor="review-comment">
              Your Review / Ride Impressions <span className="req">*</span>
            </label>
            <textarea
              id="review-comment"
              rows={3}
              placeholder="Share details on visor clarity, wind noise, padding comfort, and fitment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              required
            />
          </div>

          <div className="review-form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setShowForm(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="reviews-list">
        {loading ? (
          <p className="reviews-empty-text">Loading rider reviews...</p>
        ) : reviews.length === 0 ? (
          <div className="reviews-empty-box">
            <MessageSquare size={32} />
            <p>No customer reviews submitted for this model yet.</p>
            <span>Be the first rider to share your experience with BIKER CAFE!</span>
          </div>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="review-card">
              <div className="review-card__head">
                <div className="review-author">
                  {rev.userPhoto ? (
                    <img
                      src={rev.userPhoto}
                      alt={rev.userName}
                      className="author-avatar"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="author-avatar-fallback">
                      <User size={15} />
                    </div>
                  )}
                  <div>
                    <div className="author-name-row">
                      <strong>{rev.userName}</strong>
                      {rev.isVerifiedPurchase && (
                        <span className="verified-badge">
                          <ShieldCheck size={13} />
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <span className="review-date">
                      {rev.createdAt?.toDate
                        ? rev.createdAt.toDate().toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Recent Review'}
                    </span>
                  </div>
                </div>

                <div className="review-stars-wrap">
                  <div className="stars-row">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        className={s <= rev.rating ? 'star-filled' : 'star-empty'}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="report-btn"
                    onClick={() => handleReport(rev.id)}
                    title="Report inappropriate review"
                    disabled={reportingId === rev.id || rev.isReported}
                  >
                    <Flag size={12} />
                    <span>{rev.isReported ? 'Reported' : 'Report'}</span>
                  </button>
                </div>
              </div>

              {rev.title && <h5 className="review-headline">{rev.title}</h5>}
              <p className="review-comment">{rev.comment}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
