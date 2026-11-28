import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, Scale, ShoppingBag } from 'lucide-react';
import { buildWhatsAppUrl, SHOWROOM_FINISHES } from '../../data/showroomPlaceholders';
import { useCustomerData } from '../../context/CustomerDataContext';
import { useSmartEnquiry } from '../../context/SmartEnquiryContext';
import { useCart } from '../../context/CartContext';
import { getCustomerStockBadge } from '../../services/inventoryService';
import WhatsAppIcon from '../ui/WhatsAppIcon';
import './ProductCard.css';

export default function ProductCard({ item, index = 0 }) {
  const { isWishlisted, toggleWishlist, isInCompare, addToCompare, removeFromCompare } =
    useCustomerData();
  const { addHelmetToEnquiry, isHelmetInEnquiry } = useSmartEnquiry();
  const { addToCart } = useCart();
  const stockBadge = getCustomerStockBadge(item);

  const finishPreset =
    SHOWROOM_FINISHES.find((f) => f.id === item.previewFinish) || SHOWROOM_FINISHES[0];
  const webpSrc = (item.image || '').replace(/\.(jpe?g|png)$/i, '.webp');
  const imgSize = item.id === 'axor-retro-jet' ? 1080 : 1200;
  const whatsappHref = buildWhatsAppUrl(
    `Hello BIKER CAFE, I would like to enquire about ${item.title}.`
  );

  const wishlisted = isWishlisted(item.id);
  const compared = isInCompare(item.id);
  const inEnquiry = isHelmetInEnquiry(item.id);

  return (
    <motion.article
      className="slot-card"
      layout
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.25), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
    >
      <div className="slot-card__top-bar" aria-hidden="true" />

      {/* 1. PRODUCT IMAGE & MEDIA CONTAINER */}
      <Link
        to={`/showroom/${item.id}`}
        className="slot-card__visual-link"
        aria-label={`View ${item.title} 3D & photo details`}
      >
        <div className="slot-card__visual carbon-grid-bg">
          <div
            className="slot-card__aura"
            style={{
              background: `radial-gradient(circle, ${item.accentColor || '#e11d2a'}28 0%, transparent 70%)`,
            }}
            aria-hidden="true"
          />
          <picture style={{ display: 'contents' }}>
            <source srcSet={webpSrc} type="image/webp" />
            <img
              src={item.image}
              alt={`${item.title} — ${item.subtitle}`}
              width={imgSize}
              height={imgSize}
              className="slot-card__photo"
              loading="lazy"
              decoding="async"
            />
          </picture>

          {/* Slot Code pill inside image */}
          <span className="slot-card__slot-tag">{item.slotCode || 'AXOR'}</span>

          {/* Quick finish badge on image */}
          <span className="slot-card__finish-pill">
            <span
              className="slot-card__finish-dot"
              style={{
                background: `linear-gradient(135deg, ${finishPreset.shellColor} 55%, ${finishPreset.stripeColor} 55%)`,
              }}
              aria-hidden="true"
            />
            {finishPreset.label || 'Obsidian'}
          </span>
        </div>
      </Link>

      {/* 2 & 3. PRODUCT INFO & DETAILS */}
      <div className="slot-card__body">
        <div className="slot-card__brand-row">
          <span className="slot-card__brand">{item.brand || 'AXOR Helmets'}</span>
          <span className="slot-card__cat">{item.category}</span>
        </div>

        <h3 className="slot-card__title">
          <Link to={`/showroom/${item.id}`} className="slot-card__title-link">
            {item.title}
          </Link>
        </h3>
        <p className="slot-card__subtitle">{item.subtitle}</p>

        {/* 3. PRODUCT PRICE */}
        <div className="slot-card__price-row">
          <span className="slot-card__price">{item.priceLabel}</span>
          <span className="slot-card__mrp-note">
            {item.referenceNote || 'Reference MRP'}
          </span>
        </div>

        {/* 4. STOCK AVAILABILITY / STATUS */}
        <div className="slot-card__stock-row">
          <span className={`slot-card__stock-pill slot-card__stock-pill--${stockBadge.classModifier}`}>
            <span className="slot-card__stock-dot" aria-hidden="true" />
            {stockBadge.badgeText}
          </span>
          {item.certification && (
            <span className="slot-card__cert-tag">{item.certification.split(',')[0]}</span>
          )}
        </div>
      </div>

      {/* 5, 6 & 7. ACTION CONTROLS */}
      <div className="slot-card__controls">
        {/* 5. COMPARE & WISHLIST CONTROLS */}
        <div className="slot-card__aux-actions">
          <button
            type="button"
            className={`slot-card__aux-btn ${wishlisted ? 'is-active' : ''}`}
            onClick={() => toggleWishlist(item.id)}
            aria-label={wishlisted ? `Remove ${item.title} from wishlist` : `Add ${item.title} to wishlist`}
            title={wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
          >
            <Heart size={15} fill={wishlisted ? 'currentColor' : 'none'} />
            <span>{wishlisted ? 'Saved' : 'Wishlist'}</span>
          </button>

          <button
            type="button"
            className={`slot-card__aux-btn ${compared ? 'is-active' : ''}`}
            onClick={() => {
              if (compared) removeFromCompare(item.id);
              else addToCompare(item);
            }}
            aria-label={compared ? `Remove ${item.title} from comparison` : `Add ${item.title} to comparison`}
            title={compared ? 'In comparison' : 'Compare'}
          >
            <Scale size={15} />
            <span>{compared ? 'Comparing' : 'Compare'}</span>
          </button>
        </div>

        {/* 6. ADD TO CART PRIMARY BUTTON */}
        <button
          type="button"
          className="slot-card__cart-btn"
          onClick={() => addToCart(item, 'M')}
          aria-label={`Add ${item.title} to cart`}
        >
          <ShoppingBag size={16} />
          <span>Add To Cart</span>
        </button>

        {/* 7. VIEW DETAILS & CONTACT FOOTER */}
        <div className="slot-card__bottom-row">
          <Link
            to={`/showroom/${item.id}`}
            className="slot-card__details-btn"
            aria-label={`View ${item.title} full details`}
          >
            <span>View Details</span>
            <ArrowRight size={13} className="slot-card__arrow" />
          </Link>

          <div className="slot-card__secondary-links">
            <button
              type="button"
              className={`slot-card__icon-link ${inEnquiry ? 'is-added' : ''}`}
              onClick={() => addHelmetToEnquiry(item)}
              title={inEnquiry ? 'Added to WhatsApp Enquiry' : 'Add to WhatsApp Enquiry'}
              aria-label="Add to WhatsApp Enquiry list"
            >
              <span>{inEnquiry ? '✓' : '+'}</span>
            </button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="slot-card__icon-link slot-card__icon-link--wa"
              aria-label={`Enquire about ${item.title} on WhatsApp`}
              title="Chat on WhatsApp"
            >
              <WhatsAppIcon size={14} />
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
