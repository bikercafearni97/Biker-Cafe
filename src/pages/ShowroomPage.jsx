import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Layers, ShieldAlert, Sparkles } from 'lucide-react';
import {
  PRICE_DISCLAIMER,
  REFERENCE_MRP_LABEL,
  SHOWROOM_CATEGORIES,
  SHOWROOM_FINISHES,
  SHOWROOM_SLOTS,
} from '../data/showroomPlaceholders';
import FilterBar from '../components/showroom/FilterBar';
import ProductCard from '../components/showroom/ProductCard';
import PlaceholderBadge from '../components/ui/PlaceholderBadge';
import ClosingShowcase from '../components/showroom/ClosingShowcase';
import PageSeo from '../components/seo/PageSeo';
import './ShowroomPage.css';

export default function ShowroomPage() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredSlots = useMemo(() => {
    if (activeCategory === 'All') return SHOWROOM_SLOTS;
    return SHOWROOM_SLOTS.filter((slot) => slot.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="showroom-page">
      <PageSeo
        title="AXOR Helmet Showroom | BIKER CAFE — ARNI"
        description="Browse six ECE, DOT, and ISI certified AXOR helmet models at BIKER CAFE Arni, including Apex Hunter, Apex Venomous, Apex Ascetic, Agera, Retro Jet, and Brutale Airwaves."
        robots="index, follow"
      />
      {/* Showroom Banner */}
      <section className="showroom-hero">
        <div className="container showroom-hero__grid">
          <motion.div
            className="showroom-hero__inner"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="showroom-hero__top">
              <span className="eyebrow">Biker Cafe // Curated Helmet Showroom</span>
              <PlaceholderBadge>{REFERENCE_MRP_LABEL}</PlaceholderBadge>
            </div>

            <h1 className="showroom-hero__title">
              AXOR <span className="metallic-text">HELMET SHOWROOM</span>
            </h1>

            <p className="showroom-hero__copy">
              Explore curated AXOR full-face sport-touring, performance aero, and classic open-face
              models. Select any helmet to inspect its official reference details and interactive 3D
              finish preview.
            </p>

            <div className="showroom-notice" role="note">
              <ShieldAlert size={16} aria-hidden="true" />
              <span>{PRICE_DISCLAIMER}</span>
            </div>
          </motion.div>

          <motion.aside
            className="showroom-telemetry carbon-grid-bg"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Showroom overview metrics"
          >
            <div className="showroom-telemetry__head">
              <Layers size={15} aria-hidden="true" />
              <span>SHOWROOM OVERVIEW</span>
            </div>
            <dl className="showroom-telemetry__stats">
              <div>
                <dt>AXOR Models</dt>
                <dd>{String(SHOWROOM_SLOTS.length).padStart(2, '0')}</dd>
              </div>
              <div>
                <dt>Series</dt>
                <dd>{String(SHOWROOM_CATEGORIES.length - 1).padStart(2, '0')}</dd>
              </div>
              <div>
                <dt>3D Finishes</dt>
                <dd>{String(SHOWROOM_FINISHES.length).padStart(2, '0')}</dd>
              </div>
            </dl>
            <p className="showroom-telemetry__note">
              All prices displayed are reference MRPs. Contact BIKER CAFE Arni via WhatsApp or
              phone to confirm in-store pricing and availability.
            </p>
          </motion.aside>
        </div>
      </section>

      {/* Featured Brand Banner: AXOR Helmets */}
      <section className="axor-brand-band">
        <div className="container">
          <div className="axor-brand-card carbon-grid-bg">
            <div className="axor-brand-card__copy">
              <span className="axor-brand-card__kicker">Featured Helmet Brand</span>
              <h2 className="axor-brand-card__title">AXOR HELMETS</h2>
              <p className="axor-brand-card__text">
                Showcasing six AXOR models across the Apex sport-touring lineup, Agera and Brutale
                performance shells, and the classic Retro Jet open-face series.
              </p>
            </div>
            <div className="axor-brand-card__meta">
              <span className="axor-brand-card__chip">ECE / DOT / ISI Certified Lineup</span>
              <span className="axor-brand-card__sub">Available via BIKER CAFE Arni Enquiry</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filterable Product Gallery */}
      <section className="showroom-gallery section-pad">
        <div className="container">
          <FilterBar
            categories={SHOWROOM_CATEGORIES}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            totalCount={SHOWROOM_SLOTS.length}
            filteredCount={filteredSlots.length}
          />

          <motion.div className="showroom-grid" layout>
            <AnimatePresence mode="popLayout">
              {filteredSlots.map((slot, index) => (
                <ProductCard key={slot.id} item={slot} index={index} />
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredSlots.length === 0 && (
            <div className="showroom-empty">
              <Sparkles size={20} aria-hidden="true" />
              <p>No AXOR models found in this category.</p>
            </div>
          )}
        </div>
      </section>

      <ClosingShowcase />
    </div>
  );
}
