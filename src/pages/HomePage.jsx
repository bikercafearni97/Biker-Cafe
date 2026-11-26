import { lazy, Suspense, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });
import { ArrowDownRight, ArrowRight, Compass, Layers, ShieldCheck } from 'lucide-react';
import {
  PRICE_DISCLAIMER,
  SHOWROOM_PILLARS,
  SHOWROOM_SLOTS,
} from '../data/showroomPlaceholders';
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
              <div className="craft__note">
                <span className="craft__note-key">01 // VISOR OPTICS</span>
                <span className="craft__note-val">[Optical Grade Specs Pending Client Input]</span>
              </div>
              <div className="craft__note">
                <span className="craft__note-key">02 // SHELL COMPOSITE</span>
                <span className="craft__note-val">[Carbon / Fiberglass Specs Pending]</span>
              </div>
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
    </div>
  );
}
