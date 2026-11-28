import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });
import { ArrowDownRight, ArrowRight, Bell, Clock, Compass, Layers, ShieldCheck } from 'lucide-react';
import {
  PRICE_DISCLAIMER,
  SHOWROOM_PILLARS,
  SHOWROOM_SLOTS,
} from '../data/showroomPlaceholders';
import {
  subscribeAnnouncementContent,
  getPromotionsContent,
  getHighlightsContent,
  DEFAULT_CMS_CONTENT,
} from '../services/homepageCmsService';
import { useCustomerData } from '../context/CustomerDataContext';
import MagneticButton from '../components/ui/MagneticButton';
import PlaceholderBadge from '../components/ui/PlaceholderBadge';
import HelmetTelemetrySVG from '../components/graphics/HelmetTelemetrySVG';
import ProductCard from '../components/showroom/ProductCard';
import ClosingShowcase from '../components/showroom/ClosingShowcase';
import PageSeo from '../components/seo/PageSeo';
import './HomePage.css';

const HelmetStage = lazy(() => import('../components/three/HelmetStage'));

function HelmetStageFallback() {
  return (
    <div className="hero__stage-fallback" aria-label="Loading 3D helmet showcase">
      <div className="hero__stage-spinner" />
      <span>Initializing 3D Showroom Stage...</span>
    </div>
  );
}

export default function HomePage({ introActive = false }) {
  const pageRef = useRef(null);
  const { recentViewed } = useCustomerData();

  // Dynamic CMS States
  const [announcement, setAnnouncement] = useState(DEFAULT_CMS_CONTENT.announcement);
  const [promotions, setPromotions] = useState(DEFAULT_CMS_CONTENT.promotions);
  const [highlights, setHighlights] = useState(DEFAULT_CMS_CONTENT.highlights);

  // Subscribe to real-time Announcement updates from Firestore
  useEffect(() => {
    const unsubscribe = subscribeAnnouncementContent((data) => {
      if (data) setAnnouncement(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchCmsData() {
      try {
        const [promoRes, hlRes] = await Promise.all([
          getPromotionsContent(),
          getHighlightsContent(),
        ]);
        if (!cancelled) {
          if (promoRes && promoRes.length > 0) setPromotions(promoRes.filter((p) => p.active !== false));
          if (hlRes && hlRes.length > 0) setHighlights(hlRes.filter((h) => h.active !== false));
        }
      } catch (err) {
        console.warn('Error fetching homepage CMS content:', err);
      }
    }
    fetchCmsData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (introActive) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let ctx;
    const frameId = requestAnimationFrame(() => {
      ctx = gsap.context(() => {
        gsap.from('.js-hero-stagger', {
          y: 26,
          opacity: 0,
          duration: 0.75,
          stagger: 0.1,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        });

        gsap.from('.js-pillar-card', {
          y: 30,
          opacity: 0,
          duration: 0.65,
          stagger: 0.12,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: '.js-pillars-grid',
            start: 'top 82%',
            once: true,
          },
        });
      }, pageRef);
    });

    return () => {
      cancelAnimationFrame(frameId);
      ctx?.revert();
    };
  }, [introActive]);

  const scrollToSection = (id) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div ref={pageRef} className="home">
      <PageSeo
        title="BIKER CAFE — ARNI | AXOR Helmets, Riding Gears & Motorcycle Accessories"
        description="Explore BIKER CAFE in Arni, Tamil Nadu — digital 3D helmet showcase, certified AXOR helmets, riding gears, bike modification, and motorcycle accessories."
        robots="index, follow"
      />

      {/* DYNAMIC RUNNING ANNOUNCEMENT BAR (Stage 6.13 CMS) */}
      {announcement?.enabled && announcement?.text && (
        <aside
          className="home-announcement-bar"
          role="region"
          aria-label="Showroom announcements"
          style={{
            backgroundColor: announcement.bgColor || '#141720',
            borderColor: announcement.accentColor || '#e11d2a',
          }}
        >
          <div className="home-announcement-bar__track">
            {/* Lead Tag */}
            <div className="home-announcement-bar__badge-wrap">
              <span className="home-announcement-bar__icon" aria-hidden="true" style={{ color: announcement.accentColor || '#e11d2a' }}>
                <Bell size={13} />
              </span>
              {announcement.badge && (
                <span className="home-announcement-bar__badge" style={{ backgroundColor: announcement.accentColor || '#e11d2a' }}>
                  {announcement.badge}
                </span>
              )}
            </div>

            {/* Continuous Marquee Ticker */}
            <div className="home-announcement-bar__marquee">
              <div className="home-announcement-bar__content">
                <span className="home-announcement-bar__text">{announcement.text}</span>
                {announcement.linkText && announcement.linkUrl && (
                  <Link
                    to={announcement.linkUrl}
                    className="home-announcement-bar__link"
                    style={{ color: announcement.accentColor || '#e11d2a' }}
                  >
                    <span>{announcement.linkText}</span>
                    <ArrowRight size={12} aria-hidden="true" />
                  </Link>
                )}
                <span className="home-announcement-bar__divider">✦</span>
                <span className="home-announcement-bar__text">{announcement.text}</span>
                {announcement.linkText && announcement.linkUrl && (
                  <Link
                    to={announcement.linkUrl}
                    className="home-announcement-bar__link"
                    style={{ color: announcement.accentColor || '#e11d2a' }}
                  >
                    <span>{announcement.linkText}</span>
                    <ArrowRight size={12} aria-hidden="true" />
                  </Link>
                )}
                <span className="home-announcement-bar__divider">✦</span>
                <span className="home-announcement-bar__text">{announcement.text}</span>
                {announcement.linkText && announcement.linkUrl && (
                  <Link
                    to={announcement.linkUrl}
                    className="home-announcement-bar__link"
                    style={{ color: announcement.accentColor || '#e11d2a' }}
                  >
                    <span>{announcement.linkText}</span>
                    <ArrowRight size={12} aria-hidden="true" />
                  </Link>
                )}
                <span className="home-announcement-bar__divider">✦</span>
                <span className="home-announcement-bar__text">{announcement.text}</span>
                {announcement.linkText && announcement.linkUrl && (
                  <Link
                    to={announcement.linkUrl}
                    className="home-announcement-bar__link"
                    style={{ color: announcement.accentColor || '#e11d2a' }}
                  >
                    <span>{announcement.linkText}</span>
                    <ArrowRight size={12} aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* HERO SECTION */}
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <div className="hero__status js-hero-stagger">
              <span className="beacon-dot" aria-hidden="true" />
              <span>BIKER CAFE // HELMET SHOWROOM</span>
              <PlaceholderBadge>AXOR Lineup</PlaceholderBadge>
            </div>

            <h1 className="hero__title js-hero-stagger">
              <span className="metallic-text">DARK CARBON</span>
              <br />
              MEETS <span className="hero__title-red">RACING</span> PRECISION
            </h1>

            <p className="hero__subtitle js-hero-stagger">
              Welcome to the BIKER CAFE digital showroom. Explore interactive 3D helmet lighting,
              aerodynamic shell architecture, and curated headwear display slots crafted for riders.
            </p>

            <div className="hero__actions js-hero-stagger">
              <MagneticButton
                variant="primary"
                icon={ArrowDownRight}
                onClick={() => scrollToSection('#collections')}
              >
                Explore AXOR Lineup
              </MagneticButton>
              <MagneticButton
                variant="silver"
                onClick={() => scrollToSection('#experience')}
              >
                Showroom Philosophy
              </MagneticButton>
            </div>

            <div className="hero__metrics js-hero-stagger">
              <div className="hero__metric">
                <ShieldCheck size={16} aria-hidden="true" />
                <div>
                  <span className="hero__metric-label">Safety Standards</span>
                  <span className="hero__metric-val">ECE 22.06 / DOT / ISI</span>
                </div>
              </div>
              <div className="hero__metric">
                <Layers size={16} aria-hidden="true" />
                <div>
                  <span className="hero__metric-label">Featured Brand</span>
                  <span className="hero__metric-val">AXOR Helmets (6 Models)</span>
                </div>
              </div>
              <div className="hero__metric">
                <Compass size={16} aria-hidden="true" />
                <div>
                  <span className="hero__metric-label">Showroom Location</span>
                  <span className="hero__metric-val">Arni, Tamil Nadu</span>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            className="hero__stage-col"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <Suspense fallback={<HelmetStageFallback />}>
              <HelmetStage suspended={introActive} />
            </Suspense>
          </motion.div>
        </div>
      </section>

      {/* MARQUEE STRIP */}
      <div className={`marquee ${introActive ? 'is-paused' : ''}`} aria-hidden="true">
        <div className="marquee__track">
          <span>BIKER CAFE SHOWROOM</span>
          <span className="marquee__sep">//</span>
          <span>AERODYNAMIC SHELL DISPLAY</span>
          <span className="marquee__sep">//</span>
          <span>PRECISION FITMENT STUDIO</span>
          <span className="marquee__sep">//</span>
          <span>METALLIC &amp; CARBON FINISHES</span>
          <span className="marquee__sep">//</span>
          <span>BIKER CAFE SHOWROOM</span>
          <span className="marquee__sep">//</span>
          <span>AERODYNAMIC SHELL DISPLAY</span>
          <span className="marquee__sep">//</span>
          <span>PRECISION FITMENT STUDIO</span>
          <span className="marquee__sep">//</span>
          <span>METALLIC &amp; CARBON FINISHES</span>
        </div>
      </div>

      {/* TELEMETRY & AERODYNAMIC CRAFT SECTION */}
      <section className="craft section-pad">
        <div className="container craft__grid">
          <motion.div
            className="craft__visual"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6 }}
          >
            <HelmetTelemetrySVG />
          </motion.div>

          <motion.div
            className="craft__copy"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6 }}
          >
            <span className="eyebrow">Aerodynamic Architecture</span>
            <h2 className="section-heading">
              Engineered Display For <span className="metallic-text">Every Riding Discipline</span>
            </h2>
            <p className="section-lead">
              From high-speed track shells to street-focused carbon builds, each display slot in the
              BIKER CAFE showroom highlights shell geometry, visor optics, and ventilation flow before
              you even step into the store.
            </p>
            <div className="craft__notes">
              {highlights.map((hl) => (
                <div key={hl.id || hl.title} className="craft__note">
                  <span className="craft__note-key">{hl.title}</span>
                  <span className="craft__note-val">{hl.detail}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* COLLECTION SLOTS SECTION */}
      <section id="collections" className="collections section-pad">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="eyebrow">Featured Brand // AXOR Helmets</span>
              <h2 className="section-heading">
                AXOR <span className="metallic-text">Helmet Collection</span>
              </h2>
            </div>
            <div className="collections__header-actions">
              <PlaceholderBadge>Reference MRP – confirm with showroom</PlaceholderBadge>
              <MagneticButton to="/showroom" variant="silver" icon={ArrowRight}>
                View Full Showroom
              </MagneticButton>
            </div>
          </div>

          <div className="collections__grid">
            {SHOWROOM_SLOTS.slice(0, 4).map((slot, index) => (
              <ProductCard key={slot.id} item={slot} index={index} />
            ))}
          </div>

          <p className="collections__disclaimer">{PRICE_DISCLAIMER}</p>
        </div>
      </section>

      {/* RECENTLY VIEWED HELMETS (Shown when user has viewed helmets) */}
      {recentViewed.length > 0 && (
        <section className="recent-viewed-section section-pad">
          <div className="container">
            <div className="section-header">
              <div>
                <span className="eyebrow">Personal Session // Browsing History</span>
                <h2 className="section-heading">
                  Recently <span className="metallic-text">Viewed Helmets</span>
                </h2>
              </div>
              <Link to="/profile" className="recent-viewed-link">
                <Clock size={15} aria-hidden="true" />
                <span>View Rider Profile</span>
              </Link>
            </div>

            <div className="recent-viewed-grid">
              {recentViewed.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  to={`/showroom/${item.id}`}
                  className="recent-viewed-card"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    width={96}
                    height={96}
                    loading="lazy"
                  />
                  <div className="recent-viewed-card__body">
                    <strong>{item.title}</strong>
                    <span>{item.category}</span>
                    <span className="recent-viewed-card__price">{item.priceLabel}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SHOWROOM EXPERIENCE PILLARS */}
      <section id="experience" className="pillars section-pad">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="eyebrow">The Showroom Standard</span>
              <h2 className="section-heading">
                Inside <span className="hero__title-red">BIKER CAFE</span>
              </h2>
            </div>
          </div>

          <div className="pillars__grid js-pillars-grid">
            {SHOWROOM_PILLARS.map((pillar) => (
              <article key={pillar.index} className="pillar-card js-pillar-card">
                <div className="pillar-card__head">
                  <span className="pillar-card__index">{pillar.index}</span>
                  <span className="pillar-card__metric">{pillar.metric}</span>
                </div>
                <h3 className="pillar-card__title">{pillar.title}</h3>
                <p className="pillar-card__desc">{pillar.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING SHOWCASE */}
      <ClosingShowcase />

      {/* PROMOTIONAL SHOWCASE CARDS (Stage 6.13 CMS) */}
      {promotions.length > 0 && (
        <section className="home-promos-section section-pad">
          <div className="container">
            <div className="section-header">
              <div>
                <span className="eyebrow">Showroom Offers &amp; Updates</span>
                <h2 className="section-heading">
                  Exclusive <span className="metallic-text">Rider Promotions</span>
                </h2>
              </div>
            </div>

            <div className="home-promos-grid">
              {promotions.map((promo) => (
                <article key={promo.id} className="home-promo-card">
                  {promo.imageUrl && (
                    <div className="home-promo-card__media">
                      <img src={promo.imageUrl} alt={promo.title} loading="lazy" />
                    </div>
                  )}
                  <div className="home-promo-card__body">
                    {promo.badge && <span className="home-promo-card__badge">{promo.badge}</span>}
                    <h3 className="home-promo-card__title">{promo.title}</h3>
                    {promo.subtitle && <strong className="home-promo-card__subtitle">{promo.subtitle}</strong>}
                    <p className="home-promo-card__desc">{promo.description}</p>
                    {promo.ctaLink && (
                      <Link to={promo.ctaLink} className="home-promo-card__cta">
                        <span>{promo.ctaText || 'Learn More'}</span>
                        <ArrowRight size={14} aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
