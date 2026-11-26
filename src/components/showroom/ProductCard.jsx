import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { buildWhatsAppUrl, SHOWROOM_FINISHES } from '../../data/showroomPlaceholders';
import WhatsAppIcon from '../ui/WhatsAppIcon';
import './ProductCard.css';

export default function ProductCard({ item, index = 0 }) {
  const finishPreset =
    SHOWROOM_FINISHES.find((f) => f.id === item.previewFinish) || SHOWROOM_FINISHES[0];
  const webpSrc = item.image.replace(/\.(jpe?g|png)$/i, '.webp');
  const imgSize = item.id === 'axor-retro-jet' ? 1080 : 1200;
  const whatsappHref = buildWhatsAppUrl(
    `Hello BIKER CAFE, I would like to enquire about ${item.title}.`
  );

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
      <Link
        to={`/showroom/${item.id}`}
        className="slot-card__link"
        aria-label={`View ${item.title} details`}
      >
        <div className="slot-card__sheen" aria-hidden="true" />

        <div className="slot-card__top">
          <span className="slot-card__code">{item.slotCode}</span>
          <span className="slot-card__cat">{item.category}</span>
        </div>

        {/* Genuine Official AXOR Product Photo */}
        <div className="slot-card__visual carbon-grid-bg">
          <div
            className="slot-card__aura"
            style={{
              background: `radial-gradient(circle, ${item.accentColor}28 0%, transparent 70%)`,
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
          <span className="slot-card__finish-pill">
            <span
              className="slot-card__finish-dot"
              style={{
                background: `linear-gradient(135deg, ${finishPreset.shellColor} 55%, ${finishPreset.stripeColor} 55%)`,
              }}
              aria-hidden="true"
            />
            {item.brand || 'AXOR'}
          </span>
        </div>

        <div className="slot-card__body">
          <h3 className="slot-card__title">{item.title}</h3>
          <p className="slot-card__subtitle">{item.subtitle}</p>

          <dl className="slot-card__specs">
            <div>
              <dt>Safety</dt>
              <dd>{item.certification}</dd>
            </div>
            <div>
              <dt>Shell</dt>
              <dd>{item.shellSpec}</dd>
            </div>
          </dl>
        </div>
      </Link>

      <div className="slot-card__foot">
        <div className="slot-card__price-wrap">
          <span className="slot-card__price">{item.priceLabel}</span>
          <span className="slot-card__mrp-note">
            {item.referenceNote || 'Reference MRP – confirm with showroom'}
          </span>
        </div>
        <div className="slot-card__actions">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="slot-card__wa-btn"
            aria-label={`Enquire about ${item.title} on WhatsApp`}
          >
            <WhatsAppIcon size={13} />
            <span>Enquire</span>
          </a>
          <Link to={`/showroom/${item.id}`} className="slot-card__inspect-btn" aria-label={`View full details for ${item.title}`}>
            <span>Details</span>
            <ArrowUpRight size={14} className="slot-card__arrow" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
