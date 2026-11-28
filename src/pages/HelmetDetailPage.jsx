import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Check,
  CheckCircle2,
  Heart,
  Image as ImageIcon,
  Package,
  Plus,
  Ruler,
  Scale,
  ShieldAlert,
  ShoppingBag,
  Wind,
} from 'lucide-react';
import {
  buildWhatsAppUrl,
  PRICE_DISCLAIMER,
  REFERENCE_MRP_LABEL,
  SHOWROOM_FINISHES,
  SHOWROOM_SIZES,
  SHOWROOM_SLOTS,
} from '../data/showroomPlaceholders';
import { useShowroomProducts } from '../hooks/useShowroomProducts';
import { useCustomerData } from '../context/CustomerDataContext';
import { useSmartEnquiry } from '../context/SmartEnquiryContext';
import { useCart } from '../context/CartContext';
import { getCustomerStockBadge } from '../services/inventoryService';
import HelmetSizeGuide from '../components/showroom/HelmetSizeGuide';
import ProductReviewsSection from '../components/reviews/ProductReviewsSection';
import MagneticButton from '../components/ui/MagneticButton';
import WhatsAppIcon from '../components/ui/WhatsAppIcon';
import PageSeo from '../components/seo/PageSeo';
import './HelmetDetailPage.css';

const HelmetStage = lazy(() => import('../components/three/HelmetStage'));
const ModelViewer3D = lazy(() => import('../components/three/ModelViewer3D'));

function DetailStageFallback() {
  return (
    <div className="detail-stage-fallback" aria-label="Loading 3D helmet preview">
      <div className="detail-stage-spinner" />
      <span>Loading 3D Preview...</span>
    </div>
  );
}

export default function HelmetDetailPage() {
  const { id } = useParams();
  const [selectedSize, setSelectedSize] = useState('M');
  const [mediaView, setMediaView] = useState('photo');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const { products, loading: productsLoading } = useShowroomProducts();
  const activeCatalog = products.length > 0 ? products : SHOWROOM_SLOTS;

  const { isWishlisted, toggleWishlist, isInCompare, addToCompare, removeFromCompare, recordView } =
    useCustomerData();
  const { addHelmetToEnquiry, isHelmetInEnquiry } = useSmartEnquiry();
  const { addToCart } = useCart();

  const slotIndex = activeCatalog.findIndex((item) => item.id === id);
  const slot = slotIndex >= 0 ? activeCatalog[slotIndex] : null;

  // Record recently viewed once slot is available
  useEffect(() => {
    if (slot) {
      recordView(slot);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot?.id]);

  const defaultFinish =
    SHOWROOM_FINISHES.find((f) => f.id === slot?.previewFinish) || SHOWROOM_FINISHES[0];
  const [prevSlotId, setPrevSlotId] = useState(id);
  const [selectedFinish, setSelectedFinish] = useState(defaultFinish);

  if (id !== prevSlotId) {
    setPrevSlotId(id);
    setSelectedFinish(defaultFinish);
    setMediaView('photo');
    setSelectedPhotoIndex(0);
    setShowSizeGuide(false);
  }

  if (!slot && productsLoading) {
    return (
      <div className="detail-missing container section-pad">
        <PageSeo
          title="Loading Helmet Details... | BIKER CAFE"
          description="Loading helmet specifications."
          robots="noindex, nofollow"
        />
        <DetailStageFallback />
      </div>
    );
  }

  if (!slot) {
    return (
      <div className="detail-missing container section-pad">
        <PageSeo
          title="Model Not Found | BIKER CAFE — ARNI"
          description="The requested AXOR helmet model could not be located in the current BIKER CAFE Arni showroom catalogue."
          robots="noindex, nofollow"
        />
        <h1>Showroom Model Unavailable</h1>
        <p>The requested AXOR helmet model could not be located in the current catalogue.</p>
        <MagneticButton to="/showroom" variant="primary" icon={ArrowLeft}>
          Back to Showroom
        </MagneticButton>
      </div>
    );
  }

  const prevSlot =
    activeCatalog[(slotIndex - 1 + activeCatalog.length) % activeCatalog.length];
  const nextSlot = activeCatalog[(slotIndex + 1) % activeCatalog.length];

  // Multi-image gallery support: fall back to single slot.image
  const galleryImages = Array.isArray(slot.images) && slot.images.length > 0
    ? slot.images
    : [{ url: slot.image, alt: slot.title, isPrimary: true }];

  const currentDisplayImage = galleryImages[selectedPhotoIndex]?.url || slot.image || '';
  const webpSrc = currentDisplayImage.replace(/\.(jpe?g|png)$/i, '.webp');
  const imgSize = slot.id === 'axor-retro-jet' ? 1080 : 1200;

  // Stock status badge configuration
  const stockBadge = getCustomerStockBadge(slot);

  const whatsappMessage =
    mediaView === '3d'
      ? `Hello BIKER CAFE, I would like to enquire about ${slot.title} (${selectedFinish.label} finish).`
      : `Hello BIKER CAFE, I would like to enquire about ${slot.title}.`;

  return (
    <div className="detail-page">
      <PageSeo
        title={`${slot.title} — ${slot.subtitle} | BIKER CAFE — ARNI`}
        description={`${slot.title} (${slot.certification}) at BIKER CAFE Arni. ${slot.summary}`}
        robots="index, follow"
        ogImage={slot.image}
        ogImageAlt={`${slot.title} — ${slot.subtitle}`}
      />
      <div className="container detail-wrap">
        {/* Top Breadcrumb Bar */}
        <div className="detail-topbar">
          <Link to="/showroom" className="detail-back">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back to AXOR Showroom</span>
          </Link>
        </div>

        {/* Main 2-Column Layout */}
        <div className="detail-grid">
          {/* Unified Product Media Showcase: Product Photo (Default) | 3D Preview */}
          <motion.div
            className="detail-stage-col"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="detail-media-panel">
              <div className="detail-media-panel__bar">
                <div
                  className="detail-media-tabs"
                  role="tablist"
                  aria-label="Product showcase mode"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mediaView === 'photo'}
                    className={`detail-media-tab ${mediaView === 'photo' ? 'is-active' : ''}`}
                    onClick={() => setMediaView('photo')}
                  >
                    {mediaView === 'photo' && (
                      <motion.span
                        layoutId="detail-media-pill"
                        className="detail-media-tab__pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      />
                    )}
                    <span className="detail-media-tab__label">
                      <ImageIcon size={14} aria-hidden="true" />
                      Product Photos ({galleryImages.length})
                    </span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={mediaView === '3d'}
                    className={`detail-media-tab ${mediaView === '3d' ? 'is-active' : ''}`}
                    onClick={() => setMediaView('3d')}
                  >
                    {mediaView === '3d' && (
                      <motion.span
                        layoutId="detail-media-pill"
                        className="detail-media-tab__pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      />
                    )}
                    <span className="detail-media-tab__label">
                      <Box size={14} aria-hidden="true" />
                      3D Preview
                    </span>
                  </button>
                </div>
              </div>

              {mediaView === 'photo' ? (
                <div className="detail-photo-view" role="tabpanel" aria-label="Product Photo view">
                  <div className="detail-photo-view__frame">
                    <picture style={{ display: 'contents' }}>
                      <source srcSet={webpSrc} type="image/webp" />
                      <img
                        src={currentDisplayImage}
                        alt={`${slot.title} — ${slot.subtitle}`}
                        width={imgSize}
                        height={imgSize}
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                      />
                    </picture>
                  </div>

                  {/* Multi-Photo Thumbnail Bar */}
                  {galleryImages.length > 1 && (
                    <div className="detail-photo-gallery-thumbs" role="group" aria-label="Product gallery thumbnails">
                      {galleryImages.map((img, idx) => (
                        <button
                          key={img.url || idx}
                          type="button"
                          className={`detail-gallery-thumb ${selectedPhotoIndex === idx ? 'is-active' : ''}`}
                          onClick={() => setSelectedPhotoIndex(idx)}
                          aria-label={`View photo ${idx + 1}`}
                        >
                          <img src={img.url} alt={img.alt || `Thumbnail ${idx + 1}`} />
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="detail-media-caption">
                    {slot.title} &mdash; Official photograph {galleryImages.length > 1 ? `(${selectedPhotoIndex + 1} of ${galleryImages.length})` : ''}
                  </p>
                </div>
              ) : (
                <div className="detail-3d-view" role="tabpanel" aria-label="3D Preview view">
                  {/* If product has custom uploaded 3D model, render with ModelViewer3D */}
                  {slot.model3D?.enabled && slot.model3D?.url ? (
                    <Suspense fallback={<DetailStageFallback />}>
                      <ModelViewer3D
                        modelUrl={slot.model3D.url}
                        alt={`${slot.title} 3D Model`}
                        height="440px"
                      />
                      <p className="detail-media-caption detail-media-caption--3d">
                        Interactive 3D helmet model &mdash; Drag to rotate 360&deg;, scroll/pinch to zoom.
                      </p>
                    </Suspense>
                  ) : (
                    /* Fallback to existing interactive AXOR HelmetStage */
                    <Suspense fallback={<DetailStageFallback />}>
                      <HelmetStage
                        initialFinishId={slot.previewFinish}
                        onFinishChange={setSelectedFinish}
                      />
                      <p className="detail-media-caption detail-media-caption--3d">
                        Interactive 3D concept preview for finish &amp; visor demonstration &mdash; not
                        an exact replica of the AXOR shell graphics.
                      </p>
                    </Suspense>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Product Information & Enquiry */}
          <motion.div
            className="detail-info-col"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="detail-meta-row">
              <span className="detail-code">{slot.brand}</span>
              <span className={`detail-stock-badge detail-stock-badge--${stockBadge.classModifier}`}>
                <Package size={13} aria-hidden="true" />
                {stockBadge.badgeText}
              </span>
              <span className="detail-cat">{slot.category}</span>
            </div>

            <h1 className="detail-title">{slot.title}</h1>
            <p className="detail-subtitle">{slot.subtitle}</p>
            <div className="detail-price-row">
              <div className="detail-price-group">
                <span className="detail-price">{slot.priceLabel}</span>
                <span className="detail-mrp-tag">{REFERENCE_MRP_LABEL}</span>
              </div>
              <span className="detail-fit-tag">
                <Wind size={14} aria-hidden="true" />
                {slot.fitNote}
              </span>
            </div>

            {/* Customer-Facing Stock & Availability Notice */}
            <div className={`detail-availability-banner detail-availability-banner--${stockBadge.classModifier}`}>
              <CheckCircle2 size={16} aria-hidden="true" />
              <span>{stockBadge.label}</span>
            </div>

            <p className="detail-summary">{slot.summary}</p>

            {/* Official Features List */}
            {slot.highlights?.length > 0 && (
              <ul className="detail-highlights">
                {slot.highlights.map((point) => (
                  <li key={point}>
                    <Check size={14} aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Fitting Size Reference */}
            <div className="detail-sizes">
              <div className="detail-sizes__head">
                <span>Fitting Size Reference</span>
                <button
                  type="button"
                  className="detail-size-guide-toggle"
                  onClick={() => setShowSizeGuide((prev) => !prev)}
                >
                  <Ruler size={13} aria-hidden="true" />
                  <span>{showSizeGuide ? 'Hide Size Guide' : 'Size Guide & Measurement'}</span>
                </button>
              </div>
              <div className="detail-sizes__grid" role="group" aria-label="Fitting size reference">
                {SHOWROOM_SIZES.map((size) => {
                  const active = size === selectedSize;
                  // If size variant exists in inventory, check if out of stock
                  const variant = slot.inventory?.variants?.find((v) => v.size === size);
                  const isOutOfStock = slot.inventory?.trackingEnabled && variant && Number(variant.quantity) === 0;

                  return (
                    <button
                      key={size}
                      type="button"
                      className={`detail-size-btn ${active ? 'is-active' : ''} ${isOutOfStock ? 'is-out-of-stock' : ''}`}
                      onClick={() => setSelectedSize(size)}
                      aria-pressed={active}
                      title={isOutOfStock ? `${size} (Currently out of stock)` : size}
                    >
                      {size}
                      {isOutOfStock && <span className="detail-size-btn__sub">Out</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Size Guide Accordion */}
            {showSizeGuide && (
              <div className="detail-size-guide-panel">
                <HelmetSizeGuide helmetTitle={slot.title} />
              </div>
            )}

            {/* Customer Interaction Hub: Wishlist, Compare, Multi-Enquiry */}
            <div className="detail-customer-hub">
              <button
                type="button"
                className={`detail-hub-btn ${isWishlisted(slot.id) ? 'is-active' : ''}`}
                onClick={() => toggleWishlist(slot.id)}
              >
                <Heart size={15} fill={isWishlisted(slot.id) ? 'currentColor' : 'none'} />
                <span>{isWishlisted(slot.id) ? 'Wishlisted' : 'Save to Wishlist'}</span>
              </button>

              <button
                type="button"
                className={`detail-hub-btn ${isInCompare(slot.id) ? 'is-active' : ''}`}
                onClick={() => {
                  if (isInCompare(slot.id)) {
                    removeFromCompare(slot.id);
                  } else {
                    addToCompare(slot);
                  }
                }}
              >
                <Scale size={15} />
                <span>{isInCompare(slot.id) ? 'In Compare (3 Max)' : 'Compare Specs'}</span>
              </button>

              <button
                type="button"
                className={`detail-hub-btn ${isHelmetInEnquiry(slot.id) ? 'is-active' : ''}`}
                onClick={() => addHelmetToEnquiry(slot, selectedSize)}
              >
                <Plus size={15} />
                <span>{isHelmetInEnquiry(slot.id) ? 'In Multi-Enquiry' : 'Add to Multi-Enquiry'}</span>
              </button>
            </div>

            {/* Official Technical Specification Table */}
            <div className="detail-specs">
              <h2 className="detail-specs__heading">Specifications</h2>
              <dl className="detail-specs__list">
                <div>
                  <dt>Standards</dt>
                  <dd>{slot.certification}</dd>
                </div>
                <div>
                  <dt>Shell Material</dt>
                  <dd>{slot.shellSpec}</dd>
                </div>
                <div>
                  <dt>Weight</dt>
                  <dd>{slot.weightSpec}</dd>
                </div>
                <div>
                  <dt>Visor</dt>
                  <dd>{slot.visorSpec}</dd>
                </div>
                <div>
                  <dt>Ventilation</dt>
                  <dd>{slot.ventilationSpec}</dd>
                </div>
                <div>
                  <dt>Retention</dt>
                  <dd>{slot.retentionSpec}</dd>
                </div>
              </dl>
            </div>

            <div className="detail-notice" role="note">
              <ShieldAlert size={16} aria-hidden="true" />
              <span>{PRICE_DISCLAIMER}</span>
            </div>

            <div className="detail-actions">
              <button
                type="button"
                className="detail-add-cart-btn"
                onClick={() => addToCart(slot, selectedSize, selectedFinish?.id)}
              >
                <ShoppingBag size={18} />
                <span>Add to Cart ({selectedSize})</span>
              </button>

              <MagneticButton
                href={buildWhatsAppUrl(whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                icon={WhatsAppIcon}
              >
                Enquire on WhatsApp
              </MagneticButton>
              <MagneticButton to="/contact" variant="silver" icon={CheckCircle2}>
                Contact Showroom
              </MagneticButton>
              <MagneticButton to="/showroom" variant="silver" icon={ArrowLeft}>
                All Models
              </MagneticButton>
            </div>
          </motion.div>
        </div>

        {/* Adjacent Model Navigation */}
        <nav className="detail-pager" aria-label="Adjacent AXOR models">
          <Link to={`/showroom/${prevSlot.id}`} className="detail-pager__link">
            <ArrowLeft size={16} aria-hidden="true" />
            <div>
              <span className="detail-pager__kicker">Previous Model</span>
              <span className="detail-pager__name">{prevSlot.title}</span>
            </div>
          </Link>

          <Link to={`/showroom/${nextSlot.id}`} className="detail-pager__link detail-pager__link--next">
            <div>
              <span className="detail-pager__kicker">Next Model</span>
              <span className="detail-pager__name">{nextSlot.title}</span>
            </div>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </nav>

        {/* Stage 6.10 Customer Reviews & Ratings */}
        <ProductReviewsSection productId={slot.id} productTitle={slot.title} />
      </div>
    </div>
  );
}
