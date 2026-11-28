import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Sparkles, Trash2 } from 'lucide-react';
import { useCustomerData } from '../context/CustomerDataContext';
import { useShowroomProducts } from '../hooks/useShowroomProducts';
import PageSeo from '../components/seo/PageSeo';
import ProductCard from '../components/showroom/ProductCard';
import './WishlistPage.css';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, mergePrompt, confirmMerge, dismissMerge } =
    useCustomerData();
  const { products, loading } = useShowroomProducts();

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="wishlist-page">
      <PageSeo
        title="My Wishlist | BIKER CAFE"
        description="Saved AXOR helmets and favourites at BIKER CAFE Arni."
        robots="noindex, nofollow"
      />

      <section className="wishlist-hero section-pad">
        <div className="container">
          <div className="wishlist-hero__top">
            <span className="eyebrow">Customer Garage // Saved Gear</span>
            <h1 className="wishlist-hero__title">
              MY <span className="metallic-text">WISHLIST</span>
            </h1>
            <p className="wishlist-hero__copy">
              Track and compare your selected AXOR helmets. All selections remain saved to your
              profile or local browser session.
            </p>
          </div>

          {mergePrompt && (
            <div className="wishlist-merge-banner" role="status">
              <Sparkles size={18} className="wishlist-merge-icon" aria-hidden="true" />
              <div className="wishlist-merge-content">
                <strong>Sync Guest Favourites</strong>
                <p>We noticed you saved items while browsing as a guest. Would you like to merge them with your account?</p>
              </div>
              <div className="wishlist-merge-actions">
                <button type="button" className="wishlist-merge-btn wishlist-merge-btn--confirm" onClick={confirmMerge}>
                  Merge Favourites
                </button>
                <button type="button" className="wishlist-merge-btn wishlist-merge-btn--dismiss" onClick={dismissMerge}>
                  Keep Separate
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="wishlist-state-card">
              <p>Loading your saved helmets...</p>
            </div>
          ) : wishlistedProducts.length === 0 ? (
            <div className="wishlist-empty">
              <Heart size={36} className="wishlist-empty__icon" aria-hidden="true" />
              <h2>No Helmets in Wishlist</h2>
              <p>
                Browse our curated AXOR collection and tap the heart icon on any model to keep it
                saved for quick access.
              </p>
              <Link to="/showroom" className="wishlist-browse-btn">
                <span>Explore Showroom</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="wishlist-grid">
              {wishlistedProducts.map((item, index) => (
                <div key={item.id} className="wishlist-item-wrapper">
                  <ProductCard item={item} index={index} />
                  <button
                    type="button"
                    className="wishlist-remove-btn"
                    onClick={() => removeFromWishlist(item.id)}
                    aria-label={`Remove ${item.title} from wishlist`}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    <span>Remove from Wishlist</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
