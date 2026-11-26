import { lazy, Suspense, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Check,
  CheckCircle2,
  Image as ImageIcon,
  ShieldAlert,
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
import MagneticButton from '../components/ui/MagneticButton';
import WhatsAppIcon from '../components/ui/WhatsAppIcon';
import PageSeo from '../components/seo/PageSeo';
import './HelmetDetailPage.css';

const HelmetStage = lazy(() => import('../components/three/HelmetStage'));

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

  const slotIndex = SHOWROOM_SLOTS.findIndex((item) => item.id === id);
  const slot = slotIndex >= 0 ? SHOWROOM_SLOTS[slotIndex] : null;

  const defaultFinish =
    SHOWROOM_FINISHES.find((f) => f.id === slot?.previewFinish) || SHOWROOM_FINISHES[0];
  const [prevSlotId, setPrevSlotId] = useState(id);
  const [selectedFinish, setSelectedFinish] = useState(defaultFinish);

  if (id !== prevSlotId) {
    setPrevSlotId(id);
    setSelectedFinish(defaultFinish);
    setMediaView('photo');
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
    SHOWROOM_SLOTS[(slotIndex - 1 + SHOWROOM_SLOTS.length) % SHOWROOM_SLOTS.length];
  const nextSlot = SHOWROOM_SLOTS[(slotIndex + 1) % SHOWROOM_SLOTS.length];
  const webpSrc = slot.image.replace(/\.(jpe?g|png)$/i, '.webp');
  const imgSize = slot.id === 'axor-retro-jet' ? 1080 : 1200;

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
                      Product Photo
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
                        src={slot.image}
                        alt={`${slot.title} — ${slot.subtitle}`}
                        width={imgSize}
                        height={imgSize}
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                      />
                    </picture>
                  </div>
                  <p className="detail-media-caption">
                    {slot.title} &mdash; Product photograph
                  </p>
                </div>
              ) : (
                <div className="detail-3d-view" role="tabpanel" aria-label="3D Preview view">
                  <Suspense fallback={<DetailStageFallback />}>
                    <HelmetStage
                      initialFinishId={slot.previewFinish}
                      onFinishChange={setSelectedFinish}
                    />
                  </Suspense>
                  <p className="detail-media-caption detail-media-caption--3d">
                    Interactive 3D concept preview for finish &amp; visor demonstration &mdash; not
                    an exact replica of the AXOR shell graphics.
                  </p>
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

            {/* Fitting Size Reference (No stock claim) */}
            <div className="detail-sizes">
              <div className="detail-sizes__head">
                <span>Fitting Size Reference</span>
                <span className="detail-sizes__note">Confirm availability with showroom</span>
              </div>
              <div className="detail-sizes__grid" role="group" aria-label="Fitting size reference">
                {SHOWROOM_SIZES.map((size) => {
                  const active = size === selectedSize;
                  return (
                    <button
                      key={size}
                      type="button"
                      className={`detail-size-btn ${active ? 'is-active' : ''}`}
                      onClick={() => setSelectedSize(size)}
                      aria-pressed={active}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
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
      </div>
    </div>
  );
}
